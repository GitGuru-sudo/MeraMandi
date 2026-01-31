import { NextResponse } from 'next/server';
import { sendSMS } from '@/services/notifier';

export async function POST(request: Request) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json({ success: false, error: 'Phone number required' }, { status: 400 });
        }

        console.log(`\n🔔 [TEST-SMS] Incoming request:`);
        console.log(`   Phone: ${phone}`);

        const message = "✅ Test SMS from MeraMandi - Alerts working!";
        const sent = await sendSMS(phone, message);

        if (sent) {
            console.log(`\n✅ [TEST-SMS] Success — returning to client`);
            return NextResponse.json({ 
                success: true, 
                message: 'Test SMS sent', 
                phone,
                timestamp: new Date().toISOString()
            });
        } else {
            console.log(`\n❌ [TEST-SMS] Failed — returning error to client`);
            return NextResponse.json({ 
                success: false, 
                error: 'Failed to send SMS. Check server logs for details.',
                phone
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error(`\n❌ [TEST-SMS] Exception:`, error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Internal server error',
            details: error.toString()
        }, { status: 500 });
    }
}
