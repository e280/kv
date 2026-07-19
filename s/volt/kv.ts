
import {Tx} from "./utils/tx.js"
import {Store} from "./store.js"
import {chunks} from "./utils/chunks.js"
import {Prefixer} from "./utils/prefixer.js"
import {Magazine, Change, Options, Scan} from "./types.js"

export class Kv<V = unknown> {
	tx
	#magazine
	#prefixer
	#options: Options

	constructor(magazine: Magazine, options: Partial<Options> = {}) {
		this.#magazine = magazine
		this.#options = {
			scopes: [],
			divisor: ".",
			delimiter: ":",
			chunkSize: 1024,
			...options,
		}
		this.#prefixer = new Prefixer(this.#options)
		this.tx = new Tx<V>(this.#prefixer)
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

	async write(changes: Change<V>[]) {
		await this.#magazine.write(
			changes.map(([key, value]) => [key, JSON.stringify(value)])
		)
	}

	async set<X extends V = V>(key: string, value: X) {
		return this.write([this.tx.set(key, value)])
	}

	async delete(key: string) {
		return this.write([this.tx.delete(key)])
	}

	async getMany<X extends V = V>(keys: string[]) {
		keys = keys.map(key => this.#prefixer.prefix(key))
		return (await this.#magazine.get(keys)).map(value =>
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
		return this.get(key) !== undefined
	}

	async *entries<X extends V = V>(scan: Scan = {}) {
		scan = this.#prefixer.scan(scan)

		for await (const [key, value] of this.#magazine.entries(scan))
			yield [this.#prefixer.unprefix(key), JSON.parse(value)] as [string, X]
	}

	async clear(scan: Scan = {}) {
		const keys: string[] = []

		for await (const [key] of this.entries(scan))
			keys.push(key)

		for (const chunk of chunks(this.#options.chunkSize, keys))
			await this.write(chunk.map(key => this.tx.delete(key)))
	}
}

