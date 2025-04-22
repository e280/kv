
import {Kv} from "../kv.js"
import {Maker} from "./types.js"

export class Store<V = any> {
	constructor(public kv: Kv, public key: string) {}

	async put(value: V) {
		return this.kv.put(this.key, value)
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
			await this.put(value)
		}
		return value
	}
}

