import { parentPort } from 'node:worker_threads'
import * as fs from 'node:fs'
import crypto from 'node:crypto'
import { credentialsPath } from '../path.config.mjs'
const { scrypt } = crypto

class Sentinel {
  MASTER_KEY = ''
  constructor(key) {
    this.MASTER_KEY = key
  }

  lock(password) {
    scrypt(password, 'salt', 24, (err, key) => {
      if (err) throw err;
      console.log(key)
      return key.toString('base64')
    });
  }

  compare(lock_pass, pass, master_key) {
    if (master_key === this.MASTER_KEY) {
      scrypt(pass, 'salt', 24, (err, key) => {
        if (err) throw err;
        return lock_pass === key.toString('base64')
          ? true
          : false
      });
    } else {
      throw new Error('You dont have access!')
    }
  }
}

parentPort.on('message', (req_body) => {
  const { name, email, password } = JSON.parse(req_body)
  if (!name || !email || !password) {
    throw new Error('Where is your credentials?')
  }

  fs.readFile(credentialsPath, (err, credentials) => {
    if (err) {
      throw err
    }

    const sentinel = new Sentinel(process.env.SENTINEL_LOCK_KEY)
    const truncateCredentials = JSON.parse(credentials
      .toString('utf8'))

    let match = false
    for (let index = 0; index < truncateCredentials.access.length; index++) {
      if (truncateCredentials.access[index].email === email) {
        match = true;
        const user = truncateCredentials.access[index]
        const unlocked = user.password === password
        // const unlocked = sentinel
        //   .compare(user.password, req_body.password, process.env.SENTINEL_LOCK_KEY)

        if (unlocked) {
          parentPort.postMessage(email)
          break;
        } else {
          throw new Error('Wrong password!')
        }
      }

      if (index === (truncateCredentials.access.length - 1) && !match) {
        throw new Error('Try again!')
      }
    }
  })
})