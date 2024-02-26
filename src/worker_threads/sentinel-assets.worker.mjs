import { parentPort } from 'node:worker_threads'

//Utilizar Replicate para recurso de Transcrição de Vídeo: https://replicate.com/docs/webhooks;
//Implementar meu próprio Webhook com Pub/Sub -> Monitoramento High Level;
//Armazenar os Dados: https://web3.storage/;
//Cloudfare R2;

parentPort.on('message', (msg) => {
  console.log('Hello World')
})