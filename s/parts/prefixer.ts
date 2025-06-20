
import {Options, Scan} from "./types.js"

export class Prefixer {
	#prefix: string

	constructor(options: Options) {
		const {scopes, divisor, delimiter} = options
		this.#prefix = scopes.length > 0
			? scopes.join(divisor) + delimiter
			: ""
	}

	prefix = (key: string) => {
		return this.#prefix + key
	}

	unprefix = (fullkey: string) => {
		const start = this.#prefix.length
		return fullkey.slice(start)
	}

	scan = (scan: Scan) => {
		const {limit} = scan
		const start = this.#prefix + (scan.start ?? "")
		const end = this.#prefix + (scan.end ?? "\xFF")
		return {limit, start, end}
	}
}

