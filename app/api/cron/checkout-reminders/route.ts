import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/Attendance';
import Adjustment from '@/models/Adjustment';
import { sendEmail } from '@/lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AttendanceWithUser = {
    _id: string;
    checkIn: Date;
    notificationMilestonesSent?: number[];
    userId?: {
        name?: string;
        email?: string;
        dailyTarget?: number;
    };
};

const getStartOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
const getEndOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const toLocalDateString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getReminderMilestoneToSend = (remainingMinutes: number, sentMilestones: number[]) => {
    if (remainingMinutes <= 0 && !sentMilestones.includes(0)) return 0;
    if (remainingMinutes <= 10 && remainingMinutes > 0 && !sentMilestones.includes(10)) return 10;
    if (remainingMinutes <= 30 && remainingMinutes > 10 && !sentMilestones.includes(30)) return 30;
    if (remainingMinutes <= 60 && remainingMinutes > 30 && !sentMilestones.includes(60)) return 60;
    return null;
};

const getReminderLabel = (milestone: number) => {
    if (milestone === 0) return 'Sudah waktunya pulang';
    return `${milestone} menit lagi`;
};

const buildReminderEmailHtml = ({
    name,
    milestone,
    checkInTime,
    estimatedCheckoutTime,
    remainingMinutes,
}: {
    name: string;
    milestone: number;
    checkInTime: string;
    estimatedCheckoutTime: string;
    remainingMinutes: number;
}) => {
    const safeRemaining = Math.max(0, remainingMinutes);
    const headline = milestone === 0
        ? 'Waktunya check-out.'
        : `Jam pulang tinggal ${milestone} menit lagi.`;

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
            <h2 style="margin: 0 0 12px;">Pengingat Jam Pulang</h2>
            <p>Halo ${name},</p>
            <p>${headline}</p>
            <ul>
                <li>Check-in: <strong>${checkInTime}</strong></li>
                <li>Estimasi jam pulang: <strong>${estimatedCheckoutTime}</strong></li>
                <li>Sisa waktu: <strong>${safeRemaining} menit</strong></li>
            </ul>
            <p>Silakan bersiap untuk check-out tepat waktu.</p>
            <p style="margin-top: 20px; color: #6b7280;">Attendify Notification Service</p>
        </div>
    `;
};

const getSecretFromRequest = (req: Request) => {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice('Bearer '.length).trim();
    }

    const url = new URL(req.url);
    return url.searchParams.get('secret') || '';
};

export async function GET(req: Request) {
    try {
        const cronSecret = process.env.CRON_SECRET;
        const requestSecret = getSecretFromRequest(req);

        if (!cronSecret || requestSecret !== cronSecret) {
            return NextResponse.json({ message: 'Unauthorized cron request' }, { status: 401 });
        }

        await connectToDatabase();

        const now = new Date();
        const startOfDay = getStartOfDay(now);
        const endOfDay = getEndOfDay(now);
        const todayDateString = toLocalDateString(now);

        const adjustments = await Adjustment.find({
            startDate: { $lte: todayDateString },
            endDate: { $gte: todayDateString },
        });

        const totalReductionMinutes = adjustments.reduce((total: number, adj: { reductionMinutes?: number }) => {
            return total + Number(adj.reductionMinutes || 0);
        }, 0);

        const activeAttendances = await Attendance.find({
            checkIn: { $gte: startOfDay, $lte: endOfDay },
            checkOut: { $exists: false },
        }).populate('userId', 'name email dailyTarget');

        let remindersSent = 0;
        let skipped = 0;
        let failed = 0;

        for (const attendanceDoc of activeAttendances as unknown as AttendanceWithUser[]) {
            const user = attendanceDoc.userId;
            if (!user?.email) {
                skipped += 1;
                continue;
            }

            const dailyTarget = Math.max(0, Number(user.dailyTarget || 480) - totalReductionMinutes);
            const workedMinutes = Math.floor((now.getTime() - new Date(attendanceDoc.checkIn).getTime()) / 60000);
            const remainingMinutes = dailyTarget - workedMinutes;
            const sentMilestones = Array.isArray(attendanceDoc.notificationMilestonesSent)
                ? attendanceDoc.notificationMilestonesSent
                : [];

            const milestone = getReminderMilestoneToSend(remainingMinutes, sentMilestones);
            if (milestone === null) {
                skipped += 1;
                continue;
            }

            const lockResult = await Attendance.updateOne(
                { _id: attendanceDoc._id, notificationMilestonesSent: { $ne: milestone } },
                { $addToSet: { notificationMilestonesSent: milestone } }
            );

            if (lockResult.modifiedCount === 0) {
                skipped += 1;
                continue;
            }

            try {
                const checkInDate = new Date(attendanceDoc.checkIn);
                const estimatedCheckoutDate = new Date(checkInDate.getTime() + (dailyTarget * 60000));
                const checkInTime = checkInDate.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });
                const estimatedCheckoutTime = estimatedCheckoutDate.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });

                await sendEmail(
                    user.email,
                    `Attendify - Pengingat Pulang (${getReminderLabel(milestone)})`,
                    buildReminderEmailHtml({
                        name: user.name || 'Kamu',
                        milestone,
                        checkInTime,
                        estimatedCheckoutTime,
                        remainingMinutes,
                    })
                );

                remindersSent += 1;
            } catch (emailError) {
                failed += 1;
                console.error('[Cron Checkout Reminders] Failed to send email:', emailError);
                await Attendance.updateOne(
                    { _id: attendanceDoc._id },
                    { $pull: { notificationMilestonesSent: milestone } }
                );
            }
        }

        return NextResponse.json({
            message: 'Checkout reminder cron executed',
            now: now.toISOString(),
            activeAttendances: activeAttendances.length,
            remindersSent,
            skipped,
            failed,
        });
    } catch (error) {
        console.error('[Cron Checkout Reminders] Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
