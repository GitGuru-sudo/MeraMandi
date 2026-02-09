import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import crypto from 'crypto';
import { sendOTPEmail } from '@/services/emailer';

export async function POST(request: Request) {
    try {
        await dbConnect();

        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email is required' },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to database
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP via email
        const emailSent = await sendOTPEmail(email, otp, user.name);

        if (!emailSent) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Failed to send OTP email. Please check your email address or try again later.' 
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { 
                success: true, 
                message: 'OTP sent to your email address',
                email: email 
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error in request-email-otp:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
