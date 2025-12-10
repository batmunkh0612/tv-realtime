import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';

export async function POST(request: NextRequest) {
    try {
        const app = getFirebaseAdminApp();
        const storage = getStorage(app);
        const bucket = storage.bucket();

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const userId = formData.get('userId') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'No userId provided' }, { status: 400 });
        }

        if (!file.type.startsWith('video/')) {
            return NextResponse.json({ error: 'File must be a video' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `videos/${userId}/${timestamp}-${sanitizedFileName}`;

        const fileUpload = bucket.file(fileName);
        
        await fileUpload.save(buffer, {
            metadata: {
                contentType: file.type,
                metadata: {
                    uploadedBy: userId,
                    originalName: file.name,
                    uploadTime: new Date().toISOString(),
                }
            },
            public: true,
        });

        await fileUpload.makePublic();

        const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        return NextResponse.json({
            success: true,
            downloadURL,
            fileName,
        });
    } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Upload failed: ${errorMessage}` },
            { status: 500 }
        );
    }
}
