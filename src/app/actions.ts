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

        if (!phone || !mandi || isNaN(targetPrice)) {
            return { message: 'Missing required fields', success: false };
        }

        // Validate phone number (10 digits for India)
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
            return { message: 'Please enter a valid 10-digit phone number', success: false };
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

        // 2. Create Alert
        await Alert.create({
            user: user._id,
            state,
            district,
            mandi,
            commodity,
            targetPrice,
            schedules,
            email,
        });

        // 3. Send instant confirmation SMS
        const fullPhoneNumber = `+91${cleanPhone}`;
        const confirmationMessage = `✅ Alert Set!\n${mandi} | ${commodity}\nTarget: ₹${targetPrice}/quintal\nSMS alerts active - MeraMandi`;

        const smsSent = await sendSMS(fullPhoneNumber, confirmationMessage);

        // 4. Send Confirmation Email (Async, don't block)
        if (email) {
            sendConfirmationEmail(email, name, schedules).catch(console.error);
        }

        if (smsSent) {
            console.log(`Confirmation SMS sent to ${fullPhoneNumber}`);
        } else {
            console.warn(`Failed to send confirmation SMS to ${fullPhoneNumber}. Check Twilio logs.`);
        }

        revalidatePath('/');
        return { success: true, message: smsSent ? 'Alert created! Confirmation SMS sent.' : 'Alert created! (SMS failed - check console)' };
    } catch (error: any) {
        console.error('Action error:', error);
        return { success: false, message: error.message || 'Failed to create alert' };
    }
}
