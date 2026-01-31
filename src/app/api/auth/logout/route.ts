import { NextResponse, NextRequest } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        // Get token from cookies
        const token = request.cookies.get('auth-token')?.value;

        if (token) {
            // Find user by token and clear it
            const user = await User.findOne({ authToken: token });

            if (user) {
                user.authToken = undefined;
                user.authTokenExpiry = undefined;
                await user.save();
            }
        }

        // Clear cookie
        const response = NextResponse.json(
            {
                success: true,
                message: 'Logged out successfully',
            },
            { status: 200 }
        );

        response.cookies.set('auth-token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0,
        });

        console.log(`✅ User logged out`);

        return response;
    } catch (error: any) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Logout failed' },
            { status: 500 }
        );
    }
}
