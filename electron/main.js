const {
    app,
    BrowserWindow
} = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        // Use the PWA icon
        icon: path.join(__dirname, '../public/icon-512x512.png')
    });

    // ⚠️ CRITICAL: Replace with your actual Vercel Production URL
    const PRODUCTION_URL = 'https://furniture-ops.vercel.app';

    win.loadURL(PRODUCTION_URL);

    // Remove menu bar for "App-like" feel
    win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});