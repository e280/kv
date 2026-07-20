
import {Scan} from "../types.js"

export function scanMatch(key: string, {start, end}: Scan) {
	if (start !== undefined && key < start) return false
	if (end !== undefined && key >= end) return false
	return true
}

