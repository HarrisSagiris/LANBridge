const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
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
                            width: 300,
                            height: 200,
                            parent: mainWindow,
                            modal: true,
                            show: false
                        });
                        aboutWindow.loadFile('about.html');
                        aboutWindow.once('ready-to-show', () => {
                            aboutWindow.show();
                        });
                    }
                }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
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
        const server = new BridgeServer();
        const connectionCode = await server.StartServer();
        mainWindow.webContents.send('server-started', connectionCode);
        
        // Show notification
        new Notification({
            title: 'Server Started',
            body: `Connection code: ${connectionCode}`
        }).show();
        
    } catch (error) {
        mainWindow.webContents.send('error', error.message);
    }
});

ipcMain.on('connect-client', async (event, { ipAddress, connectionCode }) => {
    try {
        const client = new BridgeClient();
        await client.ConnectToServer(ipAddress, connectionCode);
        mainWindow.webContents.send('client-connected');
        
        // Show notification
        new Notification({
            title: 'Connected',
            body: 'Successfully connected to server'
        }).show();
        
    } catch (error) {
        mainWindow.webContents.send('error', error.message);
        
        // Show error notification
        new Notification({
            title: 'Connection Error',
            body: error.message
        }).show();
    }
});
