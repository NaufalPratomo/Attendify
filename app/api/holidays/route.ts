import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Holiday from '@/models/Holiday';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// Helper: Extract userId from JWT token cookie
async function getAuthenticatedUserId(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('attendify_token')?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return null;

    return payload.userId as string;
}

// Helper: Convert a date to "YYYY-MM-DD" string in local timezone (WIB / UTC+7)
function toDateString(dateInput: string | Date): string {
    const d = new Date(dateInput);
    // Shift to WIB (UTC+7) to get the correct local date
    const wibOffset = 7 * 60; // minutes
    const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
    const wibDate = new Date(utcMs + wibOffset * 60000);
    const year = wibDate.getFullYear();
    const month = String(wibDate.getMonth() + 1).padStart(2, '0');
    const day = String(wibDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// GET /api/holidays?year=2026&month=2
export async function GET(req: Request) {
    try {
        await connectToDatabase();

        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const now = new Date();
        const year = parseInt(searchParams.get('year') || String(now.getFullYear()));
        const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1));

        // Build dateString range for the month: "YYYY-MM-01" to "YYYY-MM-31"
        const monthStr = String(month).padStart(2, '0');
        const startDateStr = `${year}-${monthStr}-01`;
        const endDateStr = `${year}-${monthStr}-31`; // safe upper bound

        // Fetch GLOBAL holidays + PERSONAL holidays for this user
        const holidays = await Holiday.find({
            dateString: { $gte: startDateStr, $lte: endDateStr },
            $or: [
                { type: 'GLOBAL' },
                { type: 'PERSONAL', userId: userId }
            ]
        }).sort({ dateString: 1 });

        return NextResponse.json({ holidays });
    } catch (error: any) {
        console.error('[Holidays API] GET error:', error);
        return NextResponse.json({
            message: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

// POST /api/holidays
export async function POST(req: Request) {
    try {
        await connectToDatabase();

        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { date, name, type } = body;

        if (!date || !name || !type) {
            return NextResponse.json({ message: 'Missing required fields: date, name, type' }, { status: 400 });
        }

        if (!['GLOBAL', 'PERSONAL'].includes(type)) {
            return NextResponse.json({ message: 'Invalid type. Must be GLOBAL or PERSONAL.' }, { status: 400 });
        }

        // Convert date to dateString (timezone-safe)
        const dateString = toDateString(date);

        // Normalize the Date object to UTC noon of the dateString to avoid timezone drift
        const [y, m, d] = dateString.split('-').map(Number);
        const normalizedDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

        const holidayData: any = {
            date: normalizedDate,
            dateString,
            name: name.trim(),
            type,
            userId: type === 'PERSONAL' ? userId : null,
        };

        // Check for duplicate
        const existing = await Holiday.findOne({
            dateString,
            type,
            userId: type === 'PERSONAL' ? userId : null,
        });

        if (existing) {
            return NextResponse.json({
                message: `A ${type === 'GLOBAL' ? 'Global Holiday' : 'Personal Leave'} already exists on ${dateString}.`
            }, { status: 409 });
        }

        const holiday = await Holiday.create(holidayData);

        return NextResponse.json({ message: 'Holiday created successfully', holiday }, { status: 201 });
    } catch (error: any) {
        console.error('[Holidays API] POST error:', error);

        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return NextResponse.json({
                message: 'A holiday already exists for this date and type.'
            }, { status: 409 });
        }

        return NextResponse.json({
            message: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

// DELETE /api/holidays
export async function DELETE(req: Request) {
    try {
        await connectToDatabase();

        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'Missing holiday id' }, { status: 400 });
        }

        const holiday = await Holiday.findById(id);
        if (!holiday) {
            return NextResponse.json({ message: 'Holiday not found' }, { status: 404 });
        }

        // Authorization: allow deletion if GLOBAL or if PERSONAL belongs to this user
        if (holiday.type === 'PERSONAL' && String(holiday.userId) !== userId) {
            return NextResponse.json({ message: 'Unauthorized: Cannot delete another user\'s leave' }, { status: 403 });
        }

        await Holiday.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Holiday deleted successfully' });
    } catch (error: any) {
        console.error('[Holidays API] DELETE error:', error);
        return NextResponse.json({
            message: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
