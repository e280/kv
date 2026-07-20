
export type Pair<V> = [key: string, value: V]
export type Change<V> = [key: string, value: V | undefined]

export type Magazine = {
	commit(changes: Change<string>[]): Promise<void>
	getMany(keys: string[]): Promise<(string | undefined)[]>
	entries(scan?: Scan): AsyncIterable<Pair<string>>
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
	encode(value: unknown): string
	decode<X = unknown>(text: string): X
}

export type Options = {
	codec: Codec
	scopes: string[]
	divisor: string
	delimiter: string
}

export type LevelLike = {
	batch(commands: ({type: "put", key: string, value: string} | {type: "del", key: string})[]): Promise<void>
	getMany(keys: string[]): Promise<(string | undefined)[]>
	iterator(o: {gte?: string, lt?: string, limit?: number, reverse?: boolean}): AsyncIterable<[string, string]>
}

