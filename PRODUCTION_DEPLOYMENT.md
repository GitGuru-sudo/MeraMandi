# Production Deployment Checklist

## Environment Variables
⚠️ **CRITICAL**: This is the most common cause of the "Unable to Load Prices" error

### Required Environment Variables for Production:

```bash
# Government API Key (required for prices to load)
GOV_API_KEY=your_actual_api_key_here

# Database Connection
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_secret_key_here
EMAIL_OTP_SECRET=your_email_otp_secret

# Email Service
GMAIL_EMAIL=your_email@gmail.com
GMAIL_PASSWORD=your_app_password

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number
```

### How to Get GOV_API_KEY:
1. Visit https://data.gov.in/
2. Sign up for an account
3. Request API access for the Mandi Price dataset
4. Generate and copy your API key
5. Add it to your production environment variables

## Common Issues & Solutions

### Issue: "Unable to Load Prices - fetch failed"

#### Cause 1: Missing GOV_API_KEY
- **Solution**: Ensure `GOV_API_KEY` is set in your production environment
- Where to set it:
  - **Vercel**: Project Settings → Environment Variables
  - **Heroku**: Config Vars
  - **Docker**: Docker environment file
  - **Manually hosted**: `.env.production.local`

#### Cause 2: Network/CORS Issues
- **Solution**: Already handled with:
  - Retry logic with exponential backoff (3 attempts)
  - 20-second timeout
  - Proper User-Agent headers
  - Connection pooling disabled to prevent resets

#### Cause 3: Government API Downtime
- **Solution**: 
  - Check https://data.gov.in/ status
  - Application will retry automatically 3 times
  - User can refresh the page to retry

## Recent Improvements

✅ **Enhanced Error Handling**
- Detailed error messages instead of generic "fetch failed"
- Error display UI with troubleshooting tips
- Specific status codes for different error types
- Better console logging for debugging

✅ **Improved Retry Logic**
- Increased from 2 to 3 retry attempts
- Exponential backoff (1s, 2s, 4s) instead of linear
- Timeout increased to 20 seconds
- Request improvements: proper headers, keepalive disabled

✅ **Better Timeout Handling**
- 20-second timeout instead of 15 seconds
- Proper AbortController implementation
- User-friendly timeout error messages

## Testing in Production

1. **Check Deployment Logs**
   ```bash
   # Vercel
   vercel logs
   
   # Docker
   docker logs <container_id>
   ```

2. **Monitor API Responses**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Load prices page
   - Check `/api/prices` request for status and response

3. **Test with Sample Data**
   - Try State: "Haryana", District: "Hisar" (usually has data)

## Deployment Platforms

### Vercel
1. Push to GitHub/GitLab
2. Connect repository to Vercel
3. Set environment variables in Project Settings
4. Deploy (automatic on push)
5. Monitor with `vercel logs`

### Docker
```dockerfile
# Ensure environment variables are passed
docker run -e GOV_API_KEY=your_key \
           -e MONGODB_URI=your_uri \
           your_image:tag
```

### Manual Hosting
1. Set environment variables in `.env.production.local`
2. Build: `npm run build`
3. Start: `npm start`

## Monitoring & Debugging

### Log Locations
- **Vercel**: Real-time in dashboard
- **Container Apps**: Azure Monitor
- **Self-hosted**: Application logs

### Key Logs to Check
```
[Prices API] Request received with: ...
✅ Gov API response received with X records
[Prices API] Successfully retrieved X records
```

### Error Logs Pattern
```
❌ All API attempts failed
Attempt 1: [error message]
Attempt 2: [error message]
Attempt 3: [error message]
Last error: [final error]
```

## Performance Tips

1. **Cache Prices** (Future enhancement)
   - Cache API responses for 1 hour
   - Reduces API calls
   - Faster loading

2. **Implement Fallback Data**
   - Keep last known prices if API fails
   - Better UX than showing errors

3. **Monitor API Quota**
   - Track API usage
   - Set up alerts for quota warnings

## Support

If prices still don't load:

1. **Check Environment Variables**
   ```
   Verify GOV_API_KEY exists in production environment
   ```

2. **Review Logs**
   ```
   Look for [Prices API] logs to see actual error
   ```

3. **Test API Manually**
   ```bash
   curl "https://your-domain.com/api/prices?state=Haryana&district=Hisar"
   ```

4. **Verify Government API Status**
   ```
   Visit https://data.gov.in/ and test their API directly
   ```
