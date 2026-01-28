import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

export async function sendSMS(to: string, body: string): Promise<boolean> {
    if (!client) {
        console.log('Twilio client not initialized. Logging SMS to console:');
        console.log(`To: ${to}`);
        console.log(`Body: ${body}`);
        return true; // Return success for dev mode
    }

    try {
        await client.messages.create({
            body,
            from: fromNumber,
            to,
        });
        console.log(`SMS sent to ${to}`);
        return true;
    } catch (error) {
        console.error('Error sending SMS:', error);
        return false;
    }
}
