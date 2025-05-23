
import {Level} from "level"
import {Driver} from "../parts/driver.js"
import {Scan, Write} from "../parts/types.js"

export class LevelDriver extends Driver {
	#db: Level<string, string>

	constructor(path: string) {
		super()
		this.#db = new Level(path)
	}

	async gets(...keys: string[]) {
		return this.#db.getMany(keys)
	}

	// TODO when it's released, use level's upcoming .has and .hasMany
	//  - currently we're using a hack, using .get
	//  - see https://github.com/Level/community/issues/142
	async hasKeys(...keys: string[]) {
		if (keys.length === 0) return []
		const values = await this.gets(...keys)
		return values.map(value => value !== undefined)
	}

	async *keys(scan: Scan = {}) {
		const results = this.#db.keys({
			gte: scan.start,
			lte: scan.end,
			limit: scan.limit,
		})
		for await (const key of results)
			yield key
	}

	async *entries(scan: Scan = {}) {
		const results = this.#db.iterator({
			gte: scan.start,
			lte: scan.end,
			limit: scan.limit,
		})
		for await (const entry of results)
			yield entry
	}

	async transaction(...writes: Write[]) {
		return this.#db.batch(
			writes.map(([key, value]) => (
				(value === undefined)
					? {type: "del", key}
					: {type: "put", key, value}
			))
		)
	}
}

