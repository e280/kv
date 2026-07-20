
import {scanMatch} from "../utils/scan-match.js"
import {Change, Magazine, Scan} from "../types.js"

export class StorageMagazine implements Magazine {
	#storage

	constructor(storage: Storage = window.localStorage) {
		this.#storage = storage
	}

	async commit(changes: Change<string>[]) {
		for (const [key, value] of changes) {
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
		if (scan.limit === 0)
			return

		let count = 0

		for (const [key, value] of Object.entries(this.#storage)) {
			if (scanMatch(key, scan)) {
				yield [key, value] as [string, string]
				count += 1
			}
			if (count >= (scan.limit ?? Infinity))
				break
		}
	}
}

