import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/Attendance';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';

function buildDateTime(date: string, time: string, tzOffsetMinutes?: number) {
  // date: YYYY-MM-DD, time: HH:mm
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  // When tzOffsetMinutes is provided, interpret the input time as the user's local time.
  // tzOffsetMinutes follows JS Date.getTimezoneOffset(): minutes to add to local time to get UTC.
  if (typeof tzOffsetMinutes === 'number' && Number.isFinite(tzOffsetMinutes)) {
    const utcMillis = Date.UTC(year, month - 1, day, hour, minute) + tzOffsetMinutes * 60_000;
    return new Date(utcMillis);
  }

  // Fallback: previous behavior (server local timezone).
  return new Date(year, month - 1, day, hour, minute);
}

function computeDurationAndStatus(checkIn: Date, checkOut?: Date) {
  if (!checkOut) {
    return { durationMinutes: 0, status: 'Present' as const };
  }

  const diffMs = checkOut.getTime() - checkIn.getTime();
  if (diffMs < 0) {
    return { error: 'Check-out cannot be before check-in' } as const;
  }

  const durationMinutes = Math.floor(diffMs / 1000 / 60);
  const status = durationMinutes >= 480 ? ('Valid' as const) : ('Short' as const);
  return { durationMinutes, status };
}

async function requireUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.userId) return null;
  return payload;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'Invalid record id' }, { status: 400 });
    }

    const payload = await requireUser();
    if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { date, checkInTime, checkOutTime, notes, tzOffsetMinutes } = await req.json();

    if (!date || !checkInTime) {
      return NextResponse.json({ message: 'Date and Check-in time are required' }, { status: 400 });
    }

    const record = await Attendance.findOne({ _id: params.id, userId: payload.userId });
    if (!record) return NextResponse.json({ message: 'Record not found' }, { status: 404 });

    // Only allow editing manual records to avoid tampering with automatic check-ins.
    if (!record.isManual) {
      return NextResponse.json({ message: 'Only manual records can be edited' }, { status: 403 });
    }

    const tzOffset = Number.isFinite(tzOffsetMinutes) ? Number(tzOffsetMinutes) : undefined;
    const checkInDate = buildDateTime(date, checkInTime, tzOffset);
    const checkOutDate = checkOutTime ? buildDateTime(date, checkOutTime, tzOffset) : undefined;

    const computed = computeDurationAndStatus(checkInDate, checkOutDate);
    if ('error' in computed) {
      return NextResponse.json({ message: computed.error }, { status: 400 });
    }

    record.checkIn = checkInDate;
    record.checkOut = checkOutDate;
    record.durationMinutes = computed.durationMinutes;
    record.status = computed.status;
    record.notes = notes;

    await record.save();

    return NextResponse.json({ message: 'Record updated successfully', record });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : String(error);
    console.error('Update Attendance Record Error:', error);
    return NextResponse.json({ message: 'Internal server error', details }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'Invalid record id' }, { status: 400 });
    }

    const payload = await requireUser();
    if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const record = await Attendance.findOne({ _id: params.id, userId: payload.userId });
    if (!record) return NextResponse.json({ message: 'Record not found' }, { status: 404 });

    if (!record.isManual) {
      return NextResponse.json({ message: 'Only manual records can be deleted' }, { status: 403 });
    }

    await Attendance.deleteOne({ _id: params.id, userId: payload.userId });

    return NextResponse.json({ message: 'Record deleted successfully' });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : String(error);
    console.error('Delete Attendance Record Error:', error);
    return NextResponse.json({ message: 'Internal server error', details }, { status: 500 });
  }
}
