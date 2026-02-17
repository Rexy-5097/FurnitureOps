import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.furnitureops.app',
  appName: 'FurnitureOps',
  webDir: 'public', // Placeholder directory required by Capacitor
  server: {
    // ⚠️ CRITICAL: Replace with your actual Vercel Production URL
    url: 'https://furniture-ops.vercel.app', 
    cleartext: true
  },
  android: {
    // Android specific config if needed
  }
};

export default config;
