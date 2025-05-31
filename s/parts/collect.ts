
export async function collect<X>(iterable: AsyncIterable<X>) {
	const array: X[] = []
	for await (const item of iterable) array.push(item)
	return array
}

