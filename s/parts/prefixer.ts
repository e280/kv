
import {Options, Scan} from "./types.js"

export class Prefixer {
	#prefix: string | undefined

	constructor(options: Options) {
		const {prefix, divisor, delimiter} = options
		this.#prefix = prefix.length > 0
			? prefix.join(divisor) + delimiter
			: undefined
	}

	prefix = (key: string) => {
		return this.#prefix
			? this.#prefix + key
			: key
	}

	unprefix = (fullkey: string) => {
		const start = this.#prefix ? this.#prefix.length : 0
		return fullkey.slice(start)
	}

	scan = (scan: Scan) => {
		const {limit} = scan
		const start = this.#prefix
			? this.#prefix + (scan.start ?? "")
			: scan.start
		const end = this.#prefix
			? this.#prefix + (scan.end ?? "\xFF")
			: scan.end
		return {limit, start, end}
	}
}

