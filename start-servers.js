const { spawn } = require('child_process');
const path = require('path');

// Função para iniciar o servidor Express
function startExpressServer() {
    const expressServer = spawn('node', ['express-server.js'], {
        stdio: 'inherit'
    });

    expressServer.on('error', (err) => {
        console.error('Erro ao iniciar o servidor Express:', err);
    });
}

// Função para iniciar o servidor NestJS
function startNestServer() {
    const nestServer = spawn('npx', ['ts-node', 'apps/api/src/main.ts'], {
        stdio: 'inherit'
    });

    nestServer.on('error', (err) => {
        console.error('Erro ao iniciar o servidor NestJS:', err);
    });
}

// Inicia ambos os servidores
console.log('Iniciando servidores...');
startExpressServer();
startNestServer(); 