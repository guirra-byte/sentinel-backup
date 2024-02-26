import { parentPort } from 'node:worker_threads'
import { filesFromPaths } from 'files-from-path'
import { Web3StorageProvision } from './sentinel-provision-storage.worker.mjs'
import { R2StorageProvision } from '../observers/storage-provision.observer.mjs'

parentPort.on('message', async (msg) => {
  const jsonMsg = JSON.parse(msg)

  async function* videosGenerator() {
    let videos = []
    const padsLength = Number(process.env.AGGREGATED_VIDEOSS)
    for (let pad = 0; pad < jsonMsg.length; pad++) {
      videos.push(jsonMsg[pad].filePath)
      if (videos.length === (padsLength - 1)) {
        yield videos;
        videos = []
      }
    }
  }

  for await (const videos of videosGenerator) {
    const filesLike = await filesFromPaths(videos)

    if (process.env.WEB3_STORAGE_PROVISION_STATUS &&
      !process.env.R2_STORAGE_PROVISION_STATUS) {
      await Web3StorageProvision.uploadDirectory(filesLike)
    } else {
      async function* r2DemandUpload() {
        const replys = []
        for (const video of videos) {
          const videoDestination = R2StorageProvision.getPublicUrl

          if (videoDestination) {
            const uploadResponse = await R2StorageProvision
              .uploadFile(video)
              
            if (uploadResponse) {
              replys.push({
                key: uploadResponse.objectKey,
                url: uploadResponse.publicUrl
              })

              if (video === videosGenerator[videosGenerator.length - 1]) {
                yield replys;
              }
            }
          }
        }
      }

      for await (demandReply of r2DemandUpload) {
        parentPort.postMessage(JSON.stringify(demandReply))
      }
    }
  }
})