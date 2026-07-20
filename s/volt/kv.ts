
import {got} from "@e280/stz"
import {Op} from "./utils/op.js"
import {Store} from "./store.js"
import {chunks} from "./utils/chunks.js"
import {Prefixer} from "./utils/prefixer.js"
import {MemoryMagazine} from "./magazines/memory.js"
import {Magazine, Change, Options, Scan} from "./types.js"

export class Kv<V = unknown> {
	op
	#magazine
	#prefixer
	#options: Options

	constructor(magazine: Magazine = new MemoryMagazine(), options: Partial<Options> = {}) {
		this.#magazine = magazine
		this.#options = {
			scopes: [],
			divisor: ".",
			delimiter: ":",
			chunkSize: 1024,
			...options,
		}
		this.#prefixer = new Prefixer(this.#options)
		this.op = new Op<V>(this.#prefixer)
	}

	/** create a store which can set or get on a single key */
	store<X extends V = V>(key: string) {
		return new Store<X>(this, key)
	}

	/** create a sub kv where all keys inherit a prefix */
	scope<X extends V = V>(scope: string, delimiter = this.#options.delimiter) {
		const scopes = [...this.#options.scopes, scope]
		return new Kv<X>(this.#magazine, {...this.#options, delimiter, scopes})
	}

	/** no delimiter means all sub namespaces are accessible */
	flatten() {
		return new Kv<V>(this.#magazine, {...this.#options, delimiter: ""})
	}

	async commit(changes: Change<V>[]) {
		await this.#magazine.commit(
			changes.map(([key, value]) => [key, JSON.stringify(value)])
		)
	}

	async set<X extends V = V>(key: string, value: X | undefined) {
		return this.commit([this.op.set(key, value)])
	}

	async delete(key: string) {
		return this.commit([this.op.delete(key)])
	}

	async getMany<X extends V = V>(keys: string[]) {
		keys = keys.map(key => this.#prefixer.prefix(key))
		return (await this.#magazine.getMany(keys)).map(value =>
			(value === undefined)
				? undefined
				: JSON.parse(value) as X
		)
	}

	async get<X extends V = V>(key: string) {
		const [value] = await this.getMany<X>([key])
		return value
	}

	async has(key: string) {
		return (await this.get(key)) !== undefined
	}

	async need<X extends V = V>(key: string) {
		return got(await this.get<X>(key), `key not found "${key}"`)
	}

	async needMany<X extends V = V>(keys: string[]) {
		const values = await this.getMany<X>(keys)
		for (const [index, key] of keys.entries())
			got(values[index], `key not found "${key}"`)
		return values as X[]
	}

	async* entries<X extends V = V>(scan: Scan = {}) {
		scan = this.#prefixer.scan(scan)

		for await (const [key, value] of this.#magazine.entries(scan))
			yield [this.#prefixer.unprefix(key), JSON.parse(value)] as [string, X]
	}

	async* keys(scan: Scan = {}) {
		for await (const [key] of this.entries(scan))
			yield key
	}

	async* values<X extends V = V>(scan: Scan = {}) {
		for await (const [, value] of this.entries(scan))
			yield value as X
	}

	async clear(scan: Scan = {}) {
		const keys: string[] = []

		for await (const [key] of this.entries(scan))
			keys.push(key)

		for (const chunk of chunks(this.#options.chunkSize, keys))
			await this.commit(chunk.map(key => this.op.delete(key)))
	}
}

