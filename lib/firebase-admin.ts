import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import path from 'path';
import fs from 'fs';

export function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    // Try multiple possible paths for the service account file
    const possiblePaths = [
      // In project root (one level up from my-app)
      path.join(process.cwd(), '..', 'device-streaming-a9e6bb7d-firebase-adminsdk-fbsvc-cf3530d711.json'),
      // In my-app directory
      path.join(process.cwd(), 'device-streaming-a9e6bb7d-firebase-adminsdk-fbsvc-cf3530d711.json'),
      // Absolute path from workspace root
      path.join(process.cwd(), '..', '..', 'device-streaming-a9e6bb7d-firebase-adminsdk-fbsvc-cf3530d711.json'),
    ];

    let serviceAccountPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        serviceAccountPath = possiblePath;
        break;
      }
    }

    if (serviceAccountPath) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      return initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
  } catch (error) {
    console.warn('Could not load service account file:', error);
  }

  // Fallback: use environment variables
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    return initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  throw new Error('Firebase Admin initialization failed: Service account file or environment variables not found');
}
