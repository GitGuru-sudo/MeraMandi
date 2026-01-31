import { NextResponse, NextRequest } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Get token from cookies or Authorization header
        const token = request.cookies.get('auth-token')?.value || 
                     request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'No token provided' },
                { status: 401 }
            );
        }

        // Find user by token
        const user = await User.findOne({ 
            authToken: token,
            authTokenExpiry: { $gt: new Date() } // Token not expired
        }).select('+authToken +authTokenExpiry');

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                success: true,
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
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { success: false, error: 'Invalid token or user not found' },
            { status: 401 }
        );
    }
}
