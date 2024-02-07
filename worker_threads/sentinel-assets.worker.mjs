import { parentPort } from 'node:worker_threads'

parentPort.on('message', (msg) => {
  console.log('Hello World')
})