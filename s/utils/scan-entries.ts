
import {Scan} from "../types.js"
import {lexSort} from "./lex-sort.js"
import {scanMatch} from "./scan-match.js"

export function* scanEntries(scan: Scan, entries: [string, string][]) {
	if (scan.limit === 0)
		return

	const matches = entries
		.filter(([key]) => scanMatch(key, scan))
		.sort(([a], [b]) => lexSort(a, b))

	if (scan.reverse)
		matches.reverse()

	yield* matches.slice(0, scan.limit ?? Infinity)
}

