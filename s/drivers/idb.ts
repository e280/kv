
import {Idb} from "./idb/types.js"
import {idbRange} from "./idb/range.js"
import {Driver} from "../parts/driver.js"
import {Scan, Write} from "../parts/types.js"
import {idbTransactions} from "./idb/transactions.js"

export class IdbDriver extends Driver {
	#tx

	constructor(idb: Idb) {
		super()
		this.#tx = idbTransactions(idb)
	}

	async gets(...keys: string[]) {
		return this.#tx.readonly((store, wait) => (
			Promise.all(
				keys.map(key => wait<string | undefined>(store.get(key)))
			)
		))
	}

	async hasKeys(...keys: string[]) {
		return (
			await this.#tx.readonly((store, wait) =>
				Promise.all(
					keys.map(key => wait<string>(store.getKey(key)))
				)
			)
		).map(key => key !== undefined)
	}

	async *keys(scan: Scan) {
		if (scan.limit === 0)
			return

		const keys = await this.#tx.readonly((store, wait) =>
			wait<string[]>(store.getAllKeys(idbRange(scan), scan.limit))
		)

		yield* keys
	}

	async *entries(scan: Scan) {
		if (scan.limit === 0)
			return

		const [keys, values] = await this.#tx.readonly((store, wait) =>
			Promise.all([
				wait<string[]>(store.getAllKeys(idbRange(scan), scan.limit)),
				wait<string[]>(store.getAll(idbRange(scan), scan.limit)),
			])
		)

		for (const [index, key] of keys.entries()) {
			const value = values[index]
			yield [key, value] as [string, string]
		}
	}

	async transaction(...writes: Write[]) {
		return this.#tx.readwrite(async store => {
			for (const [key, value] of writes) {
				if (value === undefined)
					store.delete(key)
				else
					store.put(value, key)
			}
		})
	}
}

