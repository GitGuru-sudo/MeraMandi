# Quick Reference - Auto-Fill Registration Data Feature

## What Was Implemented
When a user logs in, their registration data (state, district, crop) automatically fills in the alert form and prices page without requiring manual input.

---

## Files Modified

### 1. `/src/app/api/auth/login/route.ts`
**Line**: ~95-107
**Change**: Added 3 fields to login response
```diff
+ preferredCrop: user.preferredCrop,
+ registrationMarketData: user.registrationMarketData,
```
**Purpose**: Return user's registration data during login

---

### 2. `/src/app/prices/page.tsx`  
**Line**: ~85-125
**Change**: Updated `checkAuth()` function
```diff
+ const checkAuth = async (urlState?: string | null, urlDistrict?: string | null) => {
+     // Auto-fill from user.location if not in URL
+ }
```
**Purpose**: Auto-populate state/district when page loads

---

### 3. `/src/components/AlertForm.tsx`
**Line**: ~95-135
**Change**: Added visual display cards
```diff
+ {(propState || propDistrict) && (
+     <div className="bg-blue-50..."> {/* Location Card */}
+ )}
+ {user?.preferredCrop && (
+     <div className="bg-emerald-50..."> {/* Crop Card */}
+ )}
```
**Purpose**: Show users their pre-filled registration data

---

## How It Works

```
User Registration
    ↓ (saves state, district, crop)
    
User Login
    ↓ (login API returns location & preferredCrop)
    
Prices Page Loads
    ↓ (checkAuth auto-fills selectedState & selectedDistrict)
    
User Creates Alert
    ↓ (AlertForm shows pre-filled location & crop cards)
    
Form Submission
    ↓ (all fields pre-filled from registration)
```

---

## Key Features

✅ **Automatic**: No user action required  
✅ **Visual**: Blue & green cards show what's pre-filled  
✅ **Smart**: URL parameters override auto-fill  
✅ **Persistent**: Works across sessions  
✅ **Accessible**: Works in light & dark modes  

---

## Testing Quick Start

1. **Register a user**: 
   - Email: `farmer@test.com`
   - State: `Punjab`
   - District: `Ludhiana`
   - Crop: `Wheat`

2. **Login with same email**

3. **Check prices page**: Should show Punjab & Ludhiana selected

4. **Create alert**: Location & crop cards should display

5. **Submit alert**: Should have all data pre-filled

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| State/district not auto-filling | Check user has `location` data in DB |
| Cards not showing in AlertForm | Verify `propState` and `user?.preferredCrop` are passed |
| Colors not appearing | Ensure Tailwind CSS is properly compiled |
| Data not persisting | Check auth cookie is being set correctly |

---

## Related Files (Not Modified)

- ✅ `/src/models/User.ts` - Already has location & preferredCrop fields
- ✅ `/src/app/api/auth/me/route.ts` - Already returns all needed fields
- ✅ `/src/app/api/auth/register/route.ts` - Already saves registration data
- ✅ `/src/app/home/page.tsx` - No changes needed

---

## Notes for Future Development

- To allow manual override: Add "Change Location" button to AlertForm
- To add more fields: Update login response and AlertForm display cards
- To track multiple locations: Modify User schema to support array
