const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'api', {
        send: (channel, data) => {
            // whitelist channels
            const validChannels = ['start-server', 'connect-client'];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            } else {
                console.warn(`Invalid channel: ${channel}`);
            }
        },
        receive: (channel, func) => {
            const validChannels = ['server-started', 'client-connected', 'error'];
            if (validChannels.includes(channel)) {
                // Remove existing listeners to prevent duplicates
                ipcRenderer.removeAllListeners(channel);
                // Deliberately strip event as it includes `sender` 
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            } else {
                console.warn(`Invalid channel: ${channel}`);
            }
        },
        // Add cleanup method
        removeAllListeners: (channel) => {
            const validChannels = ['server-started', 'client-connected', 'error'];
            if (validChannels.includes(channel)) {
                ipcRenderer.removeAllListeners(channel);
            }
        }
    }
);
