import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

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
        await user.save();

        return NextResponse.json(
            { 
                success: true, 
                message: 'Email verified successfully',
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    isEmailVerified: user.isEmailVerified
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error in verify-email-otp:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
