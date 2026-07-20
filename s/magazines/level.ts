
import {Op, LevelLike, Magazine, Scan} from "../types.js"

export class LevelMagazine implements Magazine {
	#level

	constructor(level: LevelLike) {
		this.#level = level
	}

	async commit(ops: Op<string>[]) {
		return this.#level.batch(
			ops.map(([key, value]) =>
				(value === undefined)
					? {type: "del", key}
					: {type: "put", key, value}
			)
		)
	}

	async getMany(keys: string[]) {
		return this.#level.getMany(keys)
	}

	async* entries(scan: Scan = {}) {
		const results = this.#level.iterator({
			gte: scan.start,
			lt: scan.end,
			limit: scan.limit,
			reverse: scan.reverse,
		})

		for await (const entry of results)
			yield entry
	}
}

