import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Logbook from '@/models/Logbook';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('attendify_token')?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    return payload?.userId || null;
}

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get('date');

        if (!dateStr) {
            return NextResponse.json({ message: 'Date is required' }, { status: 400 });
        }

        // Parse date (YYYY-MM-DD)
        const [year, month, day] = dateStr.split('-').map(Number);

        // Create range for the entire day in UTC
        // We assume the date passed is the "target day"
        const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
        const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

        const logs = await Logbook.find({
            userId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ createdAt: 1 });

        return NextResponse.json({ logs });
    } catch (error: any) {
        console.error("Logbook GET Error:", error);
        return NextResponse.json({ message: 'Server Error', error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { date, activity } = await req.json();

        if (!date || !activity) {
            return NextResponse.json({ message: 'Missing date or activity' }, { status: 400 });
        }

        const [year, month, day] = date.split('-').map(Number);
        // Store the date. We'll use noon UTC to representing "this day" safely
        const logDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

        const newLog = await Logbook.create({
            userId,
            date: logDate,
            activity
        });

        return NextResponse.json({ log: newLog }, { status: 201 });
    } catch (error: any) {
        console.error("Logbook POST Error:", error);
        return NextResponse.json({ message: 'Server Error', error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectToDatabase();
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'ID is required' }, { status: 400 });
        }

        const deleted = await Logbook.findOneAndDelete({ _id: id, userId });

        if (!deleted) {
            return NextResponse.json({ message: 'Log not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        console.error("Logbook DELETE Error:", error);
        return NextResponse.json({ message: 'Server Error', error: error.message }, { status: 500 });
    }
}
