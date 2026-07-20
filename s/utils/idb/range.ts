
import {is} from "@e280/stz"
import {Scan} from "../../types.js"

export function idbRange({start, end}: Scan) {
	if (is.happy(start) && is.happy(end)) return IDBKeyRange.bound(start, end, false, true)
	if (is.happy(start)) return IDBKeyRange.lowerBound(start, false)
	if (is.happy(end)) return IDBKeyRange.upperBound(end, true)
}

