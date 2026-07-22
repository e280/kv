
import {consts} from "./consts.js"
import {Magazine, Op, Scan} from "./types.js"
import {prefixEnd} from "./utils/prefix-end.js"

export class Subtree {
	#magazine
	#scans: Scan[] = [{}]

	constructor(magazine: Magazine, scopes: string[]) {
		this.#magazine = magazine

		if (scopes.length) {
			const pre = scopes.join(consts.divisor)
			const divised = pre + "."
			const delimited = pre + ":"
			this.#scans = [
				{start: delimited, end: prefixEnd(delimited)},
				{start: divised, end: prefixEnd(divised)},
			]
		}
	}

	async count() {
		let count = 0

		for (const scan of this.#scans) {
			for await (const _ of this.#magazine.entries(scan))
				count++
		}

		return count
	}

	async clear() {
		let changes: Op<string>[] = []

		for (const scan of this.#scans) {
			for await (const [key] of this.#magazine.entries(scan)) {
				changes.push([key, undefined])
				if (changes.length >= 1024) {
					await this.#magazine.commit(changes)
					changes = []
				}
			}
		}

		if (changes.length)
			await this.#magazine.commit(changes)
	}
}

