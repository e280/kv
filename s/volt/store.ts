
import {Kv} from "./kv.js"
import {StoreTx} from "./utils/store-tx.js"

export class Store<V = any> {
	tx

	constructor(public kv: Kv, public key: string) {
		this.tx = new StoreTx(kv.tx, key)
	}

	async set(value: V | undefined) {
		return this.kv.set(this.key, value)
	}

	async get(): Promise<V | undefined> {
		return this.kv.get(this.key)
	}
}

