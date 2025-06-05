# Configuração do OHIF Viewer com Servidor DICOMweb Local

Este documento explica como configuramos o OHIF Viewer para visualizar imagens DICOM locais usando o servidor static-wado.

## Visão Geral

Para visualizar imagens DICOM locais no OHIF Viewer, precisamos de dois componentes principais:

1. Um servidor DICOMweb (static-wado-webserver) rodando na porta 5000
2. O OHIF Viewer rodando na porta 3000

## Estrutura do Projeto

```
Electron-OHIF/
├── dicom-image-example/
│   └── series-000001/        # Pasta contendo as imagens DICOM
├── packages/
│   ├── static-wado-creator/  # Ferramenta para converter DICOM para formato DICOMweb
│   └── static-wado-webserver/ # Servidor DICOMweb
└── apps/
    └── ohif-viewer/         # Aplicação OHIF
```

## Detalhamento dos Componentes Principais

### 1. Arquivo de Configuração `static-wado.json5`

Este arquivo é a configuração central para o servidor DICOMweb e o conversor de imagens:

```json5
{
  // Configuração para o static-wado
  staticWadoConfig: {
    rootDir: '/c:/Users/enzo.zorzin/CT/Electron-OHIF/dicom-image-example/series-000001'
  },
  // Configuração para o servidor DICOMweb
  dicomWebServerConfig: {
    studyQuery: "studyQueryReadIndex",
    port: 5000
  }
}
```

- **staticWadoConfig**: 
  - `rootDir`: Define o diretório raiz onde as imagens DICOM estão armazenadas
  - Este caminho é usado tanto pelo conversor quanto pelo servidor

- **dicomWebServerConfig**:
  - `studyQuery`: Define o método de consulta para estudos (neste caso usando um índice de leitura)
  - `port`: Define a porta onde o servidor DICOMweb irá rodar (5000)

### 2. Script Conversor `mkdicomweb.js`

Localizado em `packages/static-wado-creator/bin/mkdicomweb.js`, este script é responsável por converter as imagens DICOM para o formato DICOMweb:

```javascript
#!/usr/bin/env node

const { mkdicomwebConfig } = require("../lib");
const { configureProgram } = require("../lib/program");

// Configure program commander
configureProgram(mkdicomwebConfig).then(() => {
  console.verbose("done");
});
```

Este script:
- É um executável Node.js que pode ser rodado diretamente do terminal
- Utiliza o módulo `mkdicomwebConfig` para definir as configurações de conversão
- Usa o `configureProgram` para processar argumentos da linha de comando
- Converte imagens DICOM para um formato otimizado para servir via DICOMweb
- Cria índices e estruturas de dados necessárias para consultas eficientes

### 3. Servidor DICOMweb `dicomwebserver.mjs`

Localizado em `packages/static-wado-webserver/bin/dicomwebserver.mjs`, este script inicia o servidor DICOMweb:

```javascript
#!/usr/bin/env node

import { dicomWebServerConfig } from "../lib/index.mjs";
import "@radicalimaging/static-wado-plugins";
import configureProgram from "../lib/program/index.mjs";

// Configure program commander
configureProgram(dicomWebServerConfig).then((program) => {
  program.main();
});
```

Este script:
- É um módulo ES (usando a extensão .mjs)
- Importa plugins adicionais do pacote `@radicalimaging/static-wado-plugins`
- Configura e inicia o servidor DICOMweb
- Implementa os endpoints necessários do protocolo DICOMweb:
  - WADO-RS: Para recuperar imagens e metadados
  - QIDO-RS: Para consultar estudos e séries
  - STOW-RS: Para armazenar novas imagens (se configurado)

O servidor:
- Lê a configuração do arquivo `static-wado.json5`
- Serve as imagens convertidas através do protocolo DICOMweb
- Fornece uma API RESTful compatível com o padrão DICOM
- Otimiza a entrega de imagens para visualização web

## Configuração do OHIF Viewer

### 1. Arquivo de Configuração

Criamos o arquivo `app-config.js` no diretório `apps/ohif-viewer/platform/app/dist/` com a seguinte configuração:

```javascript
window.config = {
  routerBasename: '/',
  showStudyList: true,
  extensions: [],
  modes: [],
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'Local DICOMweb Server',
        name: 'local',
        wadoUriRoot: 'http://localhost:5000/dicomweb',
        qidoRoot: 'http://localhost:5000/dicomweb',
        wadoRoot: 'http://localhost:5000/dicomweb',
        qidoSupportsIncludeField: false,
        supportsReject: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: false,
        staticWado: true,
        singlepart: 'bulkdata,video',
      },
    },
  ],
  defaultDataSourceName: 'dicomweb',
};
```

Esta configuração:
- Define o servidor DICOMweb local como fonte de dados padrão
- Configura as URLs para acessar o servidor na porta 5000
- Define parâmetros de renderização e comportamento do viewer

### 2. Servidor Express

Criamos um servidor Express simples (`express-server.js`) para servir o OHIF Viewer:

```javascript
const express = require('express');
const path = require('path');

const app = express();

// Configuração do Express para servir os arquivos do OHIF
app.use(express.static(path.join(__dirname, 'apps/ohif-viewer/platform/app/dist')));

// Inicia o servidor na porta 3000
app.listen(3000, () => {
  console.log('Servidor OHIF rodando em http://localhost:3000');
});
```

O servidor Express:
- Serve os arquivos estáticos do OHIF Viewer
- Inclui o arquivo de configuração `app-config.js`
- Roda na porta 3000

## Como Usar

1. Inicie o servidor DICOMweb:
   ```bash
   cd packages/static-wado-webserver
   node bin/dicomwebserver.mjs
   ```

2. Em outro terminal, inicie o servidor OHIF:
   ```bash
   node express-server.js
   ```

3. Acesse o OHIF Viewer em `http://localhost:3000`

O OHIF Viewer carregará automaticamente a configuração do `app-config.js` e se conectará ao servidor DICOMweb local na porta 5000, permitindo a visualização das imagens DICOM locais.

## Notas Importantes

- O servidor DICOMweb deve estar rodando antes de acessar o OHIF Viewer
- As imagens DICOM devem estar no formato correto e no diretório esperado pelo servidor
- A configuração atual assume que as imagens estão no diretório `dicom-image-example/series-000001` 