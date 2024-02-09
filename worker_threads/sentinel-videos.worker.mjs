import { parentPort } from 'node:worker_threads'
import * as fs from 'node:fs'

parentPort.on('message', (msg) => {
  const jsonMsg = JSON.parse(msg)

  const readStream = fs.createReadStream(jsonMsg.filepath)
})