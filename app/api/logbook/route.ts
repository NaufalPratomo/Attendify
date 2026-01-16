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
        const monthStr = searchParams.get('month');
        const yearStr = searchParams.get('year');

        if (dateStr) {
            // Parse date (YYYY-MM-DD)
            const [year, month, day] = dateStr.split('-').map(Number);
            const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
            const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

            const logs = await Logbook.find({
                userId,
                date: { $gte: startDate, $lte: endDate }
            }).sort({ createdAt: 1 });

            return NextResponse.json({ logs });
        } else if (monthStr && yearStr) {
            // Fetch for entire month
            const year = parseInt(yearStr);
            const month = parseInt(monthStr); // 1-12

            if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
                return NextResponse.json({ message: 'Invalid month or year' }, { status: 400 });
            }

            const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
            // End date is start of next month
            const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));

            const logs = await Logbook.find({
                userId,
                date: { $gte: startDate, $lt: endDate }
            }).sort({ date: 1, createdAt: 1 }); // Sort by log date, then creation time

            return NextResponse.json({ logs });
        } else {
            return NextResponse.json({ message: 'Date or Month/Year is required' }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Logbook GET Error:", error);
        return NextResponse.json({ message: 'Server Error', error: error.message }, { status: 500 });
    }
}

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const formData = await req.formData();
        const date = formData.get('date') as string;
        const activity = formData.get('activity') as string;
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
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Create unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '-');
            const filename = `${uniqueSuffix}-${originalName}`;

            // Ensure upload directory exists
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            try {
                await mkdir(uploadDir, { recursive: true });
            } catch (e) {
                // ignore if exists
            }

            // Write file
            const filepath = path.join(uploadDir, filename);
            await writeFile(filepath, buffer);

            attachmentUrl = `/uploads/${filename}`;
            attachmentName = file.name;
            console.log("POST: File saved to:", filepath, "URL:", attachmentUrl);
        } else {
            console.log("POST: No file received");
        }

        const newLog = await Logbook.create({
            userId,
            date: logDate,
            activity,
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

        if (file) {
            console.log("PUT: File received:", file.name);
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Create unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '-');
            const filename = `${uniqueSuffix}-${originalName}`;

            // Ensure upload directory exists
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            try {
                await mkdir(uploadDir, { recursive: true });
            } catch (e) {
                // ignore if exists
            }

            // Write file
            const filepath = path.join(uploadDir, filename);
            await writeFile(filepath, buffer);

            updateData.attachmentUrl = `/uploads/${filename}`;
            updateData.attachmentName = file.name;
            console.log("PUT: File saved/updated at:", filepath);
        }

        const updatedLog = await Logbook.findByIdAndUpdate(id, updateData, { new: true });
        console.log("PUT: Log updated:", updatedLog);

        return NextResponse.json({ log: updatedLog });
    } catch (error: any) {
        console.error("Logbook PUT Error:", error);
        return NextResponse.json({ message: 'Server Error', error: error.message }, { status: 500 });
    }
}
