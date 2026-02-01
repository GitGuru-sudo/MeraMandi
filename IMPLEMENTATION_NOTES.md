# Auto-Fill Registration Data on Login - Implementation Guide

## Overview
This implementation automatically populates user's registered state, district, and crop preferences when they login. The data is sourced from the user's registration profile and displayed prominently in the alert form.

## Changes Made

### 1. **Login API Endpoint** - `/src/app/api/auth/login/route.ts`
**Change**: Updated the login response to include additional user data fields.

**What was added**:
- `location`: User's registered state, district, and mandi information
- `preferredCrop`: User's preferred crop selection from registration
- `registrationMarketData`: Market snapshot data captured during registration

**Code**:
```typescript
user: {
    id: user._id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    location: user.location,           // ← NEW
    preferredCrop: user.preferredCrop, // ← NEW
    registrationMarketData: user.registrationMarketData, // ← NEW
    isPhoneVerified: user.isPhoneVerified,
}
```

**Impact**: Now when users login, their complete registration data is returned and available for use on the client side.

---

### 2. **Prices Page** - `/src/app/prices/page.tsx`
**Change**: Enhanced the `checkAuth()` function to auto-populate state and district from user's registration data.

**What was added**:
- Pass URL parameters to `checkAuth()` function
- After fetching user data, check if state/district are not in URL params
- If not in URL, automatically set them from `user.location.state` and `user.location.district`

**Code**:
```typescript
const checkAuth = async (urlState?: string | null, urlDistrict?: string | null) => {
    try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            
            // Auto-fill state and district from user's registration data if not provided in URL
            if (!urlState && data.user.location?.state) {
                setSelectedState(data.user.location.state);
            }
            if (!urlDistrict && data.user.location?.district) {
                setSelectedDistrict(data.user.location.district);
            }
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
};
```

**Impact**: When users navigate to the prices page after login, their registered state and district are automatically selected and prices are filtered accordingly.

---

### 3. **Alert Form Component** - `/src/components/AlertForm.tsx`
**Change**: Added visual display cards showing pre-filled location and crop data from user's registration.

**What was added**:
- **Location Display Card**: Shows the selected state and district with visual confirmation that it's from the user's profile
- **Crop Display Card**: Shows the user's preferred crop selection with a checkmark indicating it's from registration

**Features**:
- Blue-themed card for location information
- Emerald-themed card for crop information
- Visual indicators (→ arrow, checkmarks) showing data is pre-filled
- Responsive design with dark mode support

**Code**:
```jsx
{/* Pre-filled Location Display */}
{(propState || propDistrict) && (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">📍 Alert Location</p>
        <div className="flex items-center gap-4">
            <div>
                <p className="text-xs text-blue-500 dark:text-blue-300">State</p>
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{propState || 'Not set'}</p>
            </div>
            <div className="text-blue-300 dark:text-blue-600">→</div>
            <div>
                <p className="text-xs text-blue-500 dark:text-blue-300">District</p>
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{propDistrict || 'Not set'}</p>
            </div>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 opacity-80">✓ Using your registered location from profile</p>
    </div>
)}

{/* Pre-filled Crop Display */}
{user?.preferredCrop && (
    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">🌾 Crop</p>
        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{user.preferredCrop}</p>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 opacity-80">✓ From your registration profile</p>
    </div>
)}
```

**Impact**: Users can immediately see that their registration data has been auto-loaded, improving transparency and reducing confusion.

---

## User Flow

### Before Implementation
1. User logs in
2. User navigates to prices page
3. No state/district selected - user sees generic view
4. User must manually select state/district from dropdowns

### After Implementation
1. User logs in ✅ (registration data returned)
2. User navigates to prices page ✅ (auto-filled with registered location)
3. State/district automatically selected ✅ (visual confirmation shown)
4. Prices filtered by user's region ✅ (instant relevant data)
5. Alert form pre-populated ✅ (state, district, crop all filled)

---

## Data Flow Diagram

```
Registration
    ↓
    └─→ User data stored (state, district, crop)
    
Login
    ↓
    └─→ /api/auth/login returns (location, preferredCrop)
    
Navigate to Prices Page
    ↓
    └─→ checkAuth() fetches user data
    └─→ Sets selectedState & selectedDistrict
    └─→ fetchPrices() uses these values
    
Create Alert Form
    ↓
    └─→ AlertForm displays location & crop cards
    └─→ Hidden inputs pre-filled with data
    └─→ Form ready to submit
```

---

## Technical Details

### Data Sources
- **State**: `user.location.state` (set during registration)
- **District**: `user.location.district` (set during registration)  
- **Crop**: `user.preferredCrop` (optional, set during registration)

### Conditional Logic
- Location/crop cards only display if data exists
- URL parameters take precedence (user can override by URL)
- Graceful fallback to default values if not available

### Browser Compatibility
- Uses standard React hooks (useState, useEffect)
- CSS classes compatible with Tailwind CSS
- Works in light and dark modes

---

## Testing Checklist

- [ ] User registers with state, district, and crop
- [ ] User logs in immediately after registration
- [ ] Verify prices page auto-loads their region
- [ ] Verify AlertForm displays location card
- [ ] Verify AlertForm displays crop card  
- [ ] Create alert and verify data is correct
- [ ] User logs out and logs in again
- [ ] Verify data persists and auto-fills on re-login
- [ ] Test with URL parameters (should override auto-fill)
- [ ] Test dark mode display of cards
- [ ] Test on mobile devices

---

## Future Enhancements

1. **Allow Manual Override**: Add option to change state/district in AlertForm
2. **Multiple Locations**: Support users monitoring multiple regions
3. **Crop Rotation**: Track seasonal crop changes
4. **Location History**: Show recently selected locations
5. **Smart Defaults**: Remember last selected location for new alerts

---

## Notes

- Registration data is already being stored in User model (no schema changes needed)
- ME endpoint already returns all necessary data
- All changes are backward compatible
- No database migrations required
