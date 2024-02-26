import { parentPort } from 'node:worker_threads'
import { copyFile } from 'node:fs'
import { zipTmpDir, unzipOutdir } from '../../path.config.mjs'
import zipping from 'yauzl-promise'

parentPort.on('message', async (stringify_zip) => {
  const zip = JSON.parse(stringify_zip)
  const [, [zipObj]] = zip.incommingZip

  const destination = `${zipTmpDir}/${zipObj.originalFilename}`
  copyFile(zipObj.filepath, destination, async (_error) => {
    if (_error) throw _error

    const zip = await zipping.open(destination)
    try {
      for await (const entry of zip) {
        console.log(entry)
      }
    } catch (error) {
      throw error
    }
  })
})


