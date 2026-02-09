import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CallSession from '@/models/CallSession';
import User from '@/models/User';
import { fetchMandiPrices } from '@/services/govApi';
import { sendSMS } from '@/services/notifier';
import { INDIAN_LOCATIONS } from '@/constants/locations';

function xmlResponse(xml: string) {
    return new NextResponse(xml, {
        status: 200,
        headers: {
            'Content-Type': 'text/xml',
            'Cache-Control': 'no-store',
        },
    });
}

function escapeXml(s: string) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function normalizeText(input: any): string {
    return String(input || '').trim();
}

function normalizePhoneTo10Digits(from: string): string {
    const digits = String(from || '').replace(/\D/g, '');
    // Twilio usually sends +91XXXXXXXXXX or +1XXXXXXXXXX
    if (digits.length === 10) return digits;
    if (digits.length > 10) return digits.slice(-10);
    return digits;
}

function guessState(spoken: string): string | null {
    const s = spoken.toLowerCase();
    const states = Object.keys(INDIAN_LOCATIONS);
    const exact = states.find(st => st.toLowerCase() === s);
    if (exact) return exact;
    const contains = states.find(st => st.toLowerCase().includes(s) || s.includes(st.toLowerCase()));
    return contains || null;
}

function guessDistrict(state: string, spoken: string): string | null {
    const districts = (INDIAN_LOCATIONS as any)[state] as string[] | undefined;
    if (!districts) return null;
    const s = spoken.toLowerCase();
    const exact = districts.find(d => d.toLowerCase() === s);
    if (exact) return exact;
    const contains = districts.find(d => d.toLowerCase().includes(s) || s.includes(d.toLowerCase()));
    return contains || null;
}

function guessCrop(spoken: string): string {
    const s = spoken.toLowerCase();
    if (!s) return 'All Crops';
    if (s.includes('all')) return 'All Crops';
    if (s.includes('wheat')) return 'Wheat';
    if (s.includes('cotton')) return 'Cotton';
    if (s.includes('rice')) return 'Rice';
    if (s.includes('paddy')) return 'Paddy';
    if (s.includes('mustard')) return 'Mustard';
    return spoken.trim();
}

async function buildMarketSnapshot(state: string, district: string, preferredCrop: string) {
    const allPrices = await fetchMandiPrices(process.env.GOV_API_KEY, state, district);
    const matches = allPrices.filter((p: any) => {
        const commodityMatch = (preferredCrop === 'All' || preferredCrop === 'All Crops') || p.commodity.toLowerCase() === preferredCrop.toLowerCase();
        return commodityMatch;
    });

    if (matches.length === 0) return null;

    const sortedByMin = [...matches].sort((a, b) => parseFloat(a.min_price) - parseFloat(b.min_price));
    const sortedByMax = [...matches].sort((a, b) => parseFloat(b.max_price) - parseFloat(a.max_price));
    const minRecord = sortedByMin[0];
    const maxRecord = sortedByMax[0];

    const modalAvg = matches.reduce((acc: number, p: any) => acc + parseFloat(p.modal_price), 0) / matches.length;
    const modalVal = Math.round(modalAvg);

    const minPrice = parseFloat(minRecord.min_price);
    const maxPrice = parseFloat(maxRecord.max_price);

    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || !Number.isFinite(modalVal) || !maxRecord.market) {
        return null;
    }

    return {
        state,
        district,
        minPrice,
        maxPrice,
        modalPrice: modalVal,
        mandiName: maxRecord.market,
        commodity: preferredCrop,
        fetchedAt: new Date(),
    };
}

