import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        return NextResponse.json({ message: 'User created successfully', userId: newUser._id }, { status: 201 });
    } catch (error: any) {
        console.error("Registration Error:", error);
        return NextResponse.json({
            message: 'Internal server error',
            details: error.message || String(error)
        }, { status: 500 });
    }
}
