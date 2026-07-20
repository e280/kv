
import {Op} from "../types.js"
import {Prefixer} from "./prefixer.js"

export class Operator<V = unknown> {
	#prefixer: Prefixer

	constructor(prefixer: Prefixer) {
		this.#prefixer = prefixer
	}

	set<X extends V = V>(key: string, value: X | undefined): Op<X> {
		return [this.#prefixer.prefix(key), value]
	}

	delete(key: string): Op<undefined> {
		return [this.#prefixer.prefix(key), undefined]
	}
}

