import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const { email, password } = await req.json();

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const tokenPayload = {
            userId: user._id.toString(),
            email: user.email,
            name: user.name
        };
        console.log("Signing token with payload:", tokenPayload);
        const token = await signToken(tokenPayload);

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return NextResponse.json({ message: 'Login successful' });
    } catch (error: any) {
        console.error("Login Error:", error);
        return NextResponse.json({
            message: 'Internal server error',
            details: error.message || String(error)
        }, { status: 500 });
    }
}
