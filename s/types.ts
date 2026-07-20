
export type Pair<V> = [key: string, value: V]
export type Change<V> = [key: string, value: V | undefined]

export type Magazine = {
	commit(changes: Change<string>[]): Promise<void>
	getMany(keys: string[]): Promise<(string | undefined)[]>
	entries(scan?: Scan): AsyncIterable<Pair<string>>
}

export type Scan = {
	start?: string
	end?: string
	limit?: number
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
	getMany(keys: string[]): Promise<string[]>
	iterator(o: {gte?: string, lte?: string, limit?: number}): AsyncIterable<[string, string]>
}

