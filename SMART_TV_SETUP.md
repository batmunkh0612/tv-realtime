# Smart TV Setup Guide

This guide will help you deploy and run your Real-Time TV app on a Smart TV.

## Option 1: Deploy to Vercel (Recommended - Easiest)

### Step 1: Prepare Your App

1. **Build your app locally first to test:**
   ```bash
   cd my-app
   npm run build
   npm start
   ```

2. **Create a `.env.production` file** (if needed) with your Firebase config:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### Step 2: Deploy to Vercel

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd my-app
   vercel
   ```
   Follow the prompts. When asked:
   - Set up and deploy? **Yes**
   - Which scope? Choose your account
   - Link to existing project? **No**
   - Project name? (Press Enter for default)
   - Directory? **./**
   - Override settings? **No**

4. **Add Environment Variables:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to Settings → Environment Variables
   - Add all your `NEXT_PUBLIC_*` Firebase variables

5. **Redeploy** after adding environment variables:
   ```bash
   vercel --prod
   ```

6. **Get your URL:** Vercel will give you a URL like `https://your-app.vercel.app`

### Step 3: Access on Smart TV

1. **On your Smart TV:**
   - Open the web browser (Samsung Internet, LG Browser, etc.)
   - Navigate to: `https://your-app.vercel.app/?user=user1`
   - The video should load automatically

2. **Bookmark the URL** on your TV browser for easy access

---

## Option 2: Deploy to Netlify

### Step 1: Build Configuration

Create `netlify.toml` in your `my-app` folder:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Step 2: Deploy

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   cd my-app
   netlify deploy --prod
   ```

4. **Add Environment Variables** in Netlify Dashboard → Site Settings → Environment Variables

---

## Option 3: Self-Hosted (Local Network)

### Step 1: Build for Production

```bash
cd my-app
npm run build
```

### Step 2: Start Production Server

```bash
npm start
```

The app will run on `http://localhost:3000` (or port specified)

### Step 3: Find Your Computer's IP Address

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```

Look for your local IP (usually `192.168.x.x` or `10.0.x.x`)

### Step 4: Access from Smart TV

1. Make sure your TV and computer are on the **same WiFi network**
2. On your Smart TV browser, go to: `http://YOUR_IP_ADDRESS:3000/?user=user1`
   - Example: `http://192.168.1.100:3000/?user=user1`

### Step 5: Keep Server Running

- The server needs to stay running on your computer
- Consider using `pm2` to keep it running:
  ```bash
  npm install -g pm2
  pm2 start npm --name "realtime-tv" -- start
  pm2 save
  pm2 startup  # Follow instructions to auto-start on boot
  ```

---

## Option 4: Use a Raspberry Pi or Mini PC

1. Install Node.js on your Raspberry Pi
2. Clone your project
3. Follow Option 3 steps
4. Connect Raspberry Pi to TV via HDMI
5. Set TV to auto-start browser on boot (if supported)

---

## TV Browser Compatibility

### Supported TVs:
- ✅ **Samsung Smart TV** (Tizen Browser)
- ✅ **LG Smart TV** (webOS Browser)
- ✅ **Sony Android TV** (Chrome)
- ✅ **Android TV** (Chrome)
- ⚠️ **Roku** (Limited - may need workaround)
- ⚠️ **Fire TV** (Silk Browser - may need workaround)

### TV Browser Tips:

1. **Enable JavaScript** in TV browser settings
2. **Allow autoplay** if prompted
3. **Disable power saving mode** to keep TV on
4. **Use wired connection** (Ethernet) for better stability

---

## Optimizing for TV

### 1. Auto-Start Browser (Samsung/LG)

**Samsung:**
- Settings → General → External Device Manager → Autorun Last App
- Or use SmartThings app to control

**LG:**
- Settings → General → Additional Settings → Home Settings → Home Auto Launch

### 2. Kiosk Mode (Advanced)

Some TVs support kiosk mode. Check your TV's developer options or use a kiosk browser app.

### 3. Remote Control Support

The video player controls work with TV remote:
- **OK/Enter**: Play/Pause
- **Arrow Keys**: Seek (on some TVs)
- **Volume**: TV volume control

---

## Troubleshooting

### Video Not Playing:
1. Check Firebase Storage CORS settings
2. Verify video URL is accessible
3. Check TV browser console (if available)
4. Try a different video format (MP4 recommended)

### App Not Loading:
1. Check internet connection
2. Verify Firebase environment variables are set
3. Check TV browser compatibility
4. Try accessing admin panel first: `/admin`

### Performance Issues:
1. Use wired Ethernet connection
2. Reduce video quality/file size
3. Check TV's available memory
4. Close other apps on TV

---

## Quick Start Commands

```bash
# Development (local testing)
npm run dev

# Production build
npm run build

# Production server
npm start

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod
```

---

## Recommended Setup

**For Best Results:**
1. ✅ Deploy to Vercel (free, fast, reliable)
2. ✅ Use wired Ethernet connection on TV
3. ✅ Bookmark the URL on TV browser
4. ✅ Set TV to auto-launch browser (if supported)
5. ✅ Use a dedicated user account for each TV: `/?user=tv1`, `/?user=tv2`, etc.

---

## Security Notes

- The admin panel (`/admin`) is publicly accessible
- Consider adding authentication for production use
- Firebase Security Rules should be configured properly
- Don't expose service account keys in client-side code

