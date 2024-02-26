import { readonlyStorageProvider } from '../observers/storage-provision.observer.mjs'
import { create } from '@web3-storage/w3up-client'
import { storageBookProvisionPath } from '../../path.config.mjs'

//Configurar a recuperação para acesso em outros dispositivos;
async function storageRecovery(storage_space, owner_account, client) {
  const recovery = await storage_space.createRecovery(owner_account.did())
  await client.capability.access
    .delegate({
      space: storage_space.did(),
      delegations: recovery
    })
}

async function anotherStorageProvision() {
  readonlyStorageProvider.notify('storage_provision', {
    data: {
      notifiedAt: new Date().toISOString(),
    }
  })
}

//Criação de um espaço e seu Provisionamento precisa acontecer uma vez;
let Web3StorageProvision;
async function storageProvision() {
  await create()
    .then(async (_client) => {
      Web3StorageProvision = _client
      const provisionSpace = await _client.createSpace()

      if (provisionSpace) {
        const spaceCredential = process.env.STORAGE_SPACE_LOGIN
        if (spaceCredential) {
          _client.login(spaceCredential)
            .then(async (sentinel_account) => {
              while (true) {
                const response = await sentinel_account.plan.get()
                if (response.ok) {
                  await sentinel_account.provision(provisionSpace.did())
                  await storageRecovery()

                  try {
                    await readonlyStorageProvider.notify('storage_provision', {
                      data: {
                        notifiedAt: new Date().toISOString(),
                        book_path: storageBookProvisionPath
                          .concat('/web3-storage-provision.json')
                      }
                    })
                  } catch {
                    await anotherStorageProvision()
                  }

                  break;
                };

                await new Promise(resolve =>
                  setTimeout(resolve, 5000))
              }
            })
        }

      }
    })
    .catch(async () => {
      await anotherStorageProvision()
    })
}

export { storageProvision, Web3StorageProvision }