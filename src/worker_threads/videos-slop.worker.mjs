import { parentPort } from 'node:worker_threads'
import { filesFromPaths } from 'files-from-path'
import { Web3StorageProvision } from './sentinel-provision-storage.worker.mjs'
import { R2StorageProvision } from '../observers/storage-provision.observer.mjs'

parentPort.on('message', async (videos_baggage) => {
  const filesLike = await filesFromPaths(JSON
    .parse(videos_baggage))

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
})