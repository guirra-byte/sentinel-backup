import * as HttpServer from 'node:http'
import { Worker } from 'node:worker_threads'
import formidable, { errors as formidableErr } from 'formidable'
import { EventEmitter } from 'node:events'
import * as fs from 'node:fs'

const defaultPort = 1102
//Processo de Autenticação;
//Acessar os arquivos e realizar o upload para o Bucket S3 utilizando Streams;
//Realizar o agendamento para processar a requisição;
HttpServer.createServer(async (request, response) => {
  const baseUrl = '/cloud'

  if (request.method === 'POST') {
    if (request.url.includes(baseUrl)) {
      const formParser = formidable({ maxFileSize: 200 * 1024 * 1024, multiples: true })

      const backupAssets = new Worker('./worker_threads/sentinel-assets.worker.mjs')
      const backupVideos = new Worker('./worker_threads/sentinel-videos.worker.mjs')

      let incommingData = {}
      const claimWorker = (mimetype) => {
        return mimetype === 'assets' ?
          backupAssets :
          backupVideos
      }

      try {
        const [, files] = await formParser.parse(request)
        if (files) {
          for (const [, formAssets] of Object.entries(files)) {
            for (const assetObj of formAssets) {
              const ctxMimetype = assetObj.mimetype
                .includes('video') ? 'videos' : 'assets'

              if (ctxMimetype) {
                if (incommingData[ctxMimetype]) {
                  incommingData[ctxMimetype].data.push(assetObj)
                } else {
                  incommingData[ctxMimetype] = [assetObj]
                }

                const actionWorker = claimWorker(ctxMimetype)
                actionWorker.postMessage(JSON.stringify(assetObj))
              }
            }
          }
        }
      } catch (err) {
        response.writeHead(500, err)
        return response.end()
      }
    }
  }
}).listen(defaultPort,
  () => console.log(`Server is running on port: ${defaultPort}`))
