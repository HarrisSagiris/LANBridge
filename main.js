const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const edge = require('edge-js');

// Initialize edge.js functions
const bridgeServer = edge.func({
    assemblyFile: path.join(__dirname, 'lanbridge.dll'),
    typeName: 'LanBridge.BridgeServer',
    methodName: 'StartServer'
});

const bridgeClient = edge.func({
    assemblyFile: path.join(__dirname, 'lanbridge.dll'), 
    typeName: 'LanBridge.BridgeClient',
    methodName: 'ConnectToServer'
});

let mainWindow;
let server = null;
let client = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        title: 'LAN Bridge',
        icon: path.join(__dirname, 'assets/icon.png'),
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#ffffff'
    });

    mainWindow.loadFile('index.html');

    // Add menu
    const { Menu } = require('electron');
    const template = [
        {
            label: 'File',
            submenu: [
                { role: 'quit' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        const aboutWindow = new BrowserWindow({
                            width: 400,
                            height: 300,
                            parent: mainWindow,
                            modal: true,
                            show: false,
                            webPreferences: {
                                contextIsolation: true
                            }
                        });
                        aboutWindow.loadFile('about.html');
                        aboutWindow.once('ready-to-show', () => {
                            aboutWindow.show();
                        });
                    }
                },
                {
                    label: 'Documentation',
                    click: async () => {
                        await require('electron').shell.openExternal('https://github.com/lan-bridge/docs');
                    }
                }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // Handle window close
    mainWindow.on('closed', () => {
        if (server) {
            server.stop();
            server = null;
        }
        if (client) {
            client.disconnect();
            client = null;
        }
    });
}

// Handle app lifecycle
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC handlers for communication with renderer process
ipcMain.on('start-server', async () => {
    try {
        if (server) {
            throw new Error('Server is already running');
        }

        const result = await bridgeServer();
        server = result.server;
        const connectionCode = result.connectionCode;

        mainWindow.webContents.send('server-started', connectionCode);
        
        new Notification({
            title: 'Server Started',
            body: `Connection code: ${connectionCode}`,
            icon: path.join(__dirname, 'assets/icon.png')
        }).show();
        
    } catch (error) {
        mainWindow.webContents.send('error', error.message);
        new Notification({
            title: 'Server Error',
            body: error.message,
            icon: path.join(__dirname, 'assets/icon.png')
        }).show();
    }
});

ipcMain.on('connect-client', async (event, { ipAddress, connectionCode }) => {
    try {
        if (client) {
            throw new Error('Already connected to a server');
        }

        if (!ipAddress || !connectionCode) {
            throw new Error('IP address and connection code are required');
        }

        const result = await bridgeClient({ ipAddress, connectionCode });
        client = result.client;

        mainWindow.webContents.send('client-connected');
        
        new Notification({
            title: 'Connected',
            body: 'Successfully connected to server',
            icon: path.join(__dirname, 'assets/icon.png')
        }).show();
        
    } catch (error) {
        mainWindow.webContents.send('error', error.message);
        new Notification({
            title: 'Connection Error',
            body: error.message,
            icon: path.join(__dirname, 'assets/icon.png')
        }).show();
    }
});

// Handle disconnection
ipcMain.on('disconnect', () => {
    if (client) {
        client.disconnect();
        client = null;
        mainWindow.webContents.send('client-disconnected');
    }
    if (server) {
        server.stop();
        server = null;
        mainWindow.webContents.send('server-stopped');
    }
});
