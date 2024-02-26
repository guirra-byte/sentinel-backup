import { parentPort } from 'node:worker_threads'
import { Worker } from 'node:worker_threads'

parentPort.on('message', (docs) => {
  const agroupChapters = {}
  const claimBooksNameWorker = new Worker('./lotr-books-name.worker.mjs')

  const tagedBooks = docs.map(doc => { return doc._id })
  
  claimBooksNameWorker.postMessage(tagedBooks)
  claimBooksNameWorker.on('message', (tags) => {
    for (const tag of tags) {
      for (const doc of docs) {
        console.log(docs)
        const { book, chapterName } = doc

        if (!agroupChapters[tag.name]) {
          if (book === tag._id) {
            agroupChapters[tag.name] = [chapterName]
          }
        } else {
          agroupChapters[tag.name].push(chapterName)
        }
      }
    }
  })

  parentPort.postMessage(agroupChapters)
})