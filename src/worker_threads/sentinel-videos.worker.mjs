import { parentPort } from 'node:worker_threads'
import Pool from 'worker-threads-pool'

class Slop extends Pool {
  constructor(options) {
    super(options)
  }

  get slopProps() {
    return super.props
  }

  get waitingLength() {
    const { _queue } = this.slopProps()
    return _queue.length
  }

  get maxWaiting() {
    const { _maxWaiting } = this.slopProps()
    return _maxWaiting
  }
}

const MAX_SLOP_WORKERS = 5
const ctxVideosSlop = new Slop({
  max: MAX_SLOP_WORKERS
});

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
    const ballanceBaggage = Math.floor(videosGenerator.length / MAX_SLOP_WORKERS)
    for (let k = 0; k < videosGenerator.length; k += ballanceBaggage) {
      ctxVideosSlop.acquire('./videos-slop.worker.mjs', (err, worker) => {
        if (err) throw err;
        
        const claimWorkerDataBaggage = videos.copywithin(
          ballanceBaggage,
          i === 0 ? 0 : k,
          (k + ballanceBaggage)
        )

        worker.on('message', (uploadReply) => {
          parentPort.postMessage(uploadReply)
        })

        worker.postMessage(JSON.stringify(claimWorkerDataBaggage))
      })
    }
  }
})