# Deployment Guide

## ✅ Build Fixed!

The Firebase Admin initialization issue has been resolved. The app now uses **lazy initialization** - Firebase Admin only initializes when the upload API is actually called, not during build time.

## Quick Deploy Steps

### 1. Build Locally (Test First)

```bash
cd my-app
npm run build
npm start
```

If build succeeds, you're ready to deploy!

### 2. Deploy to Vercel

#### Option A: Using Deploy Script
```bash
./deploy.sh
```

#### Option B: Manual Deploy
```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 3. Set Environment Variables in Vercel

After deploying, go to [Vercel Dashboard](https://vercel.com/dashboard):

1. Select your project
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

**Required (Client-side):**
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_value
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_value
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_value
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_value
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_value
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_value
NEXT_PUBLIC_FIREBASE_APP_ID=your_value
```

**Optional (For Upload API - Server-side):**
```
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

4. **Redeploy** after adding variables:
   ```bash
   vercel --prod
   ```

### 4. Get Firebase Admin Credentials

If you want to use the upload feature, you need Firebase Admin credentials:

**Option 1: Use Service Account File (Local Development)**
- Place `device-streaming-a9e6bb7d-firebase-adminsdk-fbsvc-cf3530d711.json` in:
  - Project root (one level up from `my-app`), OR
  - `my-app` directory

**Option 2: Use Environment Variables (Production)**
- Extract from service account JSON:
  - `FIREBASE_PRIVATE_KEY` = `private_key` field
  - `FIREBASE_CLIENT_EMAIL` = `client_email` field
- Add to Vercel environment variables

## Troubleshooting

### Build Fails
- ✅ **Fixed!** Firebase Admin now initializes lazily
- Build should succeed even without service account file

### Upload API Fails
- Check environment variables are set in Vercel
- Verify Firebase Storage CORS is configured
- Check Firebase Storage security rules allow uploads

### Video Not Playing on TV
- Verify all `NEXT_PUBLIC_*` variables are set
- Check Firebase Realtime Database rules
- Test URL in browser first: `https://your-app.vercel.app/?user=user1`

## Production Checklist

- [ ] Build succeeds locally
- [ ] Deployed to Vercel
- [ ] All environment variables set
- [ ] Test upload functionality
- [ ] Test video playback
- [ ] Access on Smart TV browser
- [ ] Firebase Storage CORS configured
- [ ] Firebase Security Rules set

## Environment Variables Reference

See `.env.example` for all available variables.

**Important:** Never commit `.env` files with real credentials!