export async function POST(request: Request) {
    await dbConnect();

    const form = await request.formData();
    const CallSid = normalizeText(form.get('CallSid'));
    const From = normalizeText(form.get('From'));
    const SpeechResult = normalizeText(form.get('SpeechResult'));

    console.log('[Voice Agent] ===== INCOMING CALL =====');
    console.log('[Voice Agent] CallSid:', CallSid);
    console.log('[Voice Agent] From:', From);
    console.log('[Voice Agent] SpeechResult:', SpeechResult);

    if (!CallSid) {
        console.error('[Voice Agent] Missing CallSid, rejecting call');
        return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Missing call session.</Say><Hangup/></Response>`);
    }

    const existing = await CallSession.findOne({ callSid: CallSid });
    const step = normalizeText(form.get('step')) || existing?.step || 'start';

    const session = existing || (await CallSession.create({ callSid: CallSid, from: From, step: 'start' }));

    console.log('[Voice Agent] Step:', step);
    console.log('[Voice Agent] Session data:', { name: session.name, state: session.state, district: session.district, crop: session.preferredCrop });

    // Step router
    if (step === 'start') {
        console.log('[Voice Agent] Starting welcome flow');
        session.step = 'ask_name';
        await session.save();

        const actionUrl = `/api/twilio/voice?step=ask_name`;
        return xmlResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Welcome to Meri Mandi. I will help you check the latest commodity prices.</Say>
  <Gather input="speech" action="${actionUrl}" method="POST" speechTimeout="auto" maxSpeechTime="5">
    <Say>Please say your full name.</Say>
  </Gather>
  <Say>Sorry, I did not hear that.</Say>
  <Redirect method="POST">/api/twilio/voice</Redirect>
</Response>`
        );
    }

    if (step === 'ask_name') {
        if (SpeechResult) {
            console.log('[Voice Agent] Captured name:', SpeechResult);
            session.name = SpeechResult;
        } else {
            console.warn('[Voice Agent] No name captured, retrying');
        }
        session.step = 'ask_state';
        await session.save();

        const actionUrl = `/api/twilio/voice?step=ask_state`;
        return xmlResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${actionUrl}" method="POST" speechTimeout="auto" maxSpeechTime="5">
    <Say>Thanks ${SpeechResult ? escapeXml(SpeechResult) : ''}. Now say your state. For example, Haryana or Punjab.</Say>
  </Gather>
  <Say>Sorry, I did not hear that.</Say>
  <Redirect method="POST">/api/twilio/voice?step=ask_state</Redirect>
</Response>`
        );
    }

    if (step === 'ask_state') {
        const guessed = guessState(SpeechResult);
        console.log('[Voice Agent] State input:', SpeechResult, '-> Guessed:', guessed);
        
        if (guessed) {
            session.state = guessed;
            session.step = 'ask_district';
            await session.save();

            const actionUrl = `/api/twilio/voice?step=ask_district`;
            return xmlResponse(
                `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${actionUrl}" method="POST" speechTimeout="auto" maxSpeechTime="5">
    <Say>Great. Now say your district in ${escapeXml(guessed)}.</Say>
  </Gather>
  <Say>Sorry, I did not hear that.</Say>
  <Redirect method="POST">/api/twilio/voice?step=ask_district</Redirect>
</Response>`
            );
        }

        // Could not match
        console.warn('[Voice Agent] Failed to match state, asking again');
        const retryUrl = `/api/twilio/voice?step=ask_state`;
        return xmlResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>I could not match the state. Please say it again. For example Punjab or Haryana.</Say>
  <Gather input="speech" action="${retryUrl}" method="POST" speechTimeout="auto" maxSpeechTime="5">
    <Say>Say your state now.</Say>
  </Gather>
  <Redirect method="POST">/api/twilio/voice?step=ask_state</Redirect>
</Response>`
        );
    }

    if (step === 'ask_district') {
        if (!session.state) {
            console.error('[Voice Agent] Missing state, redirecting to ask_state');
            session.step = 'ask_state';
            await session.save();
            return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Redirect method="POST">/api/twilio/voice?step=ask_state</Redirect></Response>`);
        }

        const guessed = guessDistrict(session.state, SpeechResult);
        console.log('[Voice Agent] District input for', session.state, ':', SpeechResult, '-> Guessed:', guessed);
        
        if (guessed) {
            session.district = guessed;
            session.step = 'ask_crop';
            await session.save();

            const actionUrl = `/api/twilio/voice?step=ask_crop`;
            return xmlResponse(
                `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${actionUrl}" method="POST" speechTimeout="auto" maxSpeechTime="5">
    <Say>Thanks. Now say your preferred crop. For example wheat, cotton, rice, or say all crops.</Say>
  </Gather>
  <Say>Sorry, I did not hear that.</Say>
  <Redirect method="POST">/api/twilio/voice?step=ask_crop</Redirect>
</Response>`
            );
        }

        console.warn('[Voice Agent] Failed to match district in', session.state, ', asking again');
        const retryUrl = `/api/twilio/voice?step=ask_district`;
        return xmlResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>I could not match the district in ${escapeXml(session.state)}. Please say it again.</Say>
  <Gather input="speech" action="${retryUrl}" method="POST" speechTimeout="auto" maxSpeechTime="5">
    <Say>Say your district now.</Say>
  </Gather>
  <Redirect method="POST">/api/twilio/voice?step=ask_district</Redirect>
</Response>`
        );
    }

    if (step === 'ask_crop') {
        const crop = guessCrop(SpeechResult || '');
        console.log('[Voice Agent] Crop input:', SpeechResult, '-> Normalized:', crop);
        
        session.preferredCrop = crop;
        session.mandi = session.district || 'All Mandis';
        session.step = 'finalize';
        await session.save();

        const actionUrl = `/api/twilio/voice?step=finalize`;
        const summary = `${session.name} from ${session.district}, ${session.state}, checking prices for ${crop}`;
        console.log('[Voice Agent] Summary before confirmation:', summary);
        
        const safeName = session.name || 'Friend';
        const safeDistrict = session.district || 'your district';
        const safeState = session.state || 'your state';
        
        return xmlResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Let me confirm your details. You are ${escapeXml(safeName)} from ${escapeXml(safeDistrict)} district, ${escapeXml(safeState)} state. Your preference is ${escapeXml(crop)}.</Say>
  <Gather input="dtmf" numDigits="1" action="${actionUrl}" method="POST" timeout="8">
    <Say>To confirm and get prices, press 1. To restart, press 2.</Say>
  </Gather>
  <Redirect method="POST">/api/twilio/voice?step=finalize</Redirect>
</Response>`
        );
    }

    if (step === 'finalize') {
        const Digits = normalizeText(form.get('Digits'));
        console.log('[Voice Agent] Finalize - Digits pressed:', Digits);
        
        if (Digits === '2') {
            console.log('[Voice Agent] User chose to restart');
            await CallSession.deleteOne({ callSid: CallSid });
            return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Restarting.</Say><Redirect method="POST">/api/twilio/voice</Redirect></Response>`);
        }

        if (Digits && Digits !== '1') {
            console.warn('[Voice Agent] Invalid DTMF input:', Digits);
            return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Invalid input. Please press 1 or 2.</Say><Redirect method="POST">/api/twilio/voice?step=finalize</Redirect></Response>`);
        }

        if (!session.name || !session.state || !session.district || !session.preferredCrop) {
            console.error('[Voice Agent] Missing required fields, restarting:', { name: session.name, state: session.state, district: session.district, crop: session.preferredCrop });
            session.step = 'ask_name';
            await session.save();
            return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Missing details. Let's try again.</Say><Redirect method="POST">/api/twilio/voice</Redirect></Response>`);
        }

        const cleanPhone = normalizePhoneTo10Digits(From);
        console.log('[Voice Agent] Registering user - Phone:', cleanPhone, 'Name:', session.name);

        // Create or update user by phone
        let user = await User.findOne({ phone: cleanPhone });
        if (!user) {
            console.log('[Voice Agent] Creating new user');
            user = await User.create({
                phone: cleanPhone,
                name: session.name,
                preferredCrop: session.preferredCrop,
                location: {
                    state: session.state,
                    district: session.district,
                    mandi: session.mandi || session.district,
                },
                isPhoneVerified: true,
                isEmailVerified: false,
            });
        } else {
            console.log('[Voice Agent] Updating existing user');
            user.name = session.name;
            user.preferredCrop = session.preferredCrop;
            user.location = {
                state: session.state,
                district: session.district,
                mandi: session.mandi || session.district,
            };
        }

        // Save snapshot
        let snapshot: any = null;
        try {
            console.log('[Voice Agent] Fetching market prices for', session.state, session.district, session.preferredCrop);
            snapshot = await buildMarketSnapshot(session.state, session.district, session.preferredCrop);
            if (snapshot) {
                console.log('[Voice Agent] Market snapshot:', snapshot);
                user.registrationMarketData = snapshot;
            } else {
                console.warn('[Voice Agent] No price data available');
            }
        } catch (e) {
            console.error('[Voice Agent] Market snapshot capture failed:', e);
        }

        await user.save();
        console.log('[Voice Agent] User saved to database');

        // SMS summary - 3 separate messages
        const to = From;
        try {
            if (snapshot) {
                // MSG 1: Minimum Price
                const msg1 = `Min: ₹${snapshot.minPrice} - ${session.preferredCrop} at ${snapshot.mandiName}`;
                console.log('[Voice Agent] Sending SMS 1 (Min) to:', to);
                await sendSMS(to, msg1);

                // MSG 2: Maximum Price
                const msg2 = `Max: ₹${snapshot.maxPrice} - ${session.preferredCrop} at ${snapshot.mandiName}`;
                console.log('[Voice Agent] Sending SMS 2 (Max) to:', to);
                await sendSMS(to, msg2);

                // MSG 3: Market Rate
                const msg3 = `Market Rate: ₹${snapshot.modalPrice} - ${session.preferredCrop}. Confirmed!`;
                console.log('[Voice Agent] Sending SMS 3 (Market) to:', to);
                await sendSMS(to, msg3);
            } else {
                const smsBody = `${session.preferredCrop} prices unavailable. Visit MeriMandi app for details.`;
                console.log('[Voice Agent] Sending SMS (no prices) to:', to);
                await sendSMS(to, smsBody);
            }
        } catch (e) {
            console.error('[Voice Agent] SMS sending failed:', e);
        }

        await CallSession.deleteOne({ callSid: CallSid });
        console.log('[Voice Agent] Call session cleaned up');

        return xmlResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Registration complete. We have sent you an SMS with your preferred crop prices. Thank you for using Meri Mandi.</Say>
  <Hangup/>
</Response>`
        );
    }

    // Fallback
    console.warn('[Voice Agent] Unexpected step, redirecting:', step);
    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Redirect method="POST">/api/twilio/voice</Redirect></Response>`);
}
