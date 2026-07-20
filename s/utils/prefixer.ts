
import {Options, Scan} from "../types.js"

export class Prefixer {
	#prefix: string
	#end: string | undefined

	constructor(options: Options) {
		const {scopes, divisor, delimiter} = options
		this.#prefix = scopes.join(divisor) + delimiter
		this.#end = prefixEnd(this.#prefix)
	}

	prefix = (key: string) => {
		return this.#prefix + key
	}

	unprefix = (fullkey: string) => {
		return fullkey.slice(this.#prefix.length)
	}

	scan = (scan: Scan): Scan => {
		const {start, end, limit, reverse} = scan

		return {
			start: this.#prefix + (start ?? ""),
			end: end === undefined
				? this.#end
				: this.#prefix + end,
			limit,
			reverse,
		}
	}
}

function prefixEnd(prefix: string) {
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

