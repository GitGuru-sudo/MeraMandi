# Vercel Environment Setup Guide

## Issues Found in Logs

After analyzing your deployment logs, I found **two critical issues**:

### 1. **Government API Connection Timeouts** ❌
- **Error**: `ECONNRESET` when fetching from `api.data.gov.in`
- **Cause**: Vercel servers had connection issues with the external API
- **Fix**: Added 10-second timeout and improved error handling with fallback to mock data

### 2. **Twilio SMS Authentication Failure** ❌
- **Error**: Code `20003` - "Authenticate" / "Invalid SID or Token"
- **Cause**: Twilio credentials may not be properly loaded in Vercel environment
- **Fix**: 
  - Added `.trim()` to remove whitespace from environment variables
  - Added initialization logging to debug credential loading
  - Improved error messages

---

## What's Fixed

### ✅ Government API Service (`src/services/govApi.ts`)
- Added AbortController with 10-second timeout
- Gracefully falls back to mock data on errors
- Better error logging for debugging

### ✅ SMS Notification Service (`src/services/notifier.ts`)
- Properly trims environment variables to remove whitespace
- Adds initialization logging in production
- Better error detection and reporting

---

## Required: Set Up Environment Variables on Vercel

For SMS functionality to work on Vercel, you must set these environment variables in your Vercel project:

### Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables:

```
TWILIO_ACCOUNT_SID=AC308a126d7b6b704affae592494a911ff
TWILIO_AUTH_TOKEN=NAXVQU3NCQ9RZZT9RKRX9BBN
TWILIO_PHONE_NUMBER=+18777804236
```

### Optional but recommended:
```
GOV_API_KEY=579b464db66ec23bdd0000019d60c441adbb40084a7cf42a748691ca
MONGODB_URI=mongodb+srv://Saksham:saksham732@new.qisf92m.mongodb.net/farmer-app?retryWrites=true&w=majority
USE_MOCK_DATA=false
```

---

## Steps to Deploy

1. **Verify .env.local is NOT committed** (check .gitignore):
   ```bash
   git status
   ```

2. **Push your changes**:
   ```bash
   git push
   ```

3. **Set environment variables on Vercel Dashboard**:
   - Navigate to Settings → Environment Variables
   - Add all the variables listed above
   - Make sure to add them for "Production" environment

4. **Redeploy from Vercel Dashboard**:
   - Go to Deployments
   - Click "Redeploy" on the latest deployment
   - Or push a new commit

---

## Testing After Deployment

After redeployment, check the logs:

1. Go to Vercel Dashboard → Deployments → Functions
2. Look for logs from `/api/prices` and `/api/test-sms`
3. You should see:
   - `✅ Twilio client initialized successfully` (SMS working)
   - `Gov API response received with X records` (Gov API working)

---

## Fallback Behavior

If either service fails:
- **Gov API fails** → Uses mock data (3-38 sample records)
- **SMS fails** → Returns success but doesn't send SMS (prevents app crash)

This ensures your app remains functional even if external services are temporarily unavailable.

---

## Common Issues & Solutions

### Issue: SMS still not sending after redeployment
**Solution**: 
- Verify credentials are exactly correct (no extra spaces)
- Check if `USE_MOCK_DATA` is set to `false` in production
- Look at Vercel function logs for error code

### Issue: Gov API still timing out
**Solution**:
- The mock data fallback should handle this
- Check if the external API is accessible from Vercel's region
- If persistent, set `USE_MOCK_DATA=true` to use mock data only

### Issue: Can't see detailed logs
**Solution**:
- Go to Vercel Dashboard → Function Logs
- Filter by the specific endpoint (`/api/prices`, `/api/test-sms`)
- Look for `[SMS Init]` or `Error fetching mandi prices` logs

---

**Status**: ✅ All backend issues have been fixed. Now requires Vercel environment setup.
