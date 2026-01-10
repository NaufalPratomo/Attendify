import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/Attendance';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    try {
        await connectToDatabase();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const month = parseInt(searchParams.get('month') || '0');
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

        // Create Date Range
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

        const records = await Attendance.find({
            userId: payload.userId,
            checkIn: { $gte: startOfMonth, $lte: endOfMonth }
        }).sort({ checkIn: 1 });

        return NextResponse.json({ records });
    } catch (error) {
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
