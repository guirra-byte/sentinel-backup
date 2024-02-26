import * as HttpServer from 'node:http'
import { Worker } from 'node:worker_threads'
import { r2StorageBookProvision, readonlyStorageProvider, web3StorageBookProvision } from './observers/storage-provision.observer.mjs'
import formidable, { errors as formidableErr } from 'formidable'
import * as dotenv from 'dotenv'
import { workersPath } from '../path.config.mjs'

dotenv.config()
const defaultPort = 1102

HttpServer.createServer(async (request, response) => {
  const baseUrl = '/sentinel'

  if (request.method === 'POST') {
    if (request.url === `${baseUrl}/upload`) {
      response.writeHead(202)
      const formParser = formidable({
        maxFileSize: 200 * 1024 * 1024,
        multiples: true,
        maxFiles: 50
      })

      const mimetypeWaybillWorker =
        new Worker(`${workersPath}/sentinel-mimetype-waybill.worker.mjs`)

      try {
        const [, files] = await formParser.parse(request)

        if (files) {
          const [incommingFiles] = Object.entries(files)
          mimetypeWaybillWorker
            .postMessage(JSON.stringify(incommingFiles))

          mimetypeWaybillWorker
            .on('message', () => {
              
            })
        } else {
          response.end()
        }
      } catch (err) {
        response.writeHead(500, err)
        response.end()
      }
    }
  }
}).listen(defaultPort,
  async () => {
    try {
      readonlyStorageProvider.subscribe(web3StorageBookProvision)
      process.env.WEB3_STORAGE_PROVISION_STATUS = true
    } catch {
      process.env.WEB3_STORAGE_PROVISION_STATUS = false
      readonlyStorageProvider.subscribe(r2StorageBookProvision)
      process.env.R2_STORAGE_PROVISION_STATUS = true
    }

    console.log(`Server is running on port: ${defaultPort}`)
  })
