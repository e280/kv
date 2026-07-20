
import {scanMatch} from "../utils/scan-match.js"
import {Change, Magazine, Scan} from "../types.js"

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
		if (scan.limit === 0)
			return

		let count = 0

		for (const [key, value] of this.#map.entries()) {
			if (scanMatch(key, scan)) {
				yield [key, value] as [string, string]
				count += 1
			}
			if (count >= (scan.limit ?? Infinity))
				break
		}
	}
}

