const { app, BrowserWindow, ipcMain } = require('electron');
const express = require('express');
const path = require('path');

// Servidor Express para o OHIF
const ohifApp = express();
ohifApp.use(express.static(path.join(__dirname, 'apps/ohif-viewer/platform/app/dist')));
ohifApp.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'apps/ohif-viewer/platform/app/dist', 'index.html'));
});

// Servidor Express para o React
const reactApp = express();
reactApp.use(express.static(path.join(__dirname, 'react-app/build')));
reactApp.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'react-app/build', 'index.html'));
});

let mainWindow;
let ohifServer;
let reactServer;

// Inicia os servidores
async function startServers() {
  await new Promise(resolve => {
    ohifServer = ohifApp.listen(3000, resolve);
  });
  await new Promise(resolve => {
    reactServer = reactApp.listen(3001, resolve);
  });
}

app.on('ready', async () => {
  await startServers();

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Inicialmente carrega o React
  mainWindow.loadURL('http://localhost:3001');

  // IPC para alternar entre React e OHIF
  ipcMain.on('abrir-ohif', (event, dadosPaciente) => {
    mainWindow.loadURL('http://localhost:3000');
    // Quando o OHIF carregar, envia os dados do paciente
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('dados-paciente', dadosPaciente);
    });
  });

  // Voltar para o React
  ipcMain.on('voltar-react', () => {
    mainWindow.loadURL('http://localhost:3001');
  });
}); 