
import {Kv} from "../kv.js"
import {Writer} from "./writer.js"
import {Maker, Write} from "./types.js"

export class Store<V = any> {
	write: StoreWriter

	constructor(public kv: Kv, public key: string) {
		this.write = new StoreWriter(kv.write, key)
	}

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

export class StoreWriter<V = any> {
	#write: Writer<V>

	constructor(write: Writer<V>, public key: string) {
		this.#write = write
	}

	set<X extends V = V>(value: X | undefined): Write[] {
		return this.#write.set(this.key, value)
	}
}

