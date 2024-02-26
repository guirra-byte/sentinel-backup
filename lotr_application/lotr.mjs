import * as HttpServer from 'node:http'
import axios from 'axios'
import { Worker } from 'worker_threads'

const LOTR_PORT = 1508
const LOTR_API_ACCESS_TOKEN = 'c9tBGyUW9KgiThCGqged'

HttpServer.createServer(async (request, response) => {
  const lotrBaseURL = 'https://the-one-api.dev/v2'
  const [apiResource] = [lotrBaseURL.concat('/chapter')]

  if (request.url.includes('/ring')) {
    try {
      const callAPI = await axios.get(apiResource,
        { headers: { Authorization: `Bearer ${LOTR_API_ACCESS_TOKEN}` } })

      const docsWorker = new Worker('./lotr.worker.mjs')
      docsWorker.on('message', (serialized_docs) => {
        for (const [book, chapter_name] of Object.entries(serialized_docs)) {
          console.log(`Livro ${book} - ${chapter_name}; \n\n`)
        }

        response.end()
      })

      docsWorker.postMessage(callAPI.data.docs)
    } catch (err) {
      throw err
    }
  }
})
  .listen(LOTR_PORT,
    () => console.log(`The server is running on ${LOTR_PORT}`))