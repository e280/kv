
import {Kv} from "../kv.js"
import {Maker} from "./types.js"

export class Store<V = any> {
	constructor(public kv: Kv, public key: string) {}

	async set(value: V | undefined) {
		return this.kv.set(this.key, value)
	}

	async get(): Promise<V | undefined> {
		return this.kv.get(this.key)
	}

	async require(): Promise<V> {
		return this.kv.require(this.key)
	}

	async guarantee(make: Maker<V>): Promise<V> {
		let value: V | undefined = await this.get()
		if (value === undefined) {
			value = await make()
			await this.set(value)
		}
		return value
	}
}

