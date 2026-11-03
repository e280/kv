
import {Idb} from "./types.js"

export async function idbOpen(dbName: string, storeName = dbName): Promise<Idb> {
	return {
		dbName,
		storeName,
		db: await new Promise<IDBDatabase>((resolve, reject) => {
			const request = indexedDB.open(dbName, 1)
			request.onblocked = () => reject(new Error("idb blocked"))
			request.onerror = () => reject(request.error)
			request.onupgradeneeded = () => request.result.createObjectStore(storeName)
			request.onsuccess = () => resolve(request.result)
		}),
	}
}

