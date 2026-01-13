
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

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

        return NextResponse.json({
            message: 'File uploaded successfully',
            url: `/uploads/${filename}`
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ message: 'Upload failed', details: error.message }, { status: 500 });
    }
}
