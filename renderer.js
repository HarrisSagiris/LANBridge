const { ipcRenderer } = require('electron');

function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function startServer() {
    document.getElementById('server-status').innerHTML = 'Starting server...';
    ipcRenderer.send('start-server');
}

function connectToServer() {
    const ipAddress = document.getElementById('ip-address').value;
    const connectionCode = document.getElementById('connection-code-input').value;
    
    if (!ipAddress || !connectionCode) {
        document.getElementById('client-status').innerHTML = 'Please fill in all fields';
        document.getElementById('client-status').className = 'status error';
        return;
    }

    document.getElementById('client-status').innerHTML = 'Connecting...';
    ipcRenderer.send('connect-client', { ipAddress, connectionCode });
}

// IPC listeners
ipcRenderer.on('server-started', (event, connectionCode) => {
    document.getElementById('connection-code').innerHTML = connectionCode;
    document.getElementById('server-status').innerHTML = 'Server running';
    document.getElementById('server-status').className = 'status success';
});

ipcRenderer.on('client-connected', () => {
    document.getElementById('client-status').innerHTML = 'Connected successfully';
    document.getElementById('client-status').className = 'status success';
});

ipcRenderer.on('error', (event, message) => {
    const serverStatus = document.getElementById('server-status');
    const clientStatus = document.getElementById('client-status');
    
    serverStatus.innerHTML = message;
    clientStatus.innerHTML = message;
    serverStatus.className = 'status error';
    clientStatus.className = 'status error';
});
