import { parentPort } from 'node:worker_threads'

//Utilizar Replicate para recurso de Transcrição de Vídeo: https://replicate.com/docs/webhooks;
//Implementar meu próprio Webhook com Pub/Sub -> Monitoramento High Level;
//Armazenar os Dados: https://web3.storage/;
//AWS (LocalStack): SQS --> S3 - SES;

parentPort.on('message', (msg) => {
  console.log('Hello World')
})