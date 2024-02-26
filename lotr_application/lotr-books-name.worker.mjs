import { parentPort } from 'node:worker_threads'
import axios from 'axios'

parentPort.on('message', async (msg) => {
  const onPromise = msg.map(async bookId => {
    try {
      const response = await axios.get(`https://the-one-api.dev/v2/book/${bookId}`,
        { headers: { Authorization: 'Bearer c9tBGyUW9KgiThCGqged' } })
      return response.data.docs[0]
    } catch (err) { throw err }
  })

  const claimNames = await Promise.all(onPromise)
  parentPort.postMessage(claimNames)
})