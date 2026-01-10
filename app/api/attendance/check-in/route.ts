import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/Attendance';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        await connectToDatabase();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        // Check if already checked in today
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        const existing = await Attendance.findOne({
            userId: payload.userId,
            checkIn: { $gte: startOfDay, $lte: endOfDay }
        });

        if (existing) {
            return NextResponse.json({ message: 'Already checked in today' }, { status: 400 });
        }

        const newAttendance = new Attendance({
            userId: payload.userId,
            checkIn: new Date(),
            status: 'Present' // Default status
        });

        await newAttendance.save();

        return NextResponse.json({ message: 'Check-in successful' });
    } catch (error) {
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
