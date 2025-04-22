
import {Scan} from "./types.js"

export function scanMatch(key: string, {start, end}: Scan) {
	if (start && key < start) return false
	if (end && key > end) return false
	return true
}

