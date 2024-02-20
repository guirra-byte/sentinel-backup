import * as HttpServer from 'node:http'
import { Worker } from 'node:worker_threads'
import { readonlyStorageProvider, bookProvidedStorage } from './observers/storage-provision.observer.mjs'
import formidable, { errors as formidableErr } from 'formidable'
import * as dotenv from 'dotenv'

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
      })

      const mimetypeWaybillWorker =
        new Worker('./worker_threads/sentinel-mimetype-waybill.worker.mjs')

      try {
        const [, files] = await formParser.parse(request)

        if (files) {
          const [incommingFiles] = Object.entries(files)
          mimetypeWaybillWorker
            .postMessage(JSON.stringify(incommingFiles))

          mimetypeWaybillWorker
            .on('message', () => {
              response.end()
            })
        } else {
          response.end()
        }
      } catch (err) {
        response.writeHead(500, err)
        response.end()
      }
    }
  } if (request.method === 'GET') { }
}).listen(defaultPort,
  async () => {
    readonlyStorageProvider.subscribe(bookProvidedStorage)
    console.log(`Server is running on port: ${defaultPort}`)
  })
