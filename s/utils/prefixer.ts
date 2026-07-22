
import {consts} from "../consts.js"
import {Options, Scan} from "../types.js"
import {prefixEnd} from "./prefix-end.js"

const {divisor, delimiter} = consts

export class Prefixer {
	#prefix: string
	#end: string | undefined

	constructor(options: Options) {
		const {scopes} = options
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

