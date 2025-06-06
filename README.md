# Electron-OHIF# Como Rodar o Aplicativo

Este guia explica os passos necessários para configurar e executar o aplicativo Electron que integra o OHIF Viewer com a API NestJS.

## Pré-requisitos

- Node.js (versão LTS recomendada)
- Yarn
- Git
- Windows 10 ou superior

## Passos para Execução

### 1. Configuração Inicial

1. **IMPORTANTE**: Execute o seu IDE como Administrador
   - Isso é necessário para criar links simbólicos durante o processo de build
   - Clique com o botão direito no ícone do Cursor
   - Selecione "Executar como administrador"

### 2. Configuração do OHIF Viewer

1. Clone o repositório do OHIF Viewer (somente se não estiver clonado):
   ```bash
   git clone https://github.com/OHIF/Viewers.git
   ```

2. Instale as dependências:
   ```bash
   cd Viewers
   yarn install
   ```

3. Execute o build do OHIF:
   ```bash
   yarn run build
   ```
   - Este processo pode levar alguns minutos
   - Aguarde até que todos os bundles sejam gerados

### 3. Configuração do Aplicativo Principal

1. Certifique-se de que todas as dependências do aplicativo principal estão instaladas:
   ```bash
   cd ..  # Volte para o diretório raiz
   yarn install
   ```

### 4. Executando o Aplicativo

1. Para iniciar o aplicativo:
   ```bash
   yarn start
   ```

## Portas Utilizadas

- **3000**: Servidor Express (arquivos estáticos do OHIF)
- **3001**: API NestJS

## Solução de Problemas

Se você encontrar algum dos seguintes problemas:

1. **Erro de permissão durante o build**:
   - Certifique-se de que está executando o IDE como administrador

2. **Aplicativo inicia e fecha imediatamente**:
   - Verifique se o build do OHIF foi concluído com sucesso
   - Confirme se o diretório `dist` foi gerado dentro da pasta Viewers
   - Verifique os logs de erro no console

3. **Erro de portas em uso**:
   - Certifique-se de que as portas 3000 e 3001 não estão sendo utilizadas por outros processos

## Observações Importantes

- Sempre execute o IDE como administrador ao trabalhar com este projeto
- Aguarde o build completo do OHIF antes de tentar executar o aplicativo
- Mantenha todas as dependências atualizadas usando `yarn install`

## Conversão de Arquivos DICOM

Para converter arquivos DICOM e utilizá-los no visualizador, siga os passos abaixo:

1. Navegue até o diretório do static-wado-creator:
   ```bash
   cd packages/static-wado-creator
   ```

2. Execute o comando de conversão:
   ```bash
   node bin/mkdicomweb.js create <CAMINHO-DOS-ARQUIVOS-DICOM>
   ```
   
   Exemplo:
   ```bash
   node bin/mkdicomweb.js create ../../dicom-image-example/series-000001
   ```

### Observações sobre a Conversão

- Os arquivos convertidos serão salvos por padrão em `~/dicomweb/`
- Certifique-se de que o caminho para os arquivos DICOM está correto
- O comando não suporta glob patterns, então especifique o caminho completo do diretório
- Para gerar miniaturas (thumbnails), você precisa ter instalado:
  - dcm2jpg do dcm4che (para imagens)
  - ffmpeg (para vídeos) 