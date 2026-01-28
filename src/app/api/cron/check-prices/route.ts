import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Alert from '@/models/Alert';
import User from '@/models/User';
import { fetchMandiPrices, MandiRecord } from '@/services/govApi';
import { sendSMS } from '@/services/notifier';

// This route should be protected (e.g., with a secret key) in production
// to prevent unauthorized access.
// usage: GET /api/cron/check-prices?key=SECRET_KEY

export async function GET(request: Request) {
    try {
        await dbConnect();

        // 1. Fetch latest prices
        const prices = await fetchMandiPrices(process.env.GOV_API_KEY);
        console.log(`Fetched ${prices.length} price records.`);

        let alertsSent = 0;
        let errors = 0;

        // 2. Iterate through each price record
        for (const record of prices) {
            // Normalize data for matching
            const recordState = record.state;
            const recordDistrict = record.district;
            const recordMandi = record.market;
            const recordCommodity = record.commodity;
            const currentPrice = parseFloat(record.modal_price);

            // 3. Find matching alerts in DB
            // We look for alerts where:
            // - Location matches
            // - Commodity matches
            // - Target Price <= Current Price (Alert if price is GOOD/HIGH for selling)
            // - OR Target Price >= Current Price (Alert if price is LOW for buying?) -> Usually farmers want HIGH prices.
            // Let's assume farmers want to know if price EXCEEDS their expectation.

            const matchingAlerts = await Alert.find({
                state: { $regex: new RegExp(`^${recordState}$`, 'i') }, // Case insensitive match
                district: { $regex: new RegExp(`^${recordDistrict}$`, 'i') },
                mandi: { $regex: new RegExp(`^${recordMandi}$`, 'i') },
                commodity: { $regex: new RegExp(`^${recordCommodity}$`, 'i') },
                isActive: true,
                targetPrice: { $lte: currentPrice }, // Alert if market price is higher than user's target
            }).populate('user');

            for (const alert of matchingAlerts) {
                // Check if we already notified today (simple check to avoid spam)
                const today = new Date();
                const lastNotified = alert.lastNotifiedAt ? new Date(alert.lastNotifiedAt) : null;

                const isSameDay = lastNotified &&
                    lastNotified.getDate() === today.getDate() &&
                    lastNotified.getMonth() === today.getMonth() &&
                    lastNotified.getFullYear() === today.getFullYear();

                if (!isSameDay) {
                    const user = alert.user as any; // Type assertion since specific TS type might require full User hydration

                    if (user && user.phone) {
                        const message = `KISAN ALERT: ${recordCommodity} in ${recordMandi} is now ₹${currentPrice}/quintal. This is above your target of ₹${alert.targetPrice}.`;

                        const sent = await sendSMS(user.phone, message);

                        if (sent) {
                            alert.lastNotifiedAt = new Date();
                            await alert.save();
                            alertsSent++;
                        } else {
                            errors++;
                        }
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Cron job executed',
            stats: { alertsSent, errors }
        });

    } catch (error: any) {
        console.error('Cron job error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
