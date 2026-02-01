import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import { validatePasswordStrength } from '@/models/User';
import crypto from 'crypto';
import { fetchMandiPrices } from '@/services/govApi';

export async function POST(request: Request) {
    try {
        await dbConnect();

        const { phone, name, email, password, state, district, mandi, preferredCrop } = await request.json();

        // Validate inputs
        if (!phone || !name || !email || !password || !state || !district || !mandi) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: phone, name, email, password, state, district, mandi' },
                { status: 400 }
            );
        }

        // Validate password strength
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.valid) {
            return NextResponse.json(
                { success: false, error: passwordValidation.message },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Email already registered' },
                { status: 400 }
            );
        }

        // Create new user
        const user = await User.create({
            phone,
            name,
            email: email.toLowerCase(),
            password,
            preferredCrop,
            location: { state, district, mandi },
            isPhoneVerified: false,
            isEmailVerified: true,
        });

        try {
            const commodity = preferredCrop;
            if (state && district && commodity) {
                const allPrices = await fetchMandiPrices(process.env.GOV_API_KEY, state, district);
                const matches = allPrices.filter((p: any) => {
                    const commodityMatch = (commodity === 'All' || commodity === 'All Crops') || p.commodity.toLowerCase() === commodity.toLowerCase();
                    return commodityMatch;
                });

                if (matches.length > 0) {
                    const sortedByMin = [...matches].sort((a, b) => parseFloat(a.min_price) - parseFloat(b.min_price));
                    const sortedByMax = [...matches].sort((a, b) => parseFloat(b.max_price) - parseFloat(a.max_price));
                    const minRecord = sortedByMin[0];
                    const maxRecord = sortedByMax[0];

                    const modalAvg = matches.reduce((acc: number, p: any) => acc + parseFloat(p.modal_price), 0) / matches.length;
                    const modalVal = Math.round(modalAvg);

                    const minPrice = parseFloat(minRecord.min_price);
                    const maxPrice = parseFloat(maxRecord.max_price);

                    if (Number.isFinite(minPrice) && Number.isFinite(maxPrice) && Number.isFinite(modalVal) && maxRecord.market) {
                        user.registrationMarketData = {
                            state,
                            district,
                            minPrice,
                            maxPrice,
                            modalPrice: modalVal,
                            mandiName: maxRecord.market,
                            commodity,
                            fetchedAt: new Date(),
                        };
                    }
                }
            }
        } catch (e) {
            console.error('Market snapshot capture failed (register):', e);
        }

        // Generate simple auth token (random 32 bytes hex)
        const authToken = crypto.randomBytes(32).toString('hex');
        user.authToken = authToken;
        user.authTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await user.save();

        // Set httpOnly cookie
        const response = NextResponse.json(
            {
                success: true,
                message: 'Registration successful!',
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
            { status: 201 }
        );

        response.cookies.set('auth-token', authToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
        });

        console.log(`✅ User registered: ${email}`);

        return response;
    } catch (error: any) {
        console.error('Register error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Registration failed' },
            { status: 500 }
        );
    }
}
