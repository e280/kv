
import {got} from "@e280/stz"
import {Store} from "./store.js"
import {Changer} from "./utils/changer.js"
import {Prefixer} from "./utils/prefixer.js"
import {JsonCodec} from "./utils/json-codec.js"
import {MemoryMagazine} from "./magazines/memory.js"
import {Magazine, Change, Options, Scan, Pair} from "./types.js"

export class Kv<V = unknown> {
	x
	#magazine
	#prefixer
	#options: Options

	constructor(magazine: Magazine = new MemoryMagazine(), options: Partial<Options> = {}) {
		this.#magazine = magazine
		this.#options = {
			codec: new JsonCodec(),
			scopes: [],
			divisor: ".",
			delimiter: ":",
			...options,
		}
		this.#prefixer = new Prefixer(this.#options)
		this.x = new Changer<V>(this.#prefixer)
	}

	/** create a store which can set or get on a single key */
	store<X extends V = V>(key: string) {
		return new Store<X>(this, key)
	}

	/** create a sub kv where all keys inherit a prefix */
	scope<X = unknown>(scope: string, delimiter = this.#options.delimiter) {
		const scopes = [...this.#options.scopes, scope]
		return new Kv<X>(this.#magazine, {...this.#options, delimiter, scopes})
	}

	/** no delimiter means all sub namespaces are accessible */
	crush() {
		return new Kv<V>(this.#magazine, {...this.#options, delimiter: ""})
	}

	async commit(changes: Change<V>[]) {
		await this.#magazine.commit(
			changes.map(([key, value]) => [key, this.#options.codec.encode(value)])
		)
	}

	async set<X extends V = V>(key: string, value: X | undefined) {
		return this.commit([this.x.set(key, value)])
	}

	async delete(key: string) {
		return this.commit([this.x.delete(key)])
	}

	async getMany<X extends V = V>(keys: string[]) {
		keys = keys.map(key => this.#prefixer.prefix(key))
		return (await this.#magazine.getMany(keys)).map(value =>
			(value === undefined)
				? undefined
				: this.#options.codec.decode(value) as X
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
			yield [this.#prefixer.unprefix(key), this.#options.codec.decode(value)] as Pair<X>
	}

	[Symbol.asyncIterator]() {
		return this.entries()
	}

	async* keys(scan: Scan = {}) {
		for await (const [key] of this.entries(scan))
			yield key
	}

	async* values<X extends V = V>(scan: Scan = {}) {
		for await (const [, value] of this.entries(scan))
			yield value as X
	}

	async count(scan: Scan = {}) {
		let count = 0
		for await (const _ of this.keys(scan)) count++
		return count
	}

	async clear(scan: Scan = {}) {
		let changes: Change<V>[] = []

		for await (const [key] of this.entries(scan)) {
			changes.push(this.x.delete(key))
			if (changes.length >= 1024) {
				await this.commit(changes)
				changes = []
			}
		}

		if (changes.length)
			await this.commit(changes)
	}
}

