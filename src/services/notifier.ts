import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

export async function sendSMS(to: string, body: string): Promise<boolean> {
    // Debug: Log env vars on first call
    if (!client) {
        console.log('⚠️  Twilio client not initialized.');
        console.log('  TWILIO_ACCOUNT_SID:', accountSid ? `${accountSid.slice(0, 8)}...` : 'MISSING');
        console.log('  TWILIO_AUTH_TOKEN:', authToken ? '***SET***' : 'MISSING');
        console.log('  TWILIO_MESSAGING_SERVICE_SID:', messagingServiceSid ? `${messagingServiceSid.slice(0, 8)}...` : 'MISSING');
        console.log('  TWILIO_PHONE_NUMBER:', fromNumber ? fromNumber : 'MISSING');
        console.log('📝 SMS (dev/mock):');
        console.log(`   To: ${to}`);
        console.log(`   Body: ${body}`);
        return true; // Return success for dev mode
    }

    try {
        const messageOptions: any = {
            body,
            to,
        };

        if (messagingServiceSid) {
            messageOptions.messagingServiceSid = messagingServiceSid;
            console.log(`📤 Sending SMS via Messaging Service: ${messagingServiceSid.slice(0, 8)}...`);
        } else if (fromNumber) {
            messageOptions.from = fromNumber;
            console.log(`📤 Sending SMS from: ${fromNumber}`);
        } else {
            console.error('❌ No Messaging Service SID or phone number configured.');
            return false;
        }

        console.log(`📝 Message options:`, { to, body: body.slice(0, 50) + '...', ...messageOptions });
        const message = await client.messages.create(messageOptions);
        console.log(`✅ SMS sent successfully!`);
        console.log(`   SID: ${message.sid}`);
        console.log(`   Status: ${message.status}`);
        console.log(`   To: ${message.to}`);
        return true;
    } catch (error: any) {
        console.error('❌ Error sending SMS:');
        console.error(`   Code: ${error.code}`);
        console.error(`   Message: ${error.message}`);
        console.error(`   Details:`, error);
        if (error.code === 20003) {
            console.error('   → Invalid SID or Token. Check .env.local credentials.');
        }
        return false;
    }
}
