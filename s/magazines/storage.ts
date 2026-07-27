
import {JsonCodec} from "../utils/json-codec.js"
import {scanEntries} from "../utils/scan-entries.js"
import {Op, Magazine, Scan, Codec, Value} from "../types.js"

export class StorageMagazine implements Magazine {
	#storage
	#codec

	constructor(storage: Storage = window.localStorage, options: {codec?: Codec} = {}) {
		this.#storage = storage
		this.#codec = options.codec ?? new JsonCodec()
	}

	async commit(ops: Op<Value>[]) {
		for (const [key, value] of ops) {
			if (value === undefined)
				this.#storage.removeItem(key)
			else
				this.#storage.setItem(key, this.#codec.encode(value))
		}
	}

	async getMany(keys: string[]) {
		return keys.map(key => {
			const item = this.#storage.getItem(key)
			return item === null
				? undefined
				: this.#codec.decode(item)
		})
	}

	async* entries(scan: Scan = {}) {
		for (const [key, text] of scanEntries<string>(scan, Object.entries(this.#storage))) {
			const value = this.#codec.decode(text)
			if (value !== undefined)
				yield [key, value] as [string, Value]
		}
	}
}

