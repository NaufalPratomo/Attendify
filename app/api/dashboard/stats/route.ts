import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import Holiday from '@/models/Holiday';
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
        let todayMinutes = 0; // Fix: Initialize variable
        let workingDaysCount = 0;
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
                if (todayAttendance.checkOut) {
                    // Completed session
                    // Note: If there are multiple sessions per day, we should sum them up. 
                    // But current logic finds 'findOne', implying usually 1 session per day logic?
                    // The findOne logic in this file only grabs one. 
                    // If we want total minutes for today, we might need to sum *all* records for today if multiple allowed.
                    // Assuming findOne is sufficient based on current app logic.
                    todayMinutes = todayAttendance.durationMinutes || 0;
                } else {
                    // Live session
                    const diffMs = new Date().getTime() - new Date(todayAttendance.checkIn).getTime();
                    todayMinutes = Math.floor(diffMs / 60000);
                }
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

            // If the user is currently checked in (today), that duration is NOT in 'durationMinutes' yet.
            // We should add the live minutes to 'currentMinutes' (Monthly) and 'yearlyMinutes' as well for consistency?
            // "Active" minutes aren't usually counted until finished, but for a progress bar it's nice.
            // Let's add it if we want "Live" stats.
            if (todayStatus === 'checked-in' && todayAttendance) {
                const diffMs = new Date().getTime() - new Date(todayAttendance.checkIn).getTime();
                const liveMinutes = Math.floor(diffMs / 60000);
                // Only add if this record was included in the fetch? 
                // The 'monthlyAttendance' fetch includes 'todayAttendance' record, but durationMinutes is 0.
                // So we can safely add liveMinutes to the total sums.
                currentMinutes += liveMinutes;
                yearlyMinutes += liveMinutes;
            }

            // Recent Activity
            recentActivity = await Attendance.find({ userId: user._id })
                .sort({ checkIn: -1 })
                .limit(5);

            // Daily Target from user settings
            const dailyTarget = user.dailyTarget || 480;

            // Fetch holidays for this month (GLOBAL + PERSONAL for this user)
            const monthStr = String(now.getMonth() + 1).padStart(2, '0');
            const yearStr = String(now.getFullYear());
            const startDateStr = `${yearStr}-${monthStr}-01`;
            const endDateStr = `${yearStr}-${monthStr}-31`;

            const holidays = await Holiday.find({
                dateString: { $gte: startDateStr, $lte: endDateStr },
                $or: [
                    { type: 'GLOBAL' },
                    { type: 'PERSONAL', userId: user._id }
                ]
            });

            // Build a Set of holiday dateStrings for O(1) lookup
            const holidayDateSet = new Set(holidays.map((h: any) => h.dateString as string));

            // Calculate Working Days: exclude Sundays AND holidays
            const tempDate = new Date(startOfMonth);
            while (tempDate <= endOfMonth) {
                const dayOfWeek = tempDate.getDay();
                // Build dateString for this day
                const ds = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;

                if (dayOfWeek !== 0 && !holidayDateSet.has(ds)) {
                    workingDaysCount++;
                }
                tempDate.setDate(tempDate.getDate() + 1);
            }

            // Dynamic Monthly Target = working days * daily target
            dynamicMonthlyTarget = workingDaysCount * dailyTarget;

            console.log("[Stats API] Stats gathered successfully. Working days:", workingDaysCount, "Holidays:", holidayDateSet.size, "Dynamic target:", dynamicMonthlyTarget);

        } catch (statsError) {
            console.error("[Stats API] Error calculating stats (continuing with defaults):", statsError);
            // We continue execution to at least return the user info
        }

        return NextResponse.json({
            userName: user.name,
            userEmail: user.email,
            userAvatar: user.avatar,
            todayStatus,
            todayMinutes: todayMinutes || 0,
            currentMinutes,
            yearlyMinutes,
            recentActivity,
            dailyTargetMinutes: user.dailyTarget || 480,
            monthlyTargetMinutes: dynamicMonthlyTarget,
            yearlyTargetMinutes: user.yearlyTarget || 134880,
            workingDaysCount
        });

    } catch (error: any) {
        console.error("[Stats API] Critical Error:", error);
        return NextResponse.json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
