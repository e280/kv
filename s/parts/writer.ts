
import {Data} from "./data.js"
import {Write} from "./types.js"
import {Prefixer} from "./prefixer.js"

export class Writer<V = any> {
	#prefixer: Prefixer

	constructor(prefixer: Prefixer) {
		this.#prefixer = prefixer
	}

	puts<X extends V = V>(...entries: [string, X | undefined][]): Write[] {
		return entries.map(([k, value]) => {
			const key = this.#prefixer.prefix(k)

			// translate undefined put as del
			return (value === undefined )
				? {
					kind: "del",
					key,
				}
				: {
					kind: "put",
					key,
					value: Data.stringify(value),
				}
		})
	}

	put<X extends V = V>(key: string, value: X | undefined): Write[] {
		return this.puts([key, value])
	}

	del(...keys: string[]): Write[] {
		return keys.map(key => ({
			kind: "del",
			key: this.#prefixer.prefix(key),
		}))
	}
}

