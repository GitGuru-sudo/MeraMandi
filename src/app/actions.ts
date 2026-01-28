'use server'

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Alert from '@/models/Alert';
import { revalidatePath } from 'next/cache';

export async function createAlert(prevState: any, formData: FormData) {
    try {
        const name = formData.get('name') as string;
        const phone = formData.get('phone') as string;
        const state = formData.get('state') as string;
        const district = formData.get('district') as string;
        const mandi = formData.get('mandi') as string;
        const commodity = formData.get('commodity') as string;
        const targetPrice = parseFloat(formData.get('targetPrice') as string);

        if (!phone || !mandi || isNaN(targetPrice)) {
            return { message: 'Missing required fields' };
        }

        await dbConnect();

        // 1. Find or Create User
        let user = await User.findOne({ phone });
        if (!user) {
            user = await User.create({
                name,
                phone,
                location: { state, district },
            });
        } else {
            // Update name if changed
            if (name && user.name !== name) {
                user.name = name;
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
        });

        revalidatePath('/');
        return { success: true, message: 'Alert created successfully!' };
    } catch (error: any) {
        console.error('Action error:', error);
        return { success: false, message: error.message || 'Failed to create alert' };
    }
}
