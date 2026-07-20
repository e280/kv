
import {Cubby} from "@e280/stz"
import {Kv} from "./kv.js"
import {StoreChanger} from "./utils/store-changer.js"

export class Store<V = unknown> implements Cubby<V> {
	x

	constructor(public kv: Kv, public key: string) {
		this.x = new StoreChanger(key, kv.x)
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

