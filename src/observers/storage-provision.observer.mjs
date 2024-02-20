import { storageProvision } from "../worker_threads/sentinel-provision-storage.worker.mjs";
import * as fs from 'node:fs'


//Interface -> Contract to be implements;
//The `func` argument is Subscriber Callback - (ctx_event: any) => void
//Editor func can be offer a event context for Subscriber callback;
//this.Subscribers -> Logbook for all events subscribers - Record<string, (ctx_event: any) => void[]>;
//Use another logbook reserved for dispatched Subscribers;
//The Provision Storage event can only occur once;

class SubEngine {
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

const SINGLE_STORAGE_PROVISION = Object.assign(new StorageProvisionEditor(), new SubEngine())
async function bookProvidedStorage(input) {
  const bookedStorage = fs.existsSync(input.book_path)
  if (label === process.env.STORAGE_PROVISION_LABEL && !bookedStorage) {
    await storageProvision()

    fs.writeFile(input.book_path, input.data, async (err) => {
      if (err) throw err;
    }); SINGLE_STORAGE_PROVISION.unsubscribe(bookProvidedStorage)
  }
}


const readonlyStorageProvider = Object.freeze(SINGLE_STORAGE_PROVISION)
export {
  readonlyStorageProvider,
  bookProvidedStorage
}