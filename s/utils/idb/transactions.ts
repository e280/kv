
import {Idb} from "./types.js"
import {idbWait} from "./wait.js"

export function idbTransactions({db, storeName}: Idb) {
	const setup = (mode: IDBTransactionMode) => (
		async<R>(fn: (store: IDBObjectStore, wait: typeof idbWait) => Promise<R>) => {
			const tx = db.transaction(storeName, mode)
			const store = tx.objectStore(storeName)

			const completed = new Promise((resolve, reject) => {
				tx.onabort = () => reject(tx.error ?? new Error("transaction aborted"))
				tx.oncomplete = () => resolve(undefined)
			})

			try {
				const result = await fn(store, idbWait)
				tx.commit()
				await completed
				return result
			}
			catch (error) {
				try { tx.abort() }
				catch {}
				throw error
			}
		}
	)

	return {
		readonly: setup("readonly"),
		readwrite: setup("readwrite"),
	}
}

