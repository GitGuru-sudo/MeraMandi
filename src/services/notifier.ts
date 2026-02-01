import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();

// Log to debug environment loading
if (process.env.NODE_ENV === 'production') {
    console.log('[SMS Init] Production environment detected');
    console.log('[SMS Init] SID loaded:', !!accountSid, accountSid ? `(${accountSid.slice(0, 6)}...)` : '');
    console.log('[SMS Init] Token loaded:', !!authToken);
    console.log('[SMS Init] From number loaded:', !!fromNumber);
}

let client: any = null;
try {
    if (accountSid && authToken) {
        client = twilio(accountSid, authToken);
        console.log('[SMS Init] ✅ Twilio client initialized successfully');
    } else {
        console.warn('[SMS Init] ⚠️  Missing Twilio credentials');
    }
} catch (initError) {
    console.error('[SMS Init] ❌ Failed to initialize Twilio client:', initError);
}

export async function sendSMS(to: string, body: string): Promise<boolean> {
    const safeBody = String(body).replace(/\bundefined\b/g, 'N/A');

    // Debug: Log env vars on first call
    if (!client) {
        console.log('⚠️  Twilio client not initialized.');
        console.log('  TWILIO_ACCOUNT_SID:', accountSid ? `${accountSid.slice(0, 8)}...` : 'MISSING');
        console.log('  TWILIO_AUTH_TOKEN:', authToken ? '***SET***' : 'MISSING');
        console.log('  TWILIO_MESSAGING_SERVICE_SID:', messagingServiceSid ? `${messagingServiceSid.slice(0, 8)}...` : 'MISSING');
        console.log('  TWILIO_PHONE_NUMBER:', fromNumber ? fromNumber : 'MISSING');
        console.log('📝 SMS (dev/mock):');
        console.log(`   To: ${to}`);
        console.log(`   Body: ${safeBody}`);
        return true; // Return success for dev mode
    }

    try {
        const messageOptions: any = {
            body: safeBody,
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

        console.log(`📝 Message options:`, { to, body: safeBody.slice(0, 50) + '...', ...messageOptions });
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
