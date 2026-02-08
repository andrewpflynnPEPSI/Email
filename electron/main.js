const { app, BrowserWindow, shell, Menu, ipcMain, Notification } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const DEV_PORT = 3456;

let mainWindow = null;
let nextServer = null;
let serverPort = DEV_PORT;

// Find a free port for production
function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

// Wait for the Next.js server to be ready
function waitForServer(port, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.on('timeout', () => {
        socket.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error('Server startup timeout'));
        } else {
          setTimeout(check, 200);
        }
      });
      socket.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error('Server startup timeout'));
        } else {
          setTimeout(check, 200);
        }
      });
      socket.connect(port, '127.0.0.1');
    };
    check();
  });
}

// Start Next.js production server (only used when packaged)
function startNextProductionServer(port) {
  const appPath = path.join(process.resourcesPath, 'app');
  const nextBin = path.join(appPath, 'node_modules', '.bin', 'next');

  nextServer = spawn(nextBin, ['start', '-p', String(port)], {
    cwd: appPath,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'production',
    },
    stdio: 'pipe',
  });

  nextServer.stdout.on('data', (data) => {
    console.log(`[Next.js] ${data.toString().trim()}`);
  });

  nextServer.stderr.on('data', (data) => {
    console.error(`[Next.js] ${data.toString().trim()}`);
  });

  nextServer.on('error', (err) => {
    console.error('Failed to start Next.js server:', err);
  });

  nextServer.on('close', (code) => {
    console.log(`Next.js server exited with code ${code}`);
    nextServer = null;
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 10 },
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundColor: '#09090b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: false,
    },
    show: false,
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Handle navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const serverUrl = `http://127.0.0.1:${serverPort}`;
    if (!url.startsWith(serverUrl)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function createAppMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'Cmd+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(
                'window.__ELECTRON_OPEN_SETTINGS && window.__ELECTRON_OPEN_SETTINGS()'
              );
            }
          },
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Email',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(
                'window.__ELECTRON_NEW_EMAIL && window.__ELECTRON_NEW_EMAIL()'
              );
            }
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          {
            label: 'Velocity',
            accelerator: 'Cmd+1',
            click: () => {
              if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
              }
            },
          },
          { type: 'separator' },
          { role: 'front' },
        ] : []),
        { role: 'close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(
                'window.__ELECTRON_SHOW_SHORTCUTS && window.__ELECTRON_SHOW_SHORTCUTS()'
              );
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
function setupIPC() {
  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('get-version', () => {
    return app.getVersion();
  });

  ipcMain.on('show-notification', (_, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });
}

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      setupIPC();
      createAppMenu();

      if (isDev) {
        // In dev mode, Next.js is already running via concurrently on DEV_PORT
        serverPort = DEV_PORT;
        console.log(`Connecting to Next.js dev server on port ${serverPort}...`);
        await waitForServer(serverPort, 60000);
      } else {
        // In production, start Next.js server
        serverPort = await findFreePort();
        console.log(`Starting Next.js production server on port ${serverPort}...`);
        startNextProductionServer(serverPort);
        await waitForServer(serverPort);
      }

      console.log('Next.js server is ready.');
      createWindow();
    } catch (err) {
      console.error('Failed to start app:', err);
      app.quit();
    }
  });

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    if (nextServer) {
      nextServer.kill('SIGTERM');
      nextServer = null;
    }
  });
}
