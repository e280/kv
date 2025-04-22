
export function* chunks<T>(size: number, arr: T[]): Generator<T[]> {
	if (size <= 0) throw new Error("chunk size must be greater than zero")
	for (let i = 0; i < arr.length; i += size)
		yield arr.slice(i, i + size)
}

