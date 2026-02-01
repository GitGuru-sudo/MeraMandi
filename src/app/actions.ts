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

        await dbConnect();

        // 1. Find or Create User
        let user = await User.findOne({ phone: cleanPhone });
        if (!user) {
            user = await User.create({
                name,
                phone: cleanPhone,
                email,
                location: { state, district },
            });
        } else {
            // Update name/email if changed
            if ((name && user.name !== name) || (email && user.email !== email)) {
                if (name) user.name = name;
                if (email) user.email = email;
                await user.save();
            }
        }

        // 2. Prepare Alert Data (Fetch Real or Generate Dummy)
        let initialMin = 1200;
        let initialMax = 1800;
        let initialModal = 1500;
        let initialMandi = finalMandi === 'All Mandis' ? 'Local Mandi' : finalMandi;
        let isRealData = false;

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

                initialMin = parseFloat(sortedByMin[0].min_price);
                initialMax = parseFloat(sortedByMax[0].max_price);
                initialModal = parseFloat(sortedByMax[0].modal_price); // Proxy for modal
                initialMandi = sortedByMax[0].market;
                isRealData = true;
            }
        } catch (e) {
            console.error('Failed to fetch initial prices, using dummy:', e);
        }

        // 3. Create Alert with Cached Values
        await Alert.create({
            user: user._id,
            state,
            district,
            mandi: finalMandi,
            commodity: finalCommodity,
            targetPrice: finalTargetPrice,
            schedules,
            email,
            // Store the "registration time" snapshot (Real or Dummy)
            cachedMin: initialMin,
            cachedMax: initialMax,
            cachedModal: initialModal,
            cachedMandi: initialMandi
        });

        // 4. Send 3-Part Confirmation using STORED values (Guaranteed Delivery)
        const msgs = [
            `✅ Mandi Alerts Active!\nLocation: ${district}\nCrop: ${finalCommodity}\nLowest Rate: ₹${initialMin}\nMandi: ${initialMandi}`,
            `✅ Mandi Alerts Active!\nLocation: ${district}\nCrop: ${finalCommodity}\nHighest Rate: ₹${initialMax}\nMandi: ${initialMandi}`,
            `✅ Mandi Alerts Active!\nLocation: ${district}\nCrop: ${finalCommodity}\nMarket Rate: ₹${initialModal}\nMandi: ${initialMandi}`
        ];

        for (const msg of msgs) {
            await sendSMS(fullPhoneNumber, msg);
        }

        // 5. Send Confirmation Email
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
