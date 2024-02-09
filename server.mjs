import * as HttpServer from 'node:http'
import { Worker } from 'node:worker_threads'
import formidable, { errors as formidableErr } from 'formidable'
import * as dotenv from 'dotenv'

import jwt from 'jsonwebtoken'

const { sign } = jwt
dotenv.config()
const defaultPort = 1102

const claimToken = (ctx_request) => {
  let authToken;
  if (ctx_request) {
    authToken = ctx_request.headers['authorization']
  } return authToken
}

HttpServer.createServer(async (request, response) => {
  const baseUrl = '/cloud'

  if (request.method === 'POST') {
    if (request.url === '/sign') {
      const signWorker = new Worker('./worker_threads/sentinel-sign.worker.mjs')
      signWorker.on('message', (email) => {
        response.writeHead(200, {
          authorization: sign(email,
            process.env.JWT_SECRET_KEY)
        })

        response.end()
      })

      request.on('data', (chunk) => {
        signWorker.postMessage(chunk.toString('utf8'))
      })
    }

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
