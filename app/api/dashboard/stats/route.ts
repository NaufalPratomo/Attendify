import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import Holiday from '@/models/Holiday';
import Adjustment from '@/models/Adjustment';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

type AdjustmentWindow = {
    start: Date;
    end: Date;
    reductionMinutes: number;
};

type AdjustmentInput = {
    startDate: string;
    endDate: string;
    reductionMinutes?: number;
};

type ScheduleEntry = {
    type: 'GLOBAL' | 'PERSONAL' | 'PIKET';
    dateString: string;
    isDeductible?: boolean;
};

const getStartOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
const getEndOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const toLocalDateString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const normalizeAdjustments = (adjustments: AdjustmentInput[]): AdjustmentWindow[] => {
    return adjustments
        .map((adj) => {
            const start = new Date(`${adj.startDate}T00:00:00.000`);
            const end = new Date(`${adj.endDate}T23:59:59.999`);
            return {
                start,
                end,
                reductionMinutes: Number(adj.reductionMinutes || 0)
            };
        })
        .filter((adj) => !Number.isNaN(adj.start.getTime()) && !Number.isNaN(adj.end.getTime()));
};

const getAdjustmentReductionForDay = (date: Date, adjustmentWindows: AdjustmentWindow[]) => {
    const dayStart = getStartOfDay(date);
    const dayEnd = getEndOfDay(date);
    return adjustmentWindows.reduce((total, adj) => {
        if (adj.start <= dayEnd && adj.end >= dayStart) {
            return total + adj.reductionMinutes;
        }
        return total;
    }, 0);
};

