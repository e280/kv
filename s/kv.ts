
import {got} from "@e280/stz"
import {Cell} from "./cell.js"
import {consts} from "./consts.js"
import {Subtree} from "./subtree.js"
import {Operator} from "./utils/operator.js"
import {Prefixer} from "./utils/prefixer.js"
import {JsonCodec} from "./utils/json-codec.js"
import {MemoryMagazine} from "./magazines/memory.js"
import {validateScan} from "./utils/validate-scan.js"
import {validateScopes} from "./utils/validate-scopes.js"
import {Magazine, Op, Options, Scan, Pair} from "./types.js"

export class Kv<V = unknown> {

	/** facility for writing operations that could be committed. */
	readonly op

	/** methods that can access all entries under this scope, including child scopes. */
	readonly subtree

	#magazine
	#prefixer
	#options: Options

	constructor(
			magazine: Magazine = new MemoryMagazine(),
			options: Partial<Options> = {},
		) {
		this.#magazine = magazine
		this.#options = {
			codec: new JsonCodec(),
			scopes: [],
			...options,
		}
		validateScopes(this.#options.scopes)
		this.#prefixer = new Prefixer(this.#options)
		this.op = new Operator<V>(this.#prefixer)
		this.subtree = new Subtree(this.#magazine, this.#options.scopes)
	}

	/** create a cell which can set or get on a single key */
	cell<X extends V = V>(key: string) {
		return new Cell<X>(this, key)
	}

	/** create a sub kv where all keys inherit a prefix */
	scope<X = unknown>(...scopes: string[]) {
		return new Kv<X>(this.#magazine, {
			...this.#options,
			scopes: [...this.#options.scopes, ...scopes],
		})
	}

	async commit(ops: Op<V>[]) {
		await this.#magazine.commit(
			ops.map(([key, value]) => [key, (
				(value === undefined)
					? undefined
					: this.#options.codec.encode(value)
			)])
		)
	}

	async set<X extends V = V>(key: string, value: X | undefined) {
		return this.commit([this.op.set(key, value)])
	}

	async setMany<X extends V = V>(...changes: [key: string, value: X | undefined][]) {
		return this.commit(changes.map(([key, value]) => this.op.set(key, value)))
	}

	async delete(...keys: string[]) {
		return this.commit(keys.map(key => this.op.delete(key)))
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

	/** throw if the value is undefined or null */
	async need<X extends V = V>(key: string) {
		return got(await this.get<X>(key), `key not found "${key}"`)
	}

	/** throw if the value is undefined or null */
	async needMany<X extends V = V>(keys: string[]) {
		const values = await this.getMany<X>(keys)
		for (const [index, key] of keys.entries())
			got(values[index], `key not found "${key}"`)
		return values as X[]
	}

	async* entries<X extends V = V>(scan: Scan = {}) {
		scan = validateScan(this.#prefixer.scan(scan))

		for await (const [key, value] of this.#magazine.entries(scan)) {
			const key2 = this.#prefixer.unprefix(key)
			const value2 = this.#options.codec.decode<X>(value)
			if (value2 !== undefined)
				yield [key2, value2] as Pair<X>
		}
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
		let changes: Op<V>[] = []

		for await (const [key] of this.entries(scan)) {
			changes.push(this.op.delete(key))
			if (changes.length >= consts.chunkSize) {
				await this.commit(changes)
				changes = []
			}
		}

		if (changes.length)
			await this.commit(changes)
	}
}

