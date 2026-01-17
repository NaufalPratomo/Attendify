
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        // Limit size for profile/avatar upload (e.g. 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ message: 'File too large (max 2MB)' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const base64Data = buffer.toString('base64');
        const mimeType = file.type || 'application/octet-stream';
        const dataUri = `data:${mimeType};base64,${base64Data}`;

        return NextResponse.json({
            message: 'File processed successfully',
            url: dataUri
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ message: 'Upload failed', details: error.message }, { status: 500 });
    }
}
