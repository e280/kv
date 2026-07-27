
import {JsonCodec} from "../utils/json-codec.js"
import {Op, LevelLike, Magazine, Scan, Codec, Value} from "../types.js"

export class LevelMagazine implements Magazine {
	#level
	#codec

	constructor(level: LevelLike, options: {codec?: Codec} = {}) {
		this.#level = level
		this.#codec = options.codec ?? new JsonCodec()
	}

	async commit(ops: Op<Value>[]) {
		return this.#level.batch(
			ops.map(([key, value]) =>
				(value === undefined)
					? {type: "del", key}
					: {type: "put", key, value: this.#codec.encode(value)}
			)
		)
	}

	async getMany(keys: string[]) {
		const values = await this.#level.getMany(keys)
		return values.map(value => {
			return value === undefined
				? undefined
				: this.#codec.decode(value)
		})
	}

	async* entries(scan: Scan = {}) {
		const results = this.#level.iterator({
			gte: scan.start,
			lt: scan.end,
			limit: scan.limit,
			reverse: scan.reverse,
		})

		for await (const [key, text] of results) {
			const value = this.#codec.decode(text)
			if (value !== undefined)
				yield [key, value] as [string, Value]
		}
	}
}

