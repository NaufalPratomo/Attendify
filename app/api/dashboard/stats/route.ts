import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    try {
        try {
            await connectToDatabase();
        } catch (dbError: any) {
            console.error("[Stats API] Database Connection Failed:", dbError);
            return NextResponse.json({
                message: 'Database connection failed',
                details: dbError.message || String(dbError)
            }, { status: 500 });
        }

        // Auth Check
        const cookieStore = await cookies();
        const token = cookieStore.get('attendify_token')?.value;

        if (!token) {
            console.warn("[Stats API] Check failed: No token found");
            return NextResponse.json({ message: 'Unauthorized: No token' }, { status: 401 });
        }

        let payload;
        try {
            payload = await verifyToken(token);
        } catch (e) {
            console.error("[Stats API] Token verification threw error:", e);
            return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
        }

        if (!payload || !payload.userId) {
            console.warn("[Stats API] Check failed: Invalid payload", payload);
            return NextResponse.json({ message: 'Unauthorized: Invalid payload' }, { status: 401 });
        }

        const user = await User.findById(payload.userId);
        if (!user) {
            console.warn("[Stats API] User not found for ID:", payload.userId);
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        console.log("[Stats API] User authenticated:", user.email);

        // Stats Calculation (Wrapped in try-catch to prevent full crash)
        let todayStatus = 'none';
        let currentMinutes = 0;
        let yearlyMinutes = 0;
        let recentActivity: any[] = [];
        let dynamicMonthlyTarget = 11240; // Fallback

        try {
            // Calculate Dates
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            // Today's Attendance
            const todayAttendance = await Attendance.findOne({
                userId: user._id,
                checkIn: { $gte: startOfDay, $lte: endOfDay }
            });

            if (todayAttendance) {
                todayStatus = todayAttendance.checkOut ? 'checked-out' : 'checked-in';
            }

            // Yearly Stats
            const yearlyAttendance = await Attendance.find({
                userId: user._id,
                checkIn: { $gte: startOfYear, $lte: endOfYear }
            });
            yearlyMinutes = yearlyAttendance.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

            // Monthly Stats
            const monthlyAttendance = await Attendance.find({
                userId: user._id,
                checkIn: { $gte: startOfMonth, $lte: endOfMonth }
            });
            currentMinutes = monthlyAttendance.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

            // Recent Activity
            recentActivity = await Attendance.find({ userId: user._id })
                .sort({ checkIn: -1 })
                .limit(5);

            // Dynamic Target
            const daysInMonth = endOfMonth.getDate();
            const dailyTarget = (user.monthlyTargetBase || 11240) / 31;
            dynamicMonthlyTarget = Math.round(dailyTarget * daysInMonth);

            console.log("[Stats API] Stats gathered successfully");

        } catch (statsError) {
            console.error("[Stats API] Error calculating stats (continuing with defaults):", statsError);
            // We continue execution to at least return the user info
        }

        return NextResponse.json({
            userName: user.name,
            userEmail: user.email,
            todayStatus,
            currentMinutes,
            yearlyMinutes,
            recentActivity,
            monthlyTargetMinutes: dynamicMonthlyTarget,
            yearlyTargetMinutes: user.yearlyTarget || 134880
        });

    } catch (error: any) {
        console.error("[Stats API] Critical Error:", error);
        return NextResponse.json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
