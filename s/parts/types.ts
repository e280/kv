
export type Maker<V> = () => (V | Promise<V>)

export type Options = {
	scopes: string[]
	divisor: string
	delimiter: string
	chunkSize: number
}

export type Scan = {
	start?: string
	end?: string
	limit?: number
}

export type Write = [string, string | undefined]

