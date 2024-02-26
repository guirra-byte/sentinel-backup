import { R2 } from "node-cloudflare-r2";
import { storageProvision } from "../worker_threads/sentinel-provision-storage.worker.mjs";
import * as fs from 'node:fs'


//Interface -> Contract to be implements;
//The `func` argument is Subscriber Callback - (ctx_event: any) => void
//Editor func can be offer a event context for Subscriber callback;
//this.Subscribers -> Logbook for all events subscribers - Record<string, (ctx_event: any) => void[]>;
//Use another logbook reserved for dispatched Subscribers;
//The Provision Storage event can only occur once;

class subscriptionEngine {
  Subscribers = {}
  subscribe = (label, func) => {
    if (this.Subscribers[label]) {
      this.Subscribers[label].push(func)
    } else { this.Subscribers[label] = [func] }
  }

  unsubscribe = (label, func) => {
    if (this.Subscribers[label]) {
      const claimAction = this.Subscribers[label]
        .findIndex(fn => fn === func);

      if (claimAction !== -1) this.Subscribers[label].slice(claimAction, 0);
    }
  }
  //Fornecer o contexto do evento para os assinantes;
  notify = async (label, data) => {
    if (this.Subscribers[label]) {
      const [fn] = this.Subscribers[label]
      await fn(data)
    }
  }
}

class StorageProvisionEditor {
  INSTANCE_CONTROL
  constructor() {
    if (!this.INSTANCE_CONTROL) {
      this.INSTANCE_CONTROL = this;
    } else {
      throw new Error('The Storage provision already occurred!')
    }
  }
}

const SINGLE_STORAGE_PROVISION = Object.assign(new StorageProvisionEditor(), new subscriptionEngine())
async function web3StorageBookProvision(input) {
  const bookedStorage = fs.existsSync(input.book_path)
  const { label } = input
  if (label === process.env.STORAGE_PROVISION_LABEL && !bookedStorage) {
    await storageProvision()

    fs.writeFile(input.book_path, input.data.notified, async (err) => {
      if (err) throw err;
    }); SINGLE_STORAGE_PROVISION.unsubscribe(web3StorageBookProvision)
  }
}

let R2StorageProvision
async function r2StorageBookProvision(data) {
  const { label } = data
  if (label === 'second_storage_resource' &&
    !process.env.WEB3_STORAGE_PROVISION_STATUS) {
    const r2Storage = new R2({
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      accountId: process.env.R2_ACCOUNT_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    })

    const sentinelPrimeBucket = process.env.R2_BUCKET_NAME
    const bucket = r2Storage.bucket(sentinelPrimeBucket)
    bucket.provideBucketPublicUrl(`https://pub-${sentinelPrimeBucket}.r2.dev`)

    if (bucket.exists()) {
      process.env.R2_STORAGE_PROVISION_STATUS = true
      R2StorageProvision = bucket.uploadFile
      SINGLE_STORAGE_PROVISION.unsubscribe(label)
    }
  }
}

const readonlyStorageProvider = Object.freeze(SINGLE_STORAGE_PROVISION)
export {
  readonlyStorageProvider,
  web3StorageBookProvision,
  R2StorageProvision,
  r2StorageBookProvision
}