# Firebase Storage CORS Setup

If you're experiencing CORS errors when uploading videos, you need to configure CORS for your Firebase Storage bucket.

## Option 1: Using gsutil (Recommended)

1. **Install Google Cloud SDK** (if not already installed):
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate with Google Cloud**:
   ```bash
   gcloud auth login
   ```

3. **Set your project**:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```
   Replace `YOUR_PROJECT_ID` with your Firebase project ID (e.g., `device-streaming-a9e6bb7d`)

4. **Apply CORS configuration**:
   ```bash
   gsutil cors set firebase-storage-cors.json gs://YOUR_STORAGE_BUCKET
   ```
   Replace `YOUR_STORAGE_BUCKET` with your storage bucket name (e.g., `device-streaming-a9e6bb7d.firebasestorage.app`)

## Option 2: Using Firebase Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **Cloud Storage** → **Browser**
4. Click on your storage bucket
5. Go to the **Configuration** tab
6. Scroll to **CORS configuration**
7. Click **Edit CORS configuration**
8. Paste the contents of `firebase-storage-cors.json`
9. Click **Save**

## Option 3: Using Firebase CLI

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Set your project**:
   ```bash
   firebase use YOUR_PROJECT_ID
   ```

4. **Apply CORS using gsutil** (Firebase CLI doesn't have direct CORS command):
   ```bash
   gsutil cors set firebase-storage-cors.json gs://YOUR_STORAGE_BUCKET
   ```

## Verify CORS Configuration

After setting up CORS, verify it's working:

```bash
gsutil cors get gs://YOUR_STORAGE_BUCKET
```

You should see the CORS configuration you just set.

## Update firebase-storage-cors.json

Before applying, make sure to update `firebase-storage-cors.json` with your actual domain:

- Replace `https://your-domain.com` with your production domain
- Add any other domains you'll be using

## Firebase Storage Security Rules

Also make sure your Firebase Storage security rules allow uploads. In Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /videos/{allPaths=**} {
      allow read: if true;
      allow write: if true; // For development - restrict in production!
    }
  }
}
```

**Important**: The above rules allow anyone to read/write. For production, implement proper authentication!

## Troubleshooting

- **Still getting CORS errors?** Make sure your origin URL matches exactly (including http vs https, port numbers, etc.)
- **Can't find gsutil?** Make sure Google Cloud SDK is installed and in your PATH
- **Permission denied?** Make sure you're authenticated and have the correct project selected

