import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Alert from '@/models/Alert';

import { fetchMandiPrices } from '@/services/govApi';
import { sendSMS } from '@/services/notifier';

// This route should be protected (e.g., with a secret key) in production
// to prevent unauthorized access.
// usage: GET /api/cron/check-prices?key=SECRET_KEY

export async function GET(request: Request) {
    try {
        await dbConnect();

        // 1. Fetch latest prices
        const allPrices = await fetchMandiPrices(process.env.GOV_API_KEY);
        console.log(`Fetched ${allPrices.length} price records.`);

        // 2. Fetch all active alerts
        const activeAlerts = await Alert.find({ isActive: true }).populate('user');

        let alertsSentCount = 0;
        let smsSentCountCount = 0;
        let errors = 0;

        const { searchParams } = new URL(request.url);
        const force = searchParams.get('force') === 'true';

        // 3. Process each alert
        for (const alert of activeAlerts) {
            const user = alert.user as any;
            if (!user || !user.phone) continue;

            // Check if we should send now
            const today = new Date();
            const lastNotified = alert.lastNotifiedAt ? new Date(alert.lastNotifiedAt) : null;
            const isSameDay = lastNotified &&
                lastNotified.getDate() === today.getDate() &&
                lastNotified.getMonth() === today.getMonth() &&
                lastNotified.getFullYear() === today.getFullYear();

            const currentDay = today.toLocaleDateString('en-US', { weekday: 'long' });
            const currentHour = today.getHours();
            const schedules = (alert as any).schedules || [];

            const isScheduledNow = schedules.some((sch: any) => {
                const dayMatch = sch.day === 'Everyday' || sch.day === currentDay;
                const [h] = sch.time.split(':').map(Number);
                return dayMatch && h === currentHour;
            });

            if (!force && (isSameDay || !isScheduledNow)) continue;

            // Identify User Location and Commodity Needs
            const targetState = alert.state;
            const targetDistrict = alert.district;
            const targetCommodity = alert.commodity;
            const targetMandi = alert.mandi;

            // API Lookup (from our cached allPrices)
            const matches = allPrices.filter((p: any) => {
                const stateMatch = p.state.toLowerCase() === targetState.toLowerCase();
                const districtMatch = p.district.toLowerCase() === targetDistrict.toLowerCase();
                const commodityMatch = (targetCommodity === 'All' || targetCommodity === 'All Crops') || p.commodity.toLowerCase() === targetCommodity.toLowerCase();
                const mandiMatch = (targetMandi === 'All' || targetMandi === 'All Mandis' || !targetMandi) || p.market.toLowerCase() === targetMandi.toLowerCase();
                return stateMatch && districtMatch && commodityMatch && mandiMatch;
            });

            if (matches.length > 0) {
                // Calculate market stats
                const minVal = Math.min(...matches.map((p: any) => parseFloat(p.min_price)));
                const maxVal = Math.max(...matches.map((p: any) => parseFloat(p.max_price)));
                const modalAvg = matches.reduce((acc: number, p: any) => acc + parseFloat(p.modal_price), 0) / matches.length;
                const modalVal = Math.round(modalAvg);

                // Format Phone Number
                let toPhone = user.phone.replace(/\D/g, '');
                if (toPhone.length === 10) {
                    if (/^[6-9]/.test(toPhone)) toPhone = `+91${toPhone}`;
                    else toPhone = `+1${toPhone}`;
                } else if (!toPhone.startsWith('+')) toPhone = `+${toPhone}`;

                // Trigger 3 Separate SMS sequentially
                const commodityText = targetCommodity === 'All' || targetCommodity === 'All Crops' ? 'Crops' : targetCommodity;

                const msgs = [
                    `The lowest rate for ${commodityText} in ${targetDistrict} today is ₹${minVal}`,
                    `The highest rate for ${commodityText} in ${targetDistrict} today is ₹${maxVal}`,
                    `The usual market rate for ${commodityText} in ${targetDistrict} is ₹${modalVal}`
                ];

                let allSent = true;
                for (const body of msgs) {
                    const sent = await sendSMS(toPhone, body);
                    if (sent) smsSentCountCount++;
                    else allSent = false;
                }

                if (allSent) {
                    alert.lastNotifiedAt = new Date();
                    await alert.save();
                    alertsSentCount++;
                } else {
                    errors++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `${smsSentCountCount} SMS sent`,
            stats: {
                alertsProcessed: activeAlerts.length,
                usersNotified: alertsSentCount,
                totalSmsDispatched: smsSentCountCount,
                errors
            }
        });

    } catch (error: any) {
        console.error('Cron job error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
