
import {Cubby, got} from "@e280/stz"
import {Kv} from "./kv.js"
import {StoreOperator} from "./utils/store-operator.js"

export class Store<V = unknown> implements Cubby<V> {
	op

	constructor(public kv: Kv, public key: string) {
		this.op = new StoreOperator(key, kv.op)
	}

	async set(value: V | undefined) {
		return this.kv.set(this.key, value)
	}

	async get(): Promise<V | undefined> {
		return this.kv.get(this.key)
	}

	async need(): Promise<V> {
		return got(await this.get(), `key not found "${this.key}"`)
	}

	async delete() {
		return this.kv.set(this.key, undefined)
	}
}

