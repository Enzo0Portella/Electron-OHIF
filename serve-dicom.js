const { DicomWebServer } = require('@radicalimaging/static-wado-webserver');
const path = require('path');

const config = {
  staticWadoConfig: {
    rootDir: path.join(__dirname, 'dicom-image-example', 'series-000001')
  },
  dicomWebServerConfig: {
    port: 5000
  }
};

const server = new DicomWebServer(config);
server.start().then(() => {
  console.log('Servidor DICOMweb rodando em http://localhost:5000');
}); 