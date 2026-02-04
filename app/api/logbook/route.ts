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

import Attendance from '@/models/Attendance';
import { format } from 'date-fns';

// ... imports

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get('date');
        const monthStr = searchParams.get('month');
        const yearStr = searchParams.get('year');

        let startDate: Date, endDate: Date;

        if (dateStr) {
            // Parse date (YYYY-MM-DD)
            const [year, month, day] = dateStr.split('-').map(Number);
            startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
            endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        } else if (monthStr && yearStr) {
            // Fetch for entire month
            const year = parseInt(yearStr);
            const month = parseInt(monthStr); // 1-12

            if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
                return NextResponse.json({ message: 'Invalid month or year' }, { status: 400 });
            }

            startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
            endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));
        } else {
            return NextResponse.json({ message: 'Date or Month/Year is required' }, { status: 400 });
        }

        // Fetch logs
        const logs = await Logbook.find({
            userId,
            date: { $gte: startDate, $lt: endDate } // Use $lt for safe boundary
        }).lean().sort({ date: 1, createdAt: 1 });

        // Fetch attendance records for the same period
        const attendanceRecords = await Attendance.find({
            userId,
            checkIn: { $gte: startDate, $lt: endDate }
        }).lean();

        // Helpers to format time from Date object to HH:mm
        // Note: Attendance dates are stored in UTC. We should ideally format them according to user timezone.
        // For simplicity and consistency with existing format, we might want to just output HH:mm from the Date object.
        // But since the server is likely UTC, manual entries are usually local time.
        // Let's assume the client handles timezone or we format strictly.
        // The `format` from date-fns might format in local server time.
        // Let's just extract HH:mm from the ISO string or Date object carefully.
        // Actually, easiest is to pass the ISO string or formatted string.
        // The frontend expects HH:mm. Let's try to extract it from the Date object.
        // BUT wait, if I use `format(date, 'HH:mm')` on server, it uses server timezone.
        // It's safer to just pass the raw strings and let frontend format, OR format here if we know the offset.
        // The Logbook `checkIn` is stored as string `HH:mm`.
        // Let's try to format it here. If the server is UTC, we might need offset.
        // However, usually manual entry `checkIn` string is just "09:00".
        // `Attendance` checkIn is a Date.
        // Let's format `Attendance.checkIn` to HH:mm using a default approach (e.g. +7 for WIB as user seems Indonesian based on file paths "Kata-Naufal")
        // Or better, just format it as is if it's correct.
        // Let's stick to a simple extraction for now:
        const formatTime = (d: Date | string) => {
            if (!d) return undefined;
            const dateObj = new Date(d);
            // Basic formatting to HH:mm
            return dateObj.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Asia/Jakarta' // Force Jakarta time (WIB) regardless of server timezone
            });
        };

        // Merge logic
        const mergedLogs = logs.map((log: any) => {
            // Find corresponding attendance for this log's date
            // Log date is stored as Date at noon UTC.
            // Attendance checkIn is precise Date.
            // Match by string YYYY-MM-DD
            const logDateStr = new Date(log.date).toISOString().split('T')[0];

            const attendance = attendanceRecords.find((att: any) => {
                const attDateStr = new Date(att.checkIn).toISOString().split('T')[0];
                return attDateStr === logDateStr;
            });

            if (attendance) {
                if (!log.checkIn) log.checkIn = formatTime(attendance.checkIn);
                if (!log.checkOut && attendance.checkOut) log.checkOut = formatTime(attendance.checkOut);
            }
            return log;
        });

        return NextResponse.json({ logs: mergedLogs });

    } catch (error: any) {
        console.error("Logbook GET Error:", error);
        return NextResponse.json({ message: 'Server Error', error: error.message }, { status: 500 });
    }
}

// fs imports removed


