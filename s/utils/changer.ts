
import {Change} from "../types.js"
import {Prefixer} from "./prefixer.js"

export class Changer<V = unknown> {
	#prefixer: Prefixer

	constructor(prefixer: Prefixer) {
		this.#prefixer = prefixer
	}

	set<X extends V = V>(key: string, value: X | undefined): Change<X> {
		return [this.#prefixer.prefix(key), value]
	}

	delete(key: string): Change<undefined> {
		return [this.#prefixer.prefix(key), undefined]
	}
}

