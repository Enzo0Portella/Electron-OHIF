# Integrando o Servidor OHIF em uma Aplicação Electron

Este guia explica como integrar o servidor DICOMweb do OHIF em uma aplicação Electron personalizada.

## Pré-requisitos

- Node.js (versão LTS recomendada)
- npm ou yarn
- Conhecimento básico de Electron e Express

## Estrutura do Projeto

```
sua-aplicacao-electron/
├── src/
│   ├── main/
│   │   └── server.js        # Servidor Express do OHIF
│   ├── renderer/
│   │   └── index.html       # Interface do Electron
│   └── index.js             # Ponto de entrada do Electron
├── package.json
└── static-wado.json5        # Configuração do servidor OHIF
```

## Instalação

1. Primeiro, instale as dependências necessárias:

```bash
npm install @radicalimaging/static-wado-webserver express electron
```

2. Crie um arquivo `static-wado.json5` na raiz do projeto:

```json5
{
  staticWadoConfig: {
    rootDir: './dicomweb',  // Diretório onde os arquivos DICOM serão armazenados
  },
  dicomWebServerConfig: {
    clientDir: './ohif',    // Diretório onde os arquivos do cliente OHIF estão
    port: 5000,             // Porta que o servidor irá utilizar
  }
}
```

## Implementação

### 1. Servidor Express (src/main/server.js)

```javascript
const express = require('express');
const { DicomWebServer } = require('@radicalimaging/static-wado-webserver');

class OHIFServer {
  constructor() {
    this.app = null;
    this.server = null;
  }

  async initialize() {
    this.app = express();
    
    // Inicializa o servidor OHIF
    const dicomWebServer = new DicomWebServer();
    await dicomWebServer.initialize();

    // Aplica as rotas do OHIF ao seu servidor Express
    this.app.use('/', dicomWebServer.app);

    return this;
  }

  start(port = 5000) {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`Servidor OHIF rodando na porta ${port}`);
        resolve();
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

module.exports = OHIFServer;
```

### 2. Aplicação Electron (src/index.js)

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const OHIFServer = require('./main/server');

let mainWindow;
let ohifServer;

async function createWindow() {
  // Inicializa o servidor OHIF
  ohifServer = new OHIFServer();
  await ohifServer.initialize();
  await ohifServer.start(5000);

  // Cria a janela do Electron
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Carrega o visualizador OHIF
  mainWindow.loadURL('http://localhost:5000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  // Para o servidor quando a aplicação for fechada
  if (ohifServer) {
    ohifServer.stop();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
```

## Configuração do package.json

Adicione os seguintes scripts ao seu `package.json`:

```json
{
  "scripts": {
    "start": "electron .",
    "dev": "electron . --debug"
  }
}
```

## Executando a Aplicação

1. Certifique-se de que todos os arquivos necessários estão nos diretórios corretos:
   - Arquivos DICOM no diretório `dicomweb`
   - Arquivos do cliente OHIF no diretório `ohif`

2. Execute a aplicação:
```bash
npm start
```

## Considerações Importantes

1. **Segurança**: 
   - O servidor está configurado para rodar localmente
   - Considere adicionar autenticação se necessário
   - Implemente medidas de segurança adequadas para dados sensíveis

2. **Configuração**:
   - Ajuste as configurações no `static-wado.json5` conforme necessário
   - Você pode modificar as portas e diretórios conforme sua necessidade

3. **Desenvolvimento**:
   - Use o modo de desenvolvimento para depuração
   - Considere implementar hot-reload para desenvolvimento mais ágil

## Solução de Problemas

1. Se o servidor não iniciar:
   - Verifique se a porta 5000 está disponível
   - Confirme se todos os diretórios existem
   - Verifique os logs do servidor

2. Se os arquivos DICOM não aparecerem:
   - Confirme se o diretório `dicomweb` está configurado corretamente
   - Verifique se os arquivos têm as permissões corretas

3. Se a interface não carregar:
   - Verifique se o servidor está rodando corretamente
   - Confirme se o caminho para os arquivos do cliente está correto 