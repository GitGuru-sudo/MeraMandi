import { NextResponse } from 'next/server';
import User, { IUser } from '@/models/User';
import dbConnect from '@/lib/mongodb';
import crypto from 'crypto';
import { fetchMandiPrices } from '@/services/govApi';

export async function POST(request: Request) {
    try {
        await dbConnect();

        const { email, password } = await request.json();

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email is required' },
                { status: 400 }
            );
        }

        if (!password) {
            return NextResponse.json(
                { success: false, error: 'Password is required' },
                { status: 400 }
            );
        }

        // Find user by email
        const user = (await User.findOne({ email: email.toLowerCase() }).select('+password')) as IUser | null;

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found. Please register first.' },
                { status: 404 }
            );
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, error: 'Invalid password' },
                { status: 401 }
            );
        }

        try {
            const state = user.location?.state;
            const district = user.location?.district;
            const commodity = user.preferredCrop;

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
            console.error('Market snapshot capture failed:', e);
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

        response.cookies.set('auth-token', authToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
        });

        console.log(`✅ User logged in: ${user.email}`);

        return response;
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Login failed' },
            { status: 500 }
        );
    }
}
