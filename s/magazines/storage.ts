
import {Op, Magazine, Scan} from "../types.js"
import {scanEntries} from "../utils/scan-entries.js"

export class StorageMagazine implements Magazine {
	#storage

	constructor(storage: Storage = window.localStorage) {
		this.#storage = storage
	}

	async commit(ops: Op<string>[]) {
		for (const [key, value] of ops) {
			if (value === undefined)
				this.#storage.removeItem(key)
			else
				this.#storage.setItem(key, value)
		}
	}

	async getMany(keys: string[]) {
		return keys.map(key => (this.#storage.getItem(key) ?? undefined))
	}

	async* entries(scan: Scan = {}) {
		yield* scanEntries(scan, Object.entries(this.#storage))
	}
}

