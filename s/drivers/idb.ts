
import {Driver} from "../parts/driver.js"
import {Scan, Write} from "../parts/types.js"

const storeName = "kv"

export class IdbDriver extends Driver {
	#db: Promise<IDBDatabase>

	constructor(name = "kv") {
		super()
		this.#db = open(name)
	}

	async gets(...keys: string[]) {
		const {store, done} = await this.#transaction("readonly")
		const values = await Promise.all(keys.map(key => request(store.get(key))))
		await done
		return values as (string | undefined)[]
	}

	async hasKeys(...keys: string[]) {
		const {store, done} = await this.#transaction("readonly")
		const values = await Promise.all(keys.map(key => request(store.getKey(key))))
		await done
		return values.map(value => value !== undefined)
	}

	async *keys(scan: Scan) {
		if (scan.limit === 0)
			return

		const {store, done} = await this.#transaction("readonly")
		const keys = await request(store.getAllKeys(range(scan), scan.limit))
		await done
		yield* keys as string[]
	}

	async *entries(scan: Scan) {
		if (scan.limit === 0)
			return

		const {store, done} = await this.#transaction("readonly")
		const [keys, values] = await Promise.all([
			request(store.getAllKeys(range(scan), scan.limit)),
			request(store.getAll(range(scan), scan.limit)),
		])
		await done

		for (let i = 0; i < keys.length; i++)
			yield [keys[i], values[i]] as [string, string]
	}

	async transaction(...writes: Write[]) {
		const {store, done} = await this.#transaction("readwrite")
		for (const [key, value] of writes) {
			if (value === undefined)
				store.delete(key)
			else
				store.put(value, key)
		}
		await done
	}

	async #transaction(mode: IDBTransactionMode) {
		const db = await this.#db
		const transaction = db.transaction(storeName, mode)
		return {
			store: transaction.objectStore(storeName),
			done: complete(transaction),
		}
	}
}

function open(name: string) {
	const opening = indexedDB.open(name, 1)
	opening.onupgradeneeded = () => {
		if (!opening.result.objectStoreNames.contains(storeName))
			opening.result.createObjectStore(storeName)
	}
	return request(opening)
}

function request<R>(request: IDBRequest<R>) {
	return new Promise<R>((resolve, reject) => {
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

function complete(transaction: IDBTransaction) {
	return new Promise<void>((resolve, reject) => {
		transaction.oncomplete = () => resolve()
		transaction.onabort = transaction.onerror = () => reject(transaction.error)
	})
}

function range({start, end}: Scan) {
	if (start && end) return IDBKeyRange.bound(start, end)
	if (start) return IDBKeyRange.lowerBound(start)
	if (end) return IDBKeyRange.upperBound(end)
}

