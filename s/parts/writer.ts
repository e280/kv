
import {Data} from "./data.js"
import {Write} from "./types.js"
import {Prefixer} from "./prefixer.js"

export class Writer<V = any> {
	#prefixer: Prefixer

	constructor(prefixer: Prefixer) {
		this.#prefixer = prefixer
	}

	sets<X extends V = V>(...entries: [string, X | undefined][]): Write[] {
		return entries.map(([k, v]) => {
			const key = this.#prefixer.prefix(k)
			const value = v === undefined
				? undefined
				: Data.stringify(v)
			return [key, value]
		})
	}

	set<X extends V = V>(key: string, value: X | undefined): Write[] {
		return this.sets([key, value])
	}

	del(...keys: string[]): Write[] {
		return keys.map(key => [this.#prefixer.prefix(key), undefined])
	}
}

