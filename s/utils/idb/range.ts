
import {Scan} from "../../types.js"

export function idbRange({start, end}: Scan) {
	if (start && end) return IDBKeyRange.bound(start, end)
	if (start) return IDBKeyRange.lowerBound(start)
	if (end) return IDBKeyRange.upperBound(end)
}

