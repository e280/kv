
import {Level} from "level"
import {Change, Magazine, Scan} from "../types.js"

export class LevelMagazine implements Magazine {
	#level

	constructor(level: Level) {
		this.#level = level
	}

	async commit(changes: Change<string>[]) {
		return this.#level.batch(
			changes.map(([key, value]) =>
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
			lte: scan.end,
			limit: scan.limit,
		})

		for await (const entry of results)
			yield entry
	}
}

