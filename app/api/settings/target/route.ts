import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    try {
        await connectToDatabase();

        // Auth Check
        const cookieStore = await cookies();
        const token = cookieStore.get('attendify_token')?.value;
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const user = await User.findById(payload.userId);
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        return NextResponse.json({
            monthlyTargetBase: user.monthlyTargetBase || 11240,
            yearlyTarget: user.yearlyTarget || 134880
        });
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching settings' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();

        // Auth Check
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { monthlyTargetBase, yearlyTarget } = await req.json();

        await User.findByIdAndUpdate(payload.userId, {
            monthlyTargetBase,
            yearlyTarget
        });

        return NextResponse.json({ message: 'Settings updated' });
    } catch (error) {
        return NextResponse.json({ message: 'Error saving settings' }, { status: 500 });
    }
}
