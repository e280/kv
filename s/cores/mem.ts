
import {Core} from "../parts/core.js"
import {Scan, Write} from "../parts/types.js"
import {scanMatch} from "../parts/scan-match.js"

export class MemCore extends Core {
	#map = new Map<string, string>()

	async gets(...keys: string[]) {
		return keys.map(key => this.#map.get(key))
	}

	async hasKeys(...keys: string[]) {
		return keys.map(key => this.#map.has(key))
	}

	async *keys(scan: Scan = {}) {
		if (scan.limit === 0)
			return

		let count = 0

		for (const key of this.#map.keys()) {
			if (scanMatch(key, scan)) {
				yield key
				count += 1
			}
			if (count >= (scan.limit ?? Infinity))
				break
		}
	}

	async *entries(scan: Scan = {}) {
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

	async transaction(...writes: Write[]) {
		for (const write of writes) {
			switch (write.kind) {

				case "put":
					this.#map.set(write.key, write.value)
					break

				case "del":
					this.#map.delete(write.key)
					break

				default:
					throw new Error(`unknown write kind`)
			}
		}
	}
}

