# Native App Deployment Guide

This guide explains how to package FurnitureOps as a native Android app (via Capacitor) and a Windows Desktop app (via Electron).

> [!IMPORTANT]
> Since FurnitureOps uses Next.js Server Components and API Routes, these native wrappers **MUST** point to your live Vercel deployment URL. They cannot run offline-only.

## Part A: Android (Capacitor)

### 1. Install Dependencies

```bash
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/android
```

### 2. Initialize Capacitor

```bash
npx cap init FurnitureOps com.furnitureops.app
```

_Note: We have already provided a custom `capacitor.config.ts`. Ensure it exists._

### 3. Configure Production URL

Open `capacitor.config.ts` and update the `server.url` field:

```typescript
server: {
  url: 'https://your-project.vercel.app', // <--- REPLACE THIS
}
```

### 4. Generate Android Project

```bash
# Sync config to native platform
npx cap add android
npx cap sync
```

### 5. Build APK

1.  Run `npx cap open android` (Requires Android Studio).
2.  In Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3.  The APK will be generated in `android/app/build/outputs/apk/debug/`.

---

## Part B: Windows Desktop (Electron)

### 1. Install Dependencies

```bash
npm install --save-dev electron electron-builder
```

### 2. Configure Scripts

Add these scripts to your `package.json`:

```json
"scripts": {
  "electron:start": "electron electron/main.js",
  "electron:pack": "electron-builder --dir",
  "electron:dist": "electron-builder"
}
```

### 3. Configure Production URL

Open `electron/main.js` and update the `PRODUCTION_URL` variable:

```javascript
const PRODUCTION_URL = "https://your-project.vercel.app"; // <--- REPLACE THIS
```

### 4. Build Windows Exe

1.  **Test Locally**:
    ```bash
    npm run electron:start
    ```
2.  **Package for Distribution**:
    ```bash
    npm run electron:dist
    ```
    This will create a `dist/` folder containing the `.exe` installer.

---

## Troubleshooting

### "White Screen" on Android

- **Cause**: The device cannot reach the Vercel URL or SSL issues.
- **Fix**: Ensure `capacitor.config.ts` has `server.cleartext: true` (for debugging) or that your Vercel URL is publicly accessible.

### "API Connection Failed"

- **Cause**: CORS or Session Cookies.
- **Fix**: Since we wrap the real URL, cookies usually work out of the box. Ensure `middleware.ts` CSP allows the `https:` scheme.
