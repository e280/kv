
import {Data} from "./data.js"
import {Write} from "./types.js"
import {Prefixer} from "./prefixer.js"

export class Writer<V = any> {
	#prefixer: Prefixer

	constructor(prefixer: Prefixer) {
		this.#prefixer = prefixer
	}

	puts(...entries: [string, V][]): Write[] {
		return entries.map(([key, value]) => ({
			kind: "put",
			key: this.#prefixer.prefix(key),
			value: Data.stringify(value),
		}))
	}

	put(key: string, value: V): Write[] {
		return this.puts([key, value])
	}

	del(...keys: string[]): Write[] {
		return keys.map(key => ({
			kind: "del",
			key: this.#prefixer.prefix(key),
		}))
	}
}

