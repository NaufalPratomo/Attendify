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

        // Find active check-in
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        const attendance = await Attendance.findOne({
            userId: payload.userId,
            checkIn: { $gte: startOfDay, $lte: endOfDay },
            checkOut: { $exists: false }
        });

        if (!attendance) {
            return NextResponse.json({ message: 'No active check-in found' }, { status: 400 });
        }

        const checkOutTime = new Date();
        const durationMs = checkOutTime.getTime() - new Date(attendance.checkIn).getTime();
        const durationMinutes = Math.floor(durationMs / 60000);

        attendance.checkOut = checkOutTime;
        attendance.durationMinutes = durationMinutes;
        attendance.status = 'Valid'; // Simple logic for now

        await attendance.save();

        return NextResponse.json({ message: 'Check-out successful' });
    } catch (error) {
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
