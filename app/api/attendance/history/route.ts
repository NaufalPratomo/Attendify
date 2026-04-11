import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/Attendance';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getWibDateParts, getWibMonthRange } from '@/lib/timezone';

export async function GET(req: Request) {
    try {
        await connectToDatabase();

        const cookieStore = await cookies();
        const token = cookieStore.get('attendify_token')?.value;
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const now = new Date();
        const wibNow = getWibDateParts(now);
        const month = parseInt(searchParams.get('month') || String(wibNow.month - 1), 10);
        const year = parseInt(searchParams.get('year') || String(wibNow.year), 10);

        // Create Date Range
        const { start: startOfMonth, end: endOfMonth } = getWibMonthRange(year, month);

        const records = await Attendance.find({
            userId: payload.userId,
            checkIn: { $gte: startOfMonth, $lte: endOfMonth }
        }).sort({ checkIn: 1 });

        return NextResponse.json({ records });
    } catch (error) {
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
