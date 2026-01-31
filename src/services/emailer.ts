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