export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const formData = await req.formData();
        const date = formData.get('date') as string;
        const activity = formData.get('activity') as string;
        const checkIn = formData.get('checkIn') as string;
        const checkOut = formData.get('checkOut') as string;
        const file = formData.get('file') as File | null;

        if (!date || !activity) {
            return NextResponse.json({ message: 'Missing date or activity' }, { status: 400 });
        }

        const [year, month, day] = date.split('-').map(Number);
        // Store the date. We'll use noon UTC to representing "this day" safely
        const logDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

        let attachmentUrl = undefined;
        let attachmentName = undefined;

        if (file) {
            console.log("POST: File received:", file.name, file.size);
            if (file.size > 2 * 1024 * 1024) {
                return NextResponse.json({ message: 'File too large (max 2MB)' }, { status: 400 });
            }
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Convert to Base64
            const base64Data = buffer.toString('base64');
            const mimeType = file.type || 'application/octet-stream';

            attachmentUrl = `data:${mimeType};base64,${base64Data}`;
            attachmentName = file.name;
        } else {
            console.log("POST: No file received");
        }

        const newLog = await Logbook.create({
            userId,
            date: logDate,
            activity,
            checkIn,
            checkOut,
            attachmentUrl,
            attachmentName
        });
        console.log("POST: Log created:", newLog);

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

export async function PUT(req: Request) {
    try {
        await connectToDatabase();
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const formData = await req.formData();
        const id = formData.get('id') as string;
        const activity = formData.get('activity') as string;
        const checkIn = formData.get('checkIn') as string;
        const checkOut = formData.get('checkOut') as string;
        const file = formData.get('file') as File | null;
        // Optional: handle removing file if a specific flag is passed, but for now just optional overwrite

        if (!id || !activity) {
            return NextResponse.json({ message: 'Missing ID or activity' }, { status: 400 });
        }

        const log = await Logbook.findOne({ _id: id, userId });
        if (!log) {
            return NextResponse.json({ message: 'Log not found' }, { status: 404 });
        }

        let updateData: any = { activity };
        if (checkIn !== null) updateData.checkIn = checkIn;
        if (checkOut !== null) updateData.checkOut = checkOut;

        if (file) {
            console.log("PUT: File received:", file.name);
            if (file.size > 2 * 1024 * 1024) {
                return NextResponse.json({ message: 'File too large (max 2MB)' }, { status: 400 });
            }
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Convert to Base64
            const base64Data = buffer.toString('base64');
            const mimeType = file.type || 'application/octet-stream';

            updateData.attachmentUrl = `data:${mimeType};base64,${base64Data}`;
            updateData.attachmentName = file.name;
            // updateData.attachmentData = base64Data; // Optional if we want raw base64 separately, but URL is enough

        }

        const updatedLog = await Logbook.findByIdAndUpdate(id, updateData, { new: true });
        console.log("PUT: Log updated:", updatedLog);

        return NextResponse.json({ log: updatedLog });
    } catch (error: any) {
        console.error("Logbook PUT Error:", error);
        return NextResponse.json({ message: 'Server Error', error: error.message }, { status: 500 });
    }
}

// PATCH - Toggle physical logbook status
export async function PATCH(req: Request) {
    try {
        await connectToDatabase();
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { id, isRecordedPhysical } = body;

        if (!id || typeof isRecordedPhysical !== 'boolean') {
            return NextResponse.json({ message: 'Missing ID or isRecordedPhysical value' }, { status: 400 });
        }

        const log = await Logbook.findOne({ _id: id, userId });
        if (!log) {
            return NextResponse.json({ message: 'Log not found' }, { status: 404 });
        }

        const updatedLog = await Logbook.findByIdAndUpdate(
            id,
            { isRecordedPhysical },
            { new: true }
        );

        console.log("PATCH: Log status updated:", updatedLog?._id, "isRecordedPhysical:", isRecordedPhysical);

        return NextResponse.json({ log: updatedLog });
    } catch (error: any) {
        console.error("Logbook PATCH Error:", error);
        return NextResponse.json({ message: 'Server Error', error: error.message }, { status: 500 });
    }
}
