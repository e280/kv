
import {Kv} from "./kv.js"
import {StoreOp} from "./utils/store-op.js"

export class Store<V = unknown> {
	tx

	constructor(public kv: Kv, public key: string) {
		this.tx = new StoreOp(kv.op, key)
	}

	async set(value: V | undefined) {
		return this.kv.set(this.key, value)
	}

	async get(): Promise<V | undefined> {
		return this.kv.get(this.key)
	}
}

