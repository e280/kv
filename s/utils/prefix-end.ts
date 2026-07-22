
export function prefixEnd(prefix: string) {
	for (let index = prefix.length - 1; index >= 0; index--) {
		const code = prefix.charCodeAt(index)

		if (code < 0xFFFF) {
			return (
				prefix.slice(0, index) +
				String.fromCharCode(code + 1)
			)
		}
	}

	return undefined
}

