import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename).concat('/src')

const credentialsPath = join(__dirname,  '/worker_threads/data/credentials.json',)
const workersPath = join(__dirname, '/worker_threads')
const storageBookProvisionPath = join(__dirname, 'worker_threads/provision')

export { credentialsPath, workersPath, storageBookProvisionPath }
