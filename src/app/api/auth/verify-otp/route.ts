import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        await dbConnect();

        const { email, otp } = await request.json();

        if (!otp || !email) {
            return NextResponse.json(
                { success: false, error: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        const query = { email: email.toLowerCase() };

        // Find user by email
        const user = await User.findOne(query).select('+otp +otpExpiry');

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Check OTP validity
        if (!user.otp || user.otp !== otp) {
            return NextResponse.json(
                { success: false, error: 'Invalid OTP' },
                { status: 400 }
            );
        }

        if (user.otpExpiry && new Date() > user.otpExpiry) {
            return NextResponse.json(
                { success: false, error: 'OTP expired' },
                { status: 400 }
            );
        }

        // Mark email as verified
        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;

        // Generate simple auth token (random 32 bytes hex)
        const authToken = crypto.randomBytes(32).toString('hex');
        user.authToken = authToken;
        user.authTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        
        await user.save();

        // Set httpOnly cookie
        const response = NextResponse.json(
            {
                success: true,
                message: 'Email verified successfully!',
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
            maxAge: 30 * 24 * 60 * 60, // 30 days
        });

        console.log(`✅ OTP verified for email: ${email}`);

        return response;
    } catch (error: any) {
        console.error('OTP verification error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'OTP verification failed' },
            { status: 500 }
        );
    }
}
