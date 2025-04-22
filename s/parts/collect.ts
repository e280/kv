
export async function collect<X>(generator: AsyncGenerator<X, any, any>) {
	const array: X[] = []
	for await (const item of generator)
		array.push(item)
	return array
}

