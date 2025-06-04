const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./apps/api/dist/app.module');
const express = require('express');
const fs = require('fs');
const ini = require('ini');
const notifier = require('node-notifier');

const appExpress = express();

let mainWindow;
let configWindow;
let nestAppInstance = null; // NestJS server instance
let expressServer = null;  // Express server instance

// Path to the config.ini file
const configPath = path.join(process.cwd(), 'config.ini');

// Function to load the configuration
function loadConfig() {
  if (fs.existsSync(configPath)) {
    const config = ini.parse(fs.readFileSync(configPath, 'utf-8'));
    return config;
  }
  return {};
}

// Function to save the configuration
function saveConfig(newConfig) {
  const configString = ini.stringify(newConfig);
  fs.writeFileSync(configPath, configString);
}

// Load the configuration when the application starts
let config = loadConfig();
let apiPort = config.API_PORT || '5000';
let ohifViewerUrl = config.OHIF_VIEWER_URL || 'http://localhost:3000';

// Express server configuration
appExpress.use(express.static(path.join(__dirname, 'apps/ohif-viewer/platform/app/dist')));
appExpress.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'apps/ohif-viewer/platform/app/dist', 'index.html'));
});

// Function to start the Express server
function startExpressServer() {
  return new Promise((resolve) => {
    expressServer = appExpress.listen(3000, () => {
      resolve();
    });
  });
}

// Function to start the NestJS server
async function startNestServer() {
  nestAppInstance = await NestFactory.create(AppModule);
  nestAppInstance.enableCors({
    origin: '*',
  });
  await nestAppInstance.listen(apiPort);
}

// Function to stop the Express server
function stopExpressServer() {
  if (expressServer) {
    expressServer.close(() => {});
    expressServer = null;
  }
}

// Function to stop the NestJS server
async function stopNestServer() {
  if (nestAppInstance) {
    await nestAppInstance.close();
    nestAppInstance = null;
  }
}

// Function to update the config.ini
function updateConfig(newConfig) {
  const currentConfig = loadConfig();
  const updatedConfig = { ...currentConfig, ...newConfig };
  saveConfig(updatedConfig);
}

// Function to reload environment variables
function reloadConfig() {
  config = loadConfig();
  apiPort = config.API_PORT || '5000';
  ohifViewerUrl = config.OHIF_VIEWER_URL || 'http://localhost:3000';
}

// Function to create the configuration window
function createConfigWindow() {
  configWindow = new BrowserWindow({
    width: 768,
    height: 620,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  configWindow.setMenu(null);

  configWindow.loadFile('config.html'); // Create an HTML file for the configuration interface
}

// Exemplo de comunicação Electron -> OHIF
ipcMain.handle('carregar-imagem', async (event, caminhoImagem) => {
  // Aqui você pode processar a imagem DICOM
  const resultado = await processarImagemDICOM(caminhoImagem);
  
  // Envia o resultado para o OHIF
  mainWindow.webContents.send('imagem-carregada', resultado);
});

// Exemplo de menu para abrir imagens
const menuTemplate = [
  {
    label: 'Arquivo',
    submenu: [
      {
        label: 'Abrir DICOM',
        click: async () => {
          const result = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [{ name: 'DICOM', extensions: ['dcm'] }]
          });
          
          if (!result.canceled) {
            mainWindow.webContents.send('abrir-dicom', result.filePaths);
          }
        }
      }
    ]
  },
  {
    label: 'Settings',
    submenu: [
      {
        label: 'Change settings',
        click: () => {
          createConfigWindow();
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);

// Prevent multiple instances of the application
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Stop servers of the previous instance
  stopExpressServer();
  stopNestServer();
  app.quit();
} else {
  app.on('second-instance', async () => {
    // Stop servers of the previous instance
    await stopExpressServer();
    await stopNestServer();

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('ready', async () => {
    // Start the servers
    await startExpressServer();
    await startNestServer();

    // Create the main window
    mainWindow = new BrowserWindow({
      width: 1024,
      height: 768,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    // Load the front-end URL
    mainWindow.loadURL(ohifViewerUrl);
  });

  app.on('window-all-closed', async () => {
    if (process.platform !== 'darwin') {
      // Stop servers when the window is closed
      await stopExpressServer();
      await stopNestServer();
      app.quit();
    }
  });

  app.on('before-quit', async () => {
    // Ensure servers are stopped when exiting
    await stopExpressServer();
    await stopNestServer();
  });
}

// Listener to update the config.ini
ipcMain.on('update-env-config', async (event, newConfig) => {
  updateConfig(newConfig);
  reloadConfig();
  notifier.notify({
    title: 'Settings',
    message: 'Settings updated. The application will close to apply the new settings.',
  });

  if (configWindow) {
    configWindow.close();
    mainWindow.close();
  }

  // Stop servers to apply new settings
  await stopExpressServer();
  await stopNestServer();

  // Quit the application
  app.quit();
});