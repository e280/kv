
import {Cubby, got} from "@e280/stz"
import {Kv} from "./kv.js"
import {CellOperator} from "./utils/cell-operator.js"

export class Cell<V = unknown> implements Cubby<V> {
	op

	constructor(public kv: Kv, public key: string) {
		this.op = new CellOperator(key, kv.op)
	}

	async set(value: V | undefined) {
		return this.kv.set(this.key, value)
	}

	async get(): Promise<V | undefined> {
		return this.kv.get(this.key)
	}

	async has(): Promise<boolean> {
		return (await this.get()) !== undefined
	}

	async need(): Promise<V> {
		return got(await this.get(), `key not found "${this.key}"`)
	}

	async delete() {
		return this.kv.set(this.key, undefined)
	}
}

