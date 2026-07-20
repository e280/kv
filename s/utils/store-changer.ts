
import {Changer} from "./changer.js"

export class StoreChanger<V = unknown> {
	#key
	#parent

	constructor(key: string, parent: Changer<V>) {
		this.#key = key
		this.#parent = parent
	}

	set(value: V | undefined) {
		return this.#parent.set(this.#key, value)
	}

	delete() {
		return this.#parent.delete(this.#key)
	}
}

