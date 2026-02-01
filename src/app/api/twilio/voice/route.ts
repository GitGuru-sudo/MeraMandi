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

    if (!CallSid) {
        return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Missing call session.</Say><Hangup/></Response>`);
    }

    const existing = await CallSession.findOne({ callSid: CallSid });
    const step = normalizeText(form.get('step')) || existing?.step || 'start';

    const session = existing || (await CallSession.create({ callSid: CallSid, from: From, step: 'start' }));

    // Step router
    if (step === 'start') {
        session.step = 'ask_name';
        await session.save();

        const actionUrl = `/api/twilio/voice?step=ask_name`;
        return xmlResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Welcome to Meri Mandi registration.</Say>
  <Gather input="speech" action="${actionUrl}" method="POST" speechTimeout="auto">
    <Say>Please say your full name.</Say>
  </Gather>
  <Say>Sorry, I did not hear that.</Say>
  <Redirect method="POST">/api/twilio/voice</Redirect>
</Response>`
        );
    }

    if (step === 'ask_name') {
        if (SpeechResult) {
            session.name = SpeechResult;
        }
        session.step = 'ask_state';
        await session.save();

        const actionUrl = `/api/twilio/voice?step=ask_state`;
        return xmlResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${actionUrl}" method="POST" speechTimeout="auto">
    <Say>Thanks. Now say your state. For example, Haryana.</Say>
  </Gather>
  <Say>Sorry, I did not hear that.</Say>
  <Redirect method="POST">/api/twilio/voice?step=ask_state</Redirect>
</Response>`
        );
    }

    if (step === 'ask_state') {
        const guessed = guessState(SpeechResult);
        if (guessed) {
            session.state = guessed;
            session.step = 'ask_district';
            await session.save();

            const actionUrl = `/api/twilio/voice?step=ask_district`;
            return xmlResponse(
                `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${actionUrl}" method="POST" speechTimeout="auto">
    <Say>Great. Now say your district in ${escapeXml(guessed)}.</Say>
  </Gather>
  <Say>Sorry, I did not hear that.</Say>
  <Redirect method="POST">/api/twilio/voice?step=ask_district</Redirect>
</Response>`
            );
        }

        // Could not match
        const retryUrl = `/api/twilio/voice?step=ask_state`;
        return xmlResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>I could not match the state. Please say it again.</Say>
  <Gather input="speech" action="${retryUrl}" method="POST" speechTimeout="auto">
    <Say>Say your state now.</Say>
  </Gather>
  <Redirect method="POST">/api/twilio/voice?step=ask_state</Redirect>
</Response>`
        );
    }

    if (step === 'ask_district') {
        if (!session.state) {
            session.step = 'ask_state';
            await session.save();
            return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Redirect method="POST">/api/twilio/voice?step=ask_state</Redirect></Response>`);
        }

        const guessed = guessDistrict(session.state, SpeechResult);
        if (guessed) {
            session.district = guessed;
            session.step = 'ask_crop';
            await session.save();

            const actionUrl = `/api/twilio/voice?step=ask_crop`;
            return xmlResponse(
                `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${actionUrl}" method="POST" speechTimeout="auto">
    <Say>Thanks. Now say your preferred crop. For example wheat, cotton, or say all crops.</Say>
  </Gather>
  <Say>Sorry, I did not hear that.</Say>
  <Redirect method="POST">/api/twilio/voice?step=ask_crop</Redirect>
</Response>`
            );
        }

        const retryUrl = `/api/twilio/voice?step=ask_district`;
        return xmlResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>I could not match the district in ${escapeXml(session.state)}. Please say it again.</Say>
  <Gather input="speech" action="${retryUrl}" method="POST" speechTimeout="auto">
    <Say>Say your district now.</Say>
  </Gather>
  <Redirect method="POST">/api/twilio/voice?step=ask_district</Redirect>
</Response>`
        );
    }

    if (step === 'ask_crop') {
        const crop = guessCrop(SpeechResult || '');
        session.preferredCrop = crop;

        // Set mandi = district (your app uses district as default mandi sometimes)
        session.mandi = session.district || 'All Mandis';
        session.step = 'finalize';
        await session.save();

        const actionUrl = `/api/twilio/voice?step=finalize`;
        return xmlResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="dtmf" numDigits="1" action="${actionUrl}" method="POST" timeout="8">
    <Say>To confirm registration, press 1. To restart, press 2.</Say>
  </Gather>
  <Redirect method="POST">/api/twilio/voice?step=finalize</Redirect>
</Response>`
        );
    }

    if (step === 'finalize') {
        const Digits = normalizeText(form.get('Digits'));
        if (Digits === '2') {
            await CallSession.deleteOne({ callSid: CallSid });
            return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Restarting.</Say><Redirect method="POST">/api/twilio/voice</Redirect></Response>`);
        }

        if (Digits && Digits !== '1') {
            return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Invalid input.</Say><Redirect method="POST">/api/twilio/voice?step=finalize</Redirect></Response>`);
        }

        if (!session.name || !session.state || !session.district || !session.preferredCrop) {
            session.step = 'ask_name';
            await session.save();
            return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Missing details. Let's try again.</Say><Redirect method="POST">/api/twilio/voice</Redirect></Response>`);
        }

        const cleanPhone = normalizePhoneTo10Digits(From);

        // Create or update user by phone (matches your createAlert behavior)
        let user = await User.findOne({ phone: cleanPhone });
        if (!user) {
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
            snapshot = await buildMarketSnapshot(session.state, session.district, session.preferredCrop);
            if (snapshot) {
                user.registrationMarketData = snapshot;
            }
        } catch (e) {
            console.error('Market snapshot capture failed (voice):', e);
        }

        await user.save();

        // SMS summary
        const to = From;
        try {
            if (snapshot) {
                await sendSMS(
                    to,
                    `✅ MeriMandi Registration Complete!\nName: ${session.name}\nLocation: ${session.district}\nCrop: ${session.preferredCrop}\nLowest: ₹${snapshot.minPrice}\nMarket: ₹${snapshot.modalPrice}\nHighest: ₹${snapshot.maxPrice}\nMandi: ${snapshot.mandiName}`
                );
            } else {
                await sendSMS(
                    to,
                    `✅ MeriMandi Registration Complete!\nName: ${session.name}\nLocation: ${session.district}\nCrop: ${session.preferredCrop}\nNote: Live price data not available right now.`
                );
            }
        } catch (e) {
            console.error('Voice registration SMS failed:', e);
        }

        await CallSession.deleteOne({ callSid: CallSid });

        return xmlResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Registration complete. We have sent you an SMS with your preferred crop prices. Thank you.</Say>
  <Hangup/>
</Response>`
        );
    }

    // Fallback
    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Redirect method="POST">/api/twilio/voice</Redirect></Response>`);
}
