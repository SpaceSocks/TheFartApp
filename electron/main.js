const { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;
let isQuitting = false;

// Get the icon path
const getIconPath = () => {
  const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  if (app.isPackaged) {
    return path.join(process.resourcesPath, iconName);
  }
  return path.join(__dirname, '..', 'public', iconName);
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 800,
    minWidth: 380,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'default',
    backgroundColor: '#f5f3ff',
    show: false,
  });

  // Load the app
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle close to tray
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();

      // Show notification on first minimize
      if (tray) {
        new Notification({
          title: 'The Fart App',
          body: 'App minimized to tray. Your alarms and random farts will keep working!',
          icon: getIconPath(),
        }).show();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Create a simple colored icon for the tray
  const icon = nativeImage.createEmpty();

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open The Fart App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quick Fart!',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('quick-fart');
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('The Fart App');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// Handle notifications from renderer
ipcMain.handle('show-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({
      title,
      body,
      icon: getIconPath(),
    }).show();
  }
});

// Get sound files from a directory
ipcMain.handle('get-sound-files', (event) => {
  const soundsPath = app.isPackaged
    ? path.join(process.resourcesPath, 'sounds')
    : path.join(__dirname, '..', 'public', 'sounds');

  const soundTypes = {
    classic: { folder: 'Classic', prefix: 'classic' },
    squeaky: { folder: 'Squeeky', prefix: 'squeeky' },
    thunder: { folder: 'Thunder', prefix: 'thunder' },
    wet: { folder: 'Wet', prefix: 'wet' },
    long: { folder: 'Long', prefix: 'long' },
    rapidfire: { folder: 'RapidFire', prefix: 'rapidfire' },
  };

  const result = {};

  for (const [key, { folder, prefix }] of Object.entries(soundTypes)) {
    const folderPath = path.join(soundsPath, folder);
    try {
      if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath)
          .filter(file => file.endsWith('.mp3'))
          .sort()
          .map(file => `/sounds/${folder}/${file}`);
        result[key] = files;
      } else {
        result[key] = [];
      }
    } catch (err) {
      console.error(`Error reading ${folder}:`, err);
      result[key] = [];
    }
  }

  return result;
});

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else if (mainWindow) {
        mainWindow.show();
      }
    });
  });
}

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
