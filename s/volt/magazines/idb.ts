
import {Idb} from "../utils/idb/types.js"
import {idbRange} from "../utils/idb/range.js"
import {Change, Magazine, Scan} from "../types.js"
import {idbTransactions} from "../utils/idb/transactions.js"

export class IdbMagazine implements Magazine {
	#tx

	constructor(idb: Idb) {
		this.#tx = idbTransactions(idb)
	}

	async commit(changes: Change<string>[]) {
		return this.#tx.readwrite(async store => {
			for (const [key, value] of changes) {
				if (value === undefined)
					store.delete(key)
				else
					store.put(value, key)
			}
		})
	}

	async getMany(keys: string[]) {
		return this.#tx.readonly((store, wait) => (
			Promise.all(
				keys.map(key => wait<string | undefined>(store.get(key)))
			)
		))
	}

	async* entries(scan: Scan = {}) {
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
}

