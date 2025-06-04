const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const ini = require('ini');

const configPath = path.join(process.cwd(), 'config.ini');

// Function to load the config.ini file and populate the form fields
function loadConfig() {
  if (fs.existsSync(configPath)) {
    const config = ini.parse(fs.readFileSync(configPath, 'utf-8'));
    document.getElementById('defaultLanguage').value = config.DEFAULT_LANGUAGE || '';
    document.getElementById('inputFilesDir').value = config.INPUT_FILES_DIR || '';
    document.getElementById('outputFilesDir').value = config.OUTPUT_FILES_DIR || '';
    document.getElementById('wadoServerPort').value = config.WADO_SERVER_PORT || '';
    document.getElementById('apiPort').value = config.API_PORT || '';
    document.getElementById('viewerUrl').value = config.OHIF_VIEWER_URL || '';
  }
}

// Load the configuration from config.ini when the page is loaded
window.addEventListener('DOMContentLoaded', loadConfig);

document.getElementById('configForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const newConfig = {
    DEFAULT_LANGUAGE: document.getElementById('defaultLanguage').value,
    INPUT_FILES_DIR: document.getElementById('inputFilesDir').value,
    OUTPUT_FILES_DIR: document.getElementById('outputFilesDir').value,
    WADO_SERVER_PORT: document.getElementById('wadoServerPort').value,
    API_PORT: document.getElementById('apiPort').value,
    OHIF_VIEWER_URL: document.getElementById('viewerUrl').value,
  };
  ipcRenderer.send('update-env-config', newConfig);
});