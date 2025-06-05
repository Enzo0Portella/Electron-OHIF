const express = require('express');
const path = require('path');

const app = express();

// Configuração do Express para servir os arquivos do OHIF
app.use(express.static(path.join(__dirname, 'apps/ohif-viewer/platform/app/dist')));

// Inicia o servidor na porta 3000
app.listen(3000, () => {
  console.log('Servidor OHIF rodando em http://localhost:3000');
}); 