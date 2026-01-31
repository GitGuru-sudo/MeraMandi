import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendOTPEmail(to: string, otp: string, name: string = 'User'): Promise<boolean> {
    if (!process.env.SMTP_USER || !to) {
        console.log('⚠️  Skipping email: No SMTP credentials or recipient email.');
        console.log(`📝 OTP (dev/mock): ${otp}`);
        return true; // Return success for dev mode
    }

    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 8px;">
        <h1 style="color: #16a34a; text-align: center; margin: 0 0 20px 0;">MeraMandi</h1>
        <p style="color: #333; font-size: 16px;">Hi ${name},</p>
        <p style="color: #666; font-size: 14px;">Your OTP for MeraMandi verification is:</p>
        <div style="background: #fff; padding: 20px; border-radius: 6px; text-align: center; margin: 20px 0; border: 2px solid #16a34a;">
            <p style="color: #16a34a; font-size: 36px; font-weight: bold; margin: 0; letter-spacing: 8px;">${otp}</p>
        </div>
        <p style="color: #666; font-size: 13px;">This OTP is valid for 10 minutes.</p>
        <p style="color: #666; font-size: 13px;">If you didn't request this code, please ignore this email.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            Happy Farming! 🌾<br/>
            Team MeraMandi
        </p>
    </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: '"MeraMandi" <' + process.env.SMTP_USER + '>',
            to,
            subject: '🔐 MeraMandi OTP: ' + otp,
            html,
        });

        console.log(`✅ OTP email sent to ${to}`);
        console.log(`   Message ID: ${info.messageId}`);
        return true;
    } catch (error: any) {
        console.error('❌ Error sending OTP email:');
        console.error(`   ${error.message}`);
        return false;
    }
}

export async function sendConfirmationEmail(to: string, name: string, schedules: { day: string; time: string }[]) {
    if (!process.env.SMTP_USER || !to) {
        console.log('Skipping email sending: No SMTP credentials or recipient email.');
        return false;
    }

    const scheduleList = schedules.map(s => `<li>${s.day} at ${s.time}</li>`).join('');

    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">MeraMandi Alert Confirmation</h1>
        <p>Hi ${name},</p>
        <p>Your price alerts have been successfully scheduled!</p>
        <h3>Your Schedule:</h3>
        <ul>
            ${scheduleList}
        </ul>
        <p>You will receive SMS alerts at these times.</p>
        <p>Happy Farming! 🌾</p>
    </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: '"MeraMandi" <' + process.env.SMTP_USER + '>',
            to,
            subject: '🌱 MeraMandi Alert Subscription Confirmed',
            html,
        });

        console.log('Confirmation email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        return false;
    }
}
