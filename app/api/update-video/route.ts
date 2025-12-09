import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getDatabase } from 'firebase-admin/database';

export async function POST(request: NextRequest) {
    try {
        // Initialize Firebase Admin
        getFirebaseAdminApp();

        const body = await request.json();
        const { userId, videoUrl, message } = body;

        if (!userId) {
            return NextResponse.json({ error: 'No userId provided' }, { status: 400 });
        }

        if (!videoUrl) {
            return NextResponse.json({ error: 'No videoUrl provided' }, { status: 400 });
        }

        // Update Firebase Realtime Database
        const db = getDatabase();
        const userRef = db.ref(`users/${userId}`);

        // Get existing user data to preserve name
        const existingUserSnapshot = await userRef.once('value');
        let userName = userId;
        if (existingUserSnapshot.exists()) {
            const existingData = existingUserSnapshot.val();
            userName = existingData.name || userId;
        }

        const userData: {
            name: string;
            videoUrl: string;
            message?: string;
        } = {
            name: userName,
            videoUrl: videoUrl,
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
