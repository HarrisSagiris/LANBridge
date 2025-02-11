const { ipcRenderer } = require('electron');

function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function startServer() {
    document.getElementById('server-status').innerHTML = 'Starting server...';
    document.getElementById('server-status').className = 'status loading visible';
    document.getElementById('start-server-btn').disabled = true;
    ipcRenderer.send('start-server');
}

function connectToServer() {
    const ipAddress = document.getElementById('ip-address').value;
    const connectionCode = document.getElementById('connection-code-input').value;
    
    if (!ipAddress || !connectionCode) {
        document.getElementById('client-status').innerHTML = 'Please fill in all fields';
        document.getElementById('client-status').className = 'status error visible';
        return;
    }

    document.getElementById('client-status').innerHTML = 'Connecting...';
    document.getElementById('client-status').className = 'status loading visible';
    document.getElementById('connect-btn').disabled = true;
    ipcRenderer.send('connect-client', { ipAddress, connectionCode });
}

// IPC listeners
ipcRenderer.on('server-started', (event, connectionCode) => {
    document.getElementById('connection-code').innerHTML = connectionCode;
    document.getElementById('server-status').innerHTML = 'Server running';
    document.getElementById('server-status').className = 'status success visible';
    document.getElementById('start-server-btn').disabled = false;
});

ipcRenderer.on('client-connected', () => {
    document.getElementById('client-status').innerHTML = 'Connected successfully';
    document.getElementById('client-status').className = 'status success visible';
    document.getElementById('connect-btn').disabled = false;
});

ipcRenderer.on('error', (event, message) => {
    const serverStatus = document.getElementById('server-status');
    const clientStatus = document.getElementById('client-status');
    
    if (serverStatus.classList.contains('visible')) {
        serverStatus.innerHTML = message;
        serverStatus.className = 'status error visible';
        document.getElementById('start-server-btn').disabled = false;
    }
    
    if (clientStatus.classList.contains('visible')) {
        clientStatus.innerHTML = message;
        clientStatus.className = 'status error visible';
        document.getElementById('connect-btn').disabled = false;
    }
});
