
import {Operator} from "./operator.js"

export class StoreOperator<V = unknown> {
	#key
	#parent

	constructor(key: string, parent: Operator<V>) {
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

