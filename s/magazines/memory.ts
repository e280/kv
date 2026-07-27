
import {scanEntries} from "../utils/scan-entries.js"
import {Op, Magazine, Scan, Value} from "../types.js"

export class MemoryMagazine implements Magazine {
	#map = new Map<string, Value>()

	async commit(ops: Op<Value>[]) {
		for (const [key, value] of ops) {
			if (value === undefined)
				this.#map.delete(key)
			else
				this.#map.set(key, structuredClone(value))
		}
	}

	async getMany(keys: string[]) {
		return keys.map(key => structuredClone(this.#map.get(key)))
	}

	async* entries(scan: Scan = {}) {
		yield* scanEntries(scan, [...this.#map.entries()].map(([key, value]) => [key, structuredClone(value)]))
	}
}

