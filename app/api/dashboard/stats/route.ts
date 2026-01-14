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

            // Dynamic Target
            // User inputs 'monthlyTargetBase' (e.g. 11240)
            const monthlyTargetBase = user.monthlyTargetBase || 11240;
            dynamicMonthlyTarget = monthlyTargetBase;

            // Calculate Working Days in current month (Mon-Sat, exclude Sundays)
            const tempDate = new Date(startOfMonth);
            while (tempDate <= endOfMonth) {
                // 0 = Sunday, 1 = Monday, ... 6 = Saturday
                if (tempDate.getDay() !== 0) {
                    workingDaysCount++;
                }
                tempDate.setDate(tempDate.getDate() + 1);
            }

            // Daily Target derived from Monthly Target / Working Days
            // e.g., 11240 / 26 = ~432 mins
            // However, user prompt implies "Weekly target 2880 / 6 = 480". 
            // If they input 11240, and days are 26, it's 432.
            // If they strictly want 480, they must input a higher monthly target (12480).
            // We implement the strict math as requested: "daily target can adjust based on input given".
            const dailyTarget = workingDaysCount > 0 ? Math.round(monthlyTargetBase / workingDaysCount) : 0;

            console.log("[Stats API] Stats gathered successfully. Working days:", workingDaysCount, "Daily Target:", dailyTarget);

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
            dailyTargetMinutes: workingDaysCount > 0 ? Math.round((user.monthlyTargetBase || 11240) / workingDaysCount) : 0,
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
