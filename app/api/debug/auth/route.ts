
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ message: 'No token found in cookies' }, { status: 404 });
        }

        const payload = await verifyToken(token);

        if (!payload) {
            return NextResponse.json({ message: 'Token verification failed' }, { status: 401 });
        }

        return NextResponse.json({
            message: 'Token verification successful',
            payload
        });
    } catch (error: any) {
        return NextResponse.json({
            message: 'Error verifying token',
            error: error.message
        }, { status: 500 });
    }
}
