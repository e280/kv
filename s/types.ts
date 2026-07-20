
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

export type Options = {
	scopes: string[]
	divisor: string
	delimiter: string
	chunkSize: number
}

export type LevelLike = {
	batch(commands: ({type: "put", key: string, value: string} | {type: "del", key: string})[]): Promise<void>
	getMany(keys: string[]): Promise<string[]>
	iterator(o: {gte?: string, lte?: string, limit?: number}): AsyncIterable<[string, string]>
}

