import { parentPort, Worker } from 'node:worker_threads'

parentPort.on('messageerror',
  (err) => {
    throw err
  })

parentPort.on('message', (aggregated_files) => {
  const backupAssets = new Worker('./sentinel-videos.worker.mjs')
  const backupVideos = new Worker('./sentinel-assets.worker.mjs')

  let incommingData = {}
  for (const fileObj of aggregated_files) {
    const ctxMimetype = fileObj.mimetype
      .includes('video') ? 'videos' : 'assets'

    if (ctxMimetype) {
      if (incommingData[ctxMimetype]) {
        incommingData[ctxMimetype].push(fileObj)
      } else {
        incommingData[ctxMimetype] = [fileObj]
      }
    }
  }

  for (const [, label] of Objet.entries(incommingData)) {
    const ctxWorker = label === 'videos' ? backupVideos : backupAssets
    console.log(label)
    // ctxWorker.postMessage(JSON.stringify(incommingData[label]))
  }
})