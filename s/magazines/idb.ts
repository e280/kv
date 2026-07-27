
import {Idb} from "../utils/idb/types.js"
import {idbRange} from "../utils/idb/range.js"
import {Op, Magazine, Scan, Value} from "../types.js"
import {idbTransactions} from "../utils/idb/transactions.js"

export class IdbMagazine implements Magazine {
	#tx

	constructor(idb: Idb) {
		this.#tx = idbTransactions(idb)
	}

	async commit(ops: Op<Value>[]) {
		return this.#tx.readwrite(async store => {
			for (const [key, value] of ops) {
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
				keys.map(key => wait<Value | undefined>(store.get(key)))
			)
		))
	}

	async* entries(scan: Scan = {}) {
		if (scan.limit === 0)
			return

		yield* await this.#tx.readonly(async (store, wait) => {
			const entries: [string, Value][] = []
			const direction = scan.reverse ? "prev" : "next"
			const request = store.openCursor(idbRange(scan), direction)

			let cursor = await wait<IDBCursorWithValue | null>(request)

			while (cursor) {
				entries.push([cursor.key as string, cursor.value])

				if (scan.limit !== undefined && entries.length >= scan.limit)
					break

				cursor.continue()
				cursor = await wait<IDBCursorWithValue | null>(request)
			}

			return entries
		})
	}
}