export async function GET(req: Request) {
    try {
        try {
            await connectToDatabase();
        } catch (dbError: unknown) {
            const details = dbError instanceof Error ? dbError.message : String(dbError);
            console.error("[Stats API] Database Connection Failed:", dbError);
            return NextResponse.json({
                message: 'Database connection failed',
                details
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
        let recentActivity: unknown[] = [];
        let dynamicMonthlyTarget = 11240; // Fallback
        let dynamicDailyTarget = user.dailyTarget || 480;
        let dailyProgress = 0;

        try {
            // Calculate Dates
            const now = new Date();
            const url = new URL(req.url);
            const yearParam = parseInt(url.searchParams.get('year') || '', 10);
            const monthParam = parseInt(url.searchParams.get('month') || '', 10); // 1-12

            const selectedYear = Number.isNaN(yearParam) ? now.getFullYear() : yearParam;
            const selectedMonthIndex = Number.isNaN(monthParam) ? now.getMonth() : Math.min(11, Math.max(0, monthParam - 1));
            const isCurrentSelectedMonth = selectedYear === now.getFullYear() && selectedMonthIndex === now.getMonth();

            const startOfDay = getStartOfDay(now);
            const endOfDay = getEndOfDay(now);

            const startOfYear = new Date(selectedYear, 0, 1);
            const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59, 999);

            const startOfMonth = new Date(selectedYear, selectedMonthIndex, 1);
            const endOfMonth = new Date(selectedYear, selectedMonthIndex + 1, 0, 23, 59, 59, 999);

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
            if (isCurrentSelectedMonth && todayStatus === 'checked-in' && todayAttendance) {
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

            // Fetch schedule entries for this month (GLOBAL + PERSONAL + PIKET for this user)
            const monthStr = String(selectedMonthIndex + 1).padStart(2, '0');
            const yearStr = String(selectedYear);
            const startDateStr = `${yearStr}-${monthStr}-01`;
            const endDateStr = `${yearStr}-${monthStr}-${String(endOfMonth.getDate()).padStart(2, '0')}`;

            const scheduleEntries = await Holiday.find({
                dateString: { $gte: startDateStr, $lte: endDateStr },
                $or: [
                    { type: 'GLOBAL' },
                    { type: 'PERSONAL', userId: user._id },
                    { type: 'PIKET', userId: user._id }
                ]
            });

            // Separate into holiday set (with deductible flag) and piket set
            const holidayDateMap = new Map<string, boolean>(); // dateString -> isDeductible
            const piketDateSet = new Set<string>();

            scheduleEntries.forEach((entry: ScheduleEntry) => {
                if (entry.type === 'PIKET') {
                    piketDateSet.add(entry.dateString);
                } else {
                    // If multiple holidays on same date, deductible wins (any true → true)
                    const existing = holidayDateMap.get(entry.dateString);
                    const isDeductible = entry.isDeductible !== false; // default true for backward compat
                    holidayDateMap.set(entry.dateString, existing === true || isDeductible);
                }
            });

            // Fetch active adjustments for this month (global — no userId)
            const adjustments = await Adjustment.find({
                startDate: { $lte: endDateStr },
                endDate: { $gte: startDateStr },
            }) as AdjustmentInput[];
            const adjustmentWindows = normalizeAdjustments(adjustments);

            if (isCurrentSelectedMonth) {
                const todayReduction = getAdjustmentReductionForDay(now, adjustmentWindows);
                dynamicDailyTarget = Math.max(0, dailyTarget - todayReduction);
                dailyProgress = dynamicDailyTarget > 0
                    ? Math.min(100, Math.round((todayMinutes / dynamicDailyTarget) * 100))
                    : (todayMinutes > 0 ? 100 : 0);
            } else {
                dynamicDailyTarget = dailyTarget;
                dailyProgress = 0;
            }

            // Calculate target adjustments with priority-based logic:
            // 1. PIKET → adds dailyTarget to monthly target (extra work day)
            // 2. Sunday → skip (default off)
            // 3. Holiday (deductible) → subtracts dailyTarget from monthly target
            // 4. Holiday (non-deductible) → no change to target, user must make up hours
            // 5. Adjustment period → subtracts reductionMinutes per working day
            // 6. Else → normal work day
            let deductionMinutes = 0;
            let addedPiketMinutes = 0;
            let adjustmentDeductionTotal = 0;
            const monthlyTargetBase = user.monthlyTargetBase || 11240;

            const tempDate = new Date(startOfMonth);
            while (tempDate <= endOfMonth) {
                const dayOfWeek = tempDate.getDay();
                const ds = toLocalDateString(tempDate);

                const isPiket = piketDateSet.has(ds);
                const isSunday = dayOfWeek === 0;
                const holidayDeductible = holidayDateMap.get(ds); // undefined = no holiday, true = deductible, false = not

                if (isPiket) {
                    // PIKET: masuk di hari libur → increase target
                    workingDaysCount++;
                    addedPiketMinutes += dailyTarget;
                } else if (isSunday) {
                    // Default day off — skip
                } else if (holidayDeductible !== undefined) {
                    // Holiday exists on this date
                    if (holidayDeductible === true) {
                        // Deductible holiday (sakit, emergency, libur nasional) → reduce target
                        deductionMinutes += dailyTarget;
                    }
                    // Non-deductible: target stays, user harus menabung jam
                } else {
                    // Normal work day
                    workingDaysCount++;

                    adjustmentDeductionTotal += getAdjustmentReductionForDay(tempDate, adjustmentWindows);
                }

                tempDate.setDate(tempDate.getDate() + 1);
            }

            // Final Formula: base - deductions + piket bonus - adjustment reductions
            dynamicMonthlyTarget = monthlyTargetBase - deductionMinutes + addedPiketMinutes - adjustmentDeductionTotal;

            const daysInSelectedMonth = endOfMonth.getDate();
            const elapsedDays = isCurrentSelectedMonth
                ? now.getDate()
                : (startOfMonth > now ? 0 : daysInSelectedMonth);
            const elapsedTarget = dynamicMonthlyTarget > 0
                ? Math.round((dynamicMonthlyTarget / daysInSelectedMonth) * elapsedDays)
                : 0;
            const actualMinutesWorked = currentMinutes;
            const differenceMinutes = actualMinutesWorked - elapsedTarget;

            console.log("[Stats API] Working days:", workingDaysCount, "Deduction:", deductionMinutes, "Piket+:", addedPiketMinutes, "Adj-:", adjustmentDeductionTotal, "Base:", monthlyTargetBase, "Target:", dynamicMonthlyTarget);
            return NextResponse.json({
                userName: user.name,
                userEmail: user.email,
                userAvatar: user.avatar,
                todayStatus,
                todayMinutes: todayMinutes || 0,
                currentMinutes,
                yearlyMinutes,
                recentActivity,
                dailyTargetMinutes: dynamicDailyTarget,
                dynamicDailyTargetMinutes: dynamicDailyTarget,
                dailyProgress,
                monthlyTargetMinutes: dynamicMonthlyTarget,
                dynamicMonthlyTarget,
                actualMinutesWorked,
                elapsedTarget,
                differenceMinutes,
                yearlyTargetMinutes: user.yearlyTarget || 134880,
                workingDaysCount
            });

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
            dailyTargetMinutes: dynamicDailyTarget,
            dynamicDailyTargetMinutes: dynamicDailyTarget,
            dailyProgress,
            monthlyTargetMinutes: dynamicMonthlyTarget,
            dynamicMonthlyTarget,
            actualMinutesWorked: currentMinutes,
            elapsedTarget: 0,
            differenceMinutes: currentMinutes,
            yearlyTargetMinutes: user.yearlyTarget || 134880,
            workingDaysCount
        });

    } catch (error: unknown) {
        console.error("[Stats API] Critical Error:", error);
        return NextResponse.json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
