
import {Change, Magazine, Scan} from "../types.js"
import {scanEntries} from "../utils/scan-entries.js"

export class MemoryMagazine implements Magazine {
	#map = new Map<string, string>()

	async commit(changes: Change<string>[]) {
		for (const [key, value] of changes) {
			if (value === undefined)
				this.#map.delete(key)
			else
				this.#map.set(key, value)
		}
	}

	async getMany(keys: string[]) {
		return keys.map(key => this.#map.get(key))
	}

	async* entries(scan: Scan = {}) {
		yield* scanEntries(scan, [...this.#map.entries()])
	}
}

