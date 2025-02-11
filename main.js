const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
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

// IPC handlers for communication with renderer process
ipcMain.on('start-server', async () => {
    try {
        const server = new BridgeServer();
        await server.StartServer();
        mainWindow.webContents.send('server-started');
    } catch (error) {
        mainWindow.webContents.send('error', error.message);
    }
});

ipcMain.on('connect-client', async (event, { ipAddress, connectionCode }) => {
    try {
        const client = new BridgeClient();
        await client.ConnectToServer(ipAddress, connectionCode);
        mainWindow.webContents.send('client-connected');
    } catch (error) {
        mainWindow.webContents.send('error', error.message);
    }
});
