'use server'

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Alert from '@/models/Alert';
import { revalidatePath } from 'next/cache';
import { sendSMS } from '@/services/notifier';
import { sendConfirmationEmail } from '@/services/emailer';

export async function createAlert(prevState: any, formData: FormData) {
    try {
        const name = formData.get('name') as string;
        const phone = formData.get('phone') as string;
        const email = formData.get('email') as string;
        const state = formData.get('state') as string;
        const district = formData.get('district') as string;
        const mandi = formData.get('mandi') as string;
        const commodity = formData.get('commodity') as string;
        const targetPrice = parseFloat(formData.get('targetPrice') as string);

        let schedules = [];
        try {
            const schedulesStr = formData.get('schedules') as string;
            if (schedulesStr) {
                schedules = JSON.parse(schedulesStr);
            }
        } catch (e) {
            console.error('Failed to parse schedules:', e);
            schedules = [{ day: 'Everyday', time: '09:00' }]; // Fallback
        }

        if (!phone) {
            return { message: 'Phone number is required. Please login.', success: false };
        }

        // Mandi and targetPrice are now optional in the simplified UI
        const finalMandi = mandi || 'All Mandis';
        const finalCommodity = commodity || 'All Crops';
        const finalTargetPrice = isNaN(targetPrice) ? 0 : targetPrice;

        // Validate and Format Phone Number
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            return { message: 'Please enter a valid phone number', success: false };
        }

        let fullPhoneNumber = '';
        if (phone.startsWith('+')) {
            fullPhoneNumber = `+${cleanPhone}`;
        } else if (cleanPhone.length === 10) {
            // Heuristic: Indian mobile numbers (10 digits) usually start with 6, 7, 8, or 9
            if (/^[6-9]/.test(cleanPhone)) {
                fullPhoneNumber = `+91${cleanPhone}`;
            } else {
                // Assume North America (+1) for other 10-digit numbers (like 437 area code)
                fullPhoneNumber = `+1${cleanPhone}`;
            }
        } else {
            // Fallback for longer numbers without a +
            fullPhoneNumber = `+${cleanPhone}`;
        }



        // 1. Fetch Market Data Context (Do this early for registration data)
        let marketData: any = null;

        const isValidMarketData = (data: any) => {
            return Boolean(
                data &&
                typeof data.minPrice === 'number' && Number.isFinite(data.minPrice) &&
                typeof data.maxPrice === 'number' && Number.isFinite(data.maxPrice) &&
                typeof data.modalPrice === 'number' && Number.isFinite(data.modalPrice) &&
                typeof data.mandiName === 'string' && data.mandiName.trim().length > 0
            );
        };

        try {
            const allPrices = await import('@/services/govApi').then(m => m.fetchMandiPrices(process.env.GOV_API_KEY));
            const matches = allPrices.filter((p: any) => {
                const stateMatch = p.state.toLowerCase() === state.toLowerCase();
                const districtMatch = p.district.toLowerCase() === district.toLowerCase();
                const commodityMatch = (finalCommodity === 'All' || finalCommodity === 'All Crops') || p.commodity.toLowerCase() === finalCommodity.toLowerCase();
                const mandiMatch = (finalMandi === 'All' || finalMandi === 'All Mandis' || !finalMandi) || p.market.toLowerCase() === finalMandi.toLowerCase();
                return stateMatch && districtMatch && commodityMatch && mandiMatch;
            });

            if (matches.length > 0) {
                const sortedByMin = [...matches].sort((a, b) => parseFloat(a.min_price) - parseFloat(b.min_price));
                const sortedByMax = [...matches].sort((a, b) => parseFloat(b.max_price) - parseFloat(a.max_price));

                const minRecord = sortedByMin[0];
                const maxRecord = sortedByMax[0];
                const representative = maxRecord;

                marketData = {
                    state,
                    district,
                    minPrice: parseFloat(minRecord.min_price),
                    maxPrice: parseFloat(maxRecord.max_price),
                    modalPrice: parseFloat(representative.modal_price),
                    mandiName: representative.market,
                    commodity: finalCommodity,
                    fetchedAt: new Date()
                }
            }
        } catch (e) {
            console.error('Error fetching market context:', e);
        }

        await dbConnect();

        // 1. Find or Create User
        let user = await User.findOne({ phone: cleanPhone });
        if (!user) {
            user = await User.create({
                name,
                phone: cleanPhone,
                email,
                location: { state, district },
                registrationMarketData: marketData || undefined
            });
        } else {
            // Update name/email if changed
            let shouldSave = false;
            if ((name && user.name !== name) || (email && user.email !== email)) {
                if (name) user.name = name;
                if (email) user.email = email;
                shouldSave = true;
            }

            // Capture market data if missing or invalid (prevents undefined SMS fields)
            if (isValidMarketData(marketData) && !isValidMarketData(user.registrationMarketData)) {
                user.registrationMarketData = marketData;
                shouldSave = true;
            }

            if (shouldSave) await user.save();
        }

        // 2. Create Alert
        await Alert.create({
            user: user._id,
            state,
            district,
            mandi: finalMandi,
            commodity: finalCommodity,
            targetPrice: finalTargetPrice,
            schedules,
            email,
        });

        // 3. Send 3-Part Realtime Data Confirmation (Using STORED User Data)
        try {
            const stored = user.registrationMarketData;

            const commodityMatches = (storedCommodity: any, requested: string) => {
                if (!storedCommodity || !requested) return false;
                if (requested === 'All' || requested === 'All Crops') return true;
                return String(storedCommodity).toLowerCase() === String(requested).toLowerCase();
            };

            const storedMatchesAlert = Boolean(
                stored &&
                isValidMarketData(stored) &&
                stored.state && stored.district &&
                String(stored.state).toLowerCase() === String(state).toLowerCase() &&
                String(stored.district).toLowerCase() === String(district).toLowerCase() &&
                commodityMatches(stored.commodity, finalCommodity)
            );

            // Prefer stored snapshot (captured on login/register), fall back to freshly fetched if needed.
            const data = storedMatchesAlert
                ? stored
                : (isValidMarketData(marketData) ? marketData : null);

            if (data) {
                const minText = Number.isFinite(data.minPrice) ? data.minPrice : 'N/A';
                const maxText = Number.isFinite(data.maxPrice) ? data.maxPrice : 'N/A';
                const modalText = Number.isFinite(data.modalPrice) ? data.modalPrice : 'N/A';
                const mandiText = (typeof data.mandiName === 'string' && data.mandiName.trim().length > 0) ? data.mandiName : 'N/A';

                const msgs = [
                    `✅ Mandi Alerts Active!\nLocation: ${district}\nCrop: ${finalCommodity}\nLowest Rate: ₹${minText}\nMandi: ${mandiText} (or local low)`,
                    `✅ Mandi Alerts Active!\nLocation: ${district}\nCrop: ${finalCommodity}\nHighest Rate: ₹${maxText}\nMandi: ${mandiText} (or local high)`,
                    `✅ Mandi Alerts Active!\nLocation: ${district}\nCrop: ${finalCommodity}\nMarket Rate: ₹${modalText}\nMandi: ${mandiText}`
                ];

                for (const msg of msgs) {
                    await sendSMS(fullPhoneNumber, msg);
                }
            } else {
                await sendSMS(fullPhoneNumber, `✅ Mandi Alerts Active!\nLocation: ${district}\nCrop: ${finalCommodity}\nNote: No live data available right now. Updates will come soon.`);
            }
        } catch (error) {
            console.error('Error in confirmation SMS:', error);
            await sendSMS(fullPhoneNumber, `✅ Mandi Alerts Active!\nLocation: ${district}\nCrop: ${finalCommodity}\nStatus: Regular updates scheduled.`);
        }

        // 4. Send Confirmation Email
        if (email) {
            sendConfirmationEmail(email, name, schedules).catch(console.error);
        }

        revalidatePath('/');
        return { success: true, message: 'Alert created! Confirmation sent.' };
    } catch (error: any) {
        console.error('Action error:', error);
        return { success: false, message: error.message || 'Failed to create alert' };
    }
}
