const { app, BrowserWindow, nativeTheme } = require('electron');
const Firebird = required('node-firebird');
const express = require('express');

const app = express();
const port = 3000;

const options= {
    
}
const createWindow = () => {
    nativeTheme.themeSource = 'light'
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        icon: './src/public/img/LogoApp.png',
        //resizable: false,
        //autoHideMenuBar: true,
        //titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }

    });
    win.loadFile('./src/views/index.html')
    
}

app.whenReady().then(() => {
    createWindow()
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
});