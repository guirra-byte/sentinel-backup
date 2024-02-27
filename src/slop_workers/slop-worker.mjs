import Pool from 'worker-threads-pool'

const test = new Pool()
class Slop extends Pool {
  constructor(options){
    super(options)
  }

  get slopProps(){
    return super.props
  }

  get waitingSize(){
    const { _queue } = this.slopProps()
    return _queue.length
  }

  get maxWaiting(){
    const { _maxWaiting } = this.slopProps()
    return _maxWaiting
  }
}

const slop = new Slop({ max: 5, maxWaiting: 5 })

const database = []
const aggregateRule = 10
for (let i = 0; i < database.length; i += 10) {
  slop.acquire('/my/worker.js', function (err, worker) {
    if (err) throw err
    console.log(`started worker ${i} (pool size: ${pool.size})`)
    worker.on('exit', function () {
      console.log(`worker ${i} exited (pool size: ${pool.size})`)
    })

    const aggregateData = database.copyWithin(
      aggregateRule,
      i === 0 ? i : (i - aggregateRule),
      i)

    worker.postMessage(JSON.stringify(aggregateData))
  })
}

const APPLICATION_SLOPS = [slop]
for (let slop of APPLICATION_SLOPS) {
  if (slop.waitingSize < slop.maxWaiting) { }
}