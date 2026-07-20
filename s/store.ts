
import {Cubby} from "@e280/stz"
import {Kv} from "./kv.js"
import {StoreOp} from "./utils/store-op.js"

export class Store<V = unknown> implements Cubby<V> {
	op

	constructor(public kv: Kv, public key: string) {
		this.op = new StoreOp(kv.op, key)
	}

	async set(value: V | undefined) {
		return this.kv.set(this.key, value)
	}

	async get(): Promise<V | undefined> {
		return this.kv.get(this.key)
	}

	async delete() {
		return this.kv.set(this.key, undefined)
	}
}

