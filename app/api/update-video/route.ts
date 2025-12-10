import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getDatabase } from 'firebase-admin/database';

export async function POST(request: NextRequest) {
    try {
        getFirebaseAdminApp();

        const body = await request.json();
        const { userId, videoUrl, queue, message } = body;

        if (!userId) {
            return NextResponse.json({ error: 'No userId provided' }, { status: 400 });
        }

        if (!videoUrl && (!queue || queue.length === 0)) {
            return NextResponse.json({ error: 'No videoUrl or queue provided' }, { status: 400 });
        }

        const db = getDatabase();
        const userRef = db.ref(`users/${userId}`);

        const existingUserSnapshot = await userRef.once('value');
        let userName = userId;
        if (existingUserSnapshot.exists()) {
            const existingData = existingUserSnapshot.val();
            userName = existingData.name || userId;
        }

        const userData: {
            name: string;
            videoUrl: string;
            queue?: string[];
            message?: string;
        } = {
            name: userName,
            videoUrl: videoUrl || (queue && queue.length > 0 ? queue[0] : ''),
            ...(queue && { queue }),
            ...(message && { message }),
        };

        await userRef.set(userData);

        return NextResponse.json({
            success: true,
            message: 'Video updated successfully',
        });
    } catch (error) {
        console.error('Update error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Update failed: ${errorMessage}` },
            { status: 500 }
        );
    }
}
