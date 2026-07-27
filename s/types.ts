
export type Value = unknown
export type Pair<V> = [key: string, value: V]
export type Op<V> = [key: string, value: V | undefined]

export type Magazine = {
	commit(ops: Op<Value>[]): Promise<void>
	getMany(keys: string[]): Promise<(Value | undefined)[]>
	entries(scan?: Scan): AsyncIterable<Pair<Value>>
}

export type Scan = {
	limit?: number
	reverse?: boolean

	/** inclusive */
	start?: string

	/** exclusive */
	end?: string
}

export type Codec = {
	encode(value: Value): string
	decode<X = Value>(text: string): X | undefined
}

export type Options = {

	/** force values to be json-compatible clones */
	strict: boolean

	/** namespace for prefixing keys */
	scopes: string[]
}

export type LevelLike = {
	batch(commands: ({type: "put", key: string, value: string} | {type: "del", key: string})[]): Promise<void>
	getMany(keys: string[]): Promise<(string | undefined)[]>
	iterator(o: {gte?: string, lt?: string, limit?: number, reverse?: boolean}): AsyncIterable<[string, string]>
}

