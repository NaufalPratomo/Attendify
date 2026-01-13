import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/Attendance';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        await connectToDatabase();

        // 1. Auth Check
        const cookieStore = await cookies();
        const token = cookieStore.get('attendify_token')?.value;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }

        // 2. Parse Body
        const { date, checkInTime, checkOutTime, notes, tzOffsetMinutes } = await req.json();

        if (!date || !checkInTime) {
            return NextResponse.json({ message: 'Date and Check-in time are required' }, { status: 400 });
        }

        // 3. Construct Date Objects
        // date is "YYYY-MM-DD", time is "HH:mm"
        const [year, month, day] = date.split('-').map(Number);

        const tzOffset = Number.isFinite(tzOffsetMinutes) ? Number(tzOffsetMinutes) : undefined;

        const buildFromClientTz = (h: number, m: number) => {
            // When tzOffset is provided, interpret the input as the user's local time.
            // tzOffsetMinutes follows JS Date.getTimezoneOffset(): minutes to add to local time to get UTC.
            if (typeof tzOffset === 'number') {
                const utcMillis = Date.UTC(year, month - 1, day, h, m) + tzOffset * 60_000;
                return new Date(utcMillis);
            }
            // Fallback: previous behavior (server local timezone).
            return new Date(year, month - 1, day, h, m);
        };

        const [inHour, inMinute] = checkInTime.split(':').map(Number);
        const checkInDate = buildFromClientTz(inHour, inMinute);

        let checkOutDate = undefined;
        let durationMinutes = 0;
        let status = 'Present';

        if (checkOutTime) {
            const [outHour, outMinute] = checkOutTime.split(':').map(Number);
            checkOutDate = buildFromClientTz(outHour, outMinute);

            // Calculate duration
            const diffMs = checkOutDate.getTime() - checkInDate.getTime();
            if (diffMs < 0) {
                return NextResponse.json({ message: 'Check-out cannot be before check-in' }, { status: 400 });
            }
            durationMinutes = Math.floor(diffMs / 1000 / 60);

            // Simple status logic
            if (durationMinutes >= 480) { // 8 hours
                status = 'Valid';
            } else {
                status = 'Short';
            }
        }

        // 4. Create Record
        const newRecord = await Attendance.create({
            userId: payload.userId,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            durationMinutes,
            status,
            isManual: true,
            notes
        });

        return NextResponse.json({ message: 'Attendance added successfully', record: newRecord }, { status: 201 });

    } catch (error: any) {
        console.error("Manual Attendance Error:", error);
        return NextResponse.json({
            message: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
