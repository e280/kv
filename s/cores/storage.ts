
import {ev} from "../parts/ev.js"
import {Core} from "../parts/core.js"
import {Scan, Write} from "../parts/types.js"
import {scanMatch} from "../parts/scan-match.js"

export class StorageCore extends Core {
	static onStorageEvent = (fn: () => void) => ev(window, {storage: fn})

	constructor(public storage: Storage = window.localStorage) {
		super()
	}

	async gets(...keys: string[]) {
		return keys.map(key => (this.storage.getItem(key) ?? undefined))
	}

	async hasKeys(...keys: string[]) {
		return keys.map(key => (this.storage.getItem(key) !== null))
	}

	async *keys(scan: Scan = {}) {
		if (scan.limit === 0)
			return

		let count = 0

		for (const key of Object.keys(this.storage)) {
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

		for (const [key, value] of Object.entries(this.storage)) {
			if (scanMatch(key, scan)) {
				yield [key, value] as [string, string]
				count += 1
			}
			if (count >= (scan.limit ?? Infinity))
				break
		}
	}

	async transaction(...writes: Write[]) {
		for (const [key, value] of writes) {
			if (value === undefined)
				this.storage.removeItem(key)
			else
				this.storage.setItem(key, value)
		}
	}
}

