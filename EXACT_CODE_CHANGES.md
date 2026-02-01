# Exact Code Changes - Copy/Paste Reference

## 1. Update Login API Response

**File**: `src/app/api/auth/login/route.ts`  
**Location**: Lines 95-107

### BEFORE:
```typescript
        const response = NextResponse.json(
            {
                success: true,
                message: 'Login successful!',
                user: {
                    id: user._id,
                    phone: user.phone,
                    name: user.name,
                    email: user.email,
                    location: user.location,
                },
                token: authToken,
            },
            { status: 200 }
        );
```

### AFTER:
```typescript
        const response = NextResponse.json(
            {
                success: true,
                message: 'Login successful!',
                user: {
                    id: user._id,
                    phone: user.phone,
                    name: user.name,
                    email: user.email,
                    location: user.location,
                    preferredCrop: user.preferredCrop,
                    registrationMarketData: user.registrationMarketData,
                    isPhoneVerified: user.isPhoneVerified,
                },
                token: authToken,
            },
            { status: 200 }
        );
```

**What Changed**: Added 3 fields to the user object in the JSON response

---

## 2. Update Prices Page Auth Check

**File**: `src/app/prices/page.tsx`  
**Location**: Lines 85-126

### BEFORE:
```typescript
    useEffect(() => {
        // Read from URL params on mount
        const urlState = searchParams.get('state');
        const urlDistrict = searchParams.get('district');

        if (urlState) setSelectedState(urlState);
        if (urlDistrict) setSelectedDistrict(urlDistrict);

        checkAuth();

        // Close profile menu on click outside
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchParams]);

    useEffect(() => {
        fetchPrices();
    }, [selectedState, selectedDistrict]);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    };
```

### AFTER:
```typescript
    useEffect(() => {
        // Read from URL params on mount
        const urlState = searchParams.get('state');
        const urlDistrict = searchParams.get('district');

        if (urlState) setSelectedState(urlState);
        if (urlDistrict) setSelectedDistrict(urlDistrict);

        checkAuth(urlState, urlDistrict);

        // Close profile menu on click outside
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchParams]);

    useEffect(() => {
        fetchPrices();
    }, [selectedState, selectedDistrict]);

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

**What Changed**: 
- Added parameters to `checkAuth()` function
- Added logic to auto-fill state and district from user data
- Check if URL params are present before auto-filling

---

## 3. Update Alert Form Display

**File**: `src/components/AlertForm.tsx`  
**Location**: Lines 70-100 (insert before hidden inputs)

### BEFORE:
```tsx
            {/* Form */}
            <div className="p-6">
                <form action={formAction} className="space-y-6">

                    {state?.success && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2" role="alert">
                            <span className="bg-green-100 dark:bg-green-800 p-1 rounded-full"><Info className="w-4 h-4" /></span>
                            <span className="text-sm font-medium">{state.message}</span>
                        </div>
                    )}
                    {state?.message && !state?.success && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg" role="alert">
                            <span className="text-sm font-medium">{state.message}</span>
                        </div>
                    )}

                    {/* Hidden Context Fields (Simplifying the UX) */}
                    <input type="hidden" name="name" value={user?.name || 'Guest'} />
                    <input type="hidden" name="phone" value={user?.phone || ''} />
                    <input type="hidden" name="email" value={user?.email || ''} />
                    <input type="hidden" name="state" value={propState || 'Haryana'} />
                    <input type="hidden" name="district" value={propDistrict || 'Hisar'} />
                    <input type="hidden" name="mandi" value="" />
                    <input type="hidden" name="commodity" value={user?.preferredCrop || 'All Crops'} />
                    <input type="hidden" name="targetPrice" value="0" />
```

### AFTER:
```tsx
            {/* Form */}
            <div className="p-6">
                <form action={formAction} className="space-y-6">

                    {state?.success && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2" role="alert">
                            <span className="bg-green-100 dark:bg-green-800 p-1 rounded-full"><Info className="w-4 h-4" /></span>
                            <span className="text-sm font-medium">{state.message}</span>
                        </div>
                    )}
                    {state?.message && !state?.success && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg" role="alert">
                            <span className="text-sm font-medium">{state.message}</span>
                        </div>
                    )}

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

                    {/* Hidden Context Fields (Simplifying the UX) */}
                    <input type="hidden" name="name" value={user?.name || 'Guest'} />
                    <input type="hidden" name="phone" value={user?.phone || ''} />
                    <input type="hidden" name="email" value={user?.email || ''} />
                    <input type="hidden" name="state" value={propState || 'Haryana'} />
                    <input type="hidden" name="district" value={propDistrict || 'Hisar'} />
                    <input type="hidden" name="mandi" value="" />
                    <input type="hidden" name="commodity" value={user?.preferredCrop || 'All Crops'} />
                    <input type="hidden" name="targetPrice" value="0" />
```

**What Changed**: Added 2 display cards (Location and Crop) before the hidden inputs

---

## Summary of Changes

| File | Lines | Type | Impact |
|------|-------|------|--------|
| `login/route.ts` | 95-107 | Response payload | +3 fields |
| `prices/page.tsx` | 85-126 | Logic enhancement | +15 lines |
| `AlertForm.tsx` | 70-100 | UI addition | +40 lines |
| **Total** | - | - | **+55 lines** |

---

## Verification Commands

After making changes, you can verify by:

```bash
# Check files were modified
git status

# See the exact changes
git diff src/app/api/auth/login/route.ts
git diff src/app/prices/page.tsx  
git diff src/components/AlertForm.tsx

# Build project to check for errors
npm run build
```

---

## No Changes Needed In

- ✅ User model (schema already has fields)
- ✅ ME endpoint (already returns all data)
- ✅ Register endpoint (already saves data)
- ✅ Home page (works as-is)
- ✅ Database (no migrations needed)
