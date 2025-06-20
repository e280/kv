
import {Data} from "./parts/data.js"
import {Store} from "./parts/store.js"
import {Driver} from "./parts/driver.js"
import {Writer} from "./parts/writer.js"
import {chunks} from "./parts/chunks.js"
import {collect} from "./parts/collect.js"
import {MemDriver} from "./drivers/mem.js"
import {Prefixer} from "./parts/prefixer.js"
import {Maker, Options, Scan, Write} from "./parts/types.js"

export class Kv<V = any> {
	static collect = collect

	write: Writer<V>
	#options: Options
	#prefixer: Prefixer

	constructor(public driver: Driver = new MemDriver(), options: Partial<Options> = {}) {
		this.#options = {
			scopes: [],
			divisor: ".",
			delimiter: ":",
			chunkSize: 10_000,
			...options,
		}
		this.#prefixer = new Prefixer(this.#options)
		this.write = new Writer(this.#prefixer)
	}

	async gets<X extends V = V>(...keys: string[]) {
		const strings = await this.driver.gets(...keys.map(this.#prefixer.prefix))
		return (strings.map(string => string === undefined
			? string
			: Data.parse<V>(string))
		) as (X | undefined)[]
	}

	async get<X extends V = V>(key: string) {
		const [value] = await this.gets(key)
		return value as X | undefined
	}

	async requires<X extends V = V>(...keys: string[]) {
		const values = await this.gets<X>(...keys)
		for (const value of values)
			if (value === undefined)
				throw new Error("required key not found")
		return values as X[]
	}

	async require<X extends V = V>(key: string) {
		const [value] = await this.requires(key)
		return value as X
	}

	async hasKeys(...keys: string[]) {
		return this.driver.hasKeys(...keys.map(this.#prefixer.prefix))
	}

	async has(key: string) {
		const [value] = await this.hasKeys(key)
		return value
	}

	async *keys(scan: Scan = {}) {
		for await (const key of this.driver.keys(this.#prefixer.scan(scan)))
			yield this.#prefixer.unprefix(key)
	}

	async clear(scan: Scan = {}) {
		const keys: string[] = []
		for await (const key of this.keys(scan))
			keys.push(key)
		for (const chunk of chunks(this.#options.chunkSize, keys))
			await this.del(...chunk)
	}

	async *entries<X extends V = V>(scan: Scan = {}) {
		for await (const [key, value] of this.driver.entries(this.#prefixer.scan(scan)))
			yield [this.#prefixer.unprefix(key), Data.parse<V>(value)] as [string, X]
	}

	async *values<X extends V = V>(scan?: Scan) {
		for await (const [,value] of this.entries(scan))
			yield value as X
	}

	async transaction(fn: (write: Writer<V>) => Write[][]) {
		const writes = fn(this.write).flat()
		return this.driver.transaction(...writes)
	}

	async set<X extends V = V>(key: string, value: X | undefined) {
		return this.transaction(w => [w.set(key, value)])
	}

	async sets<X extends V = V>(...entries: [string, X | undefined][]) {
		return this.transaction(w => [w.sets(...entries)])
	}

	async del(...keys: string[]) {
		return this.transaction(w => [w.del(...keys)])
	}

	async guarantee<X extends V = V>(key: string, make: Maker<X>) {
		let value: X | undefined = await this.get(key)
		if (value === undefined) {
			value = await make()
			await this.transaction(w => [w.set(key, value!)])
		}
		return value
	}

	/** helper for performing schema version migrations */
	async versionMigration(
			key: string,
			latest: number,
			fn: (version: number) => Promise<void>,
		) {
		const kv = this as Kv<any>
		let version: number | undefined = (await kv.get<number>(key)) ?? 0
		if (typeof version !== "number")
			version = 0
		if (version === latest)
			return
		await fn(version)
		await kv.set(key, latest)
	}

	/** create a store which can set or get on a single key */
	store<X extends V = V>(key: string) {
		return new Store<X>(this, key)
	}

	/** prefix all keys with a non-listable namespace */
	scope<X extends V = V>(scope: string, delimiter = this.#options.delimiter) {
		return new Kv<X>(this.driver, {
			...this.#options,
			delimiter,
			scopes: [...this.#options.scopes, scope],
		})
	}

	/** create a new Kv with delimiter set to "", thus counting sub-namespaces as accesible entries */
	flatten() {
		return new Kv<V>(this.driver, {
			...this.#options,
			delimiter: "",
		})
	}
}

