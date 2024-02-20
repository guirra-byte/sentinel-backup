import { parentPort } from 'node:worker_threads'
import { filesFromPaths } from 'files-from-path'
import { GLOBAL_STORAGE_CLIENT } from './sentinel-provision-storage.worker.mjs'

parentPort.on('message', async (msg) => {
  const jsonMsg = JSON.parse(msg)
  const files = await filesFromPaths(jsonMsg.filePath)
  await GLOBAL_STORAGE_CLIENT.uploadDirectory(files)
})