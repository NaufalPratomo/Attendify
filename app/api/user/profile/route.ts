
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PUT(req: Request) {
    try {
        await connectToDatabase();

        // Auth Check
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        let payload;
        try {
            payload = await verifyToken(token);
        } catch (e) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }

        if (!payload || !payload.userId) {
            return NextResponse.json({ message: 'Unauthorized: Invalid payload' }, { status: 401 });
        }

        const body = await req.json();
        const { name, email } = body;

        // Validation
        if (!name || !email) {
            return NextResponse.json({ message: 'Name and email are required' }, { status: 400 });
        }

        // Check if email belongs to another user
        const existingUser = await User.findOne({ email, _id: { $ne: payload.userId } });
        if (existingUser) {
            return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
        }

        // Update User
        const updatedUser = await User.findByIdAndUpdate(
            payload.userId,
            { name, email },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Profile updated successfully',
            user: {
                name: updatedUser.name,
                email: updatedUser.email
            }
        });

    } catch (error: any) {
        console.error("Profile Update Error:", error);
        return NextResponse.json({
            message: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
