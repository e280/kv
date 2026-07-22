
import {happy} from "@e280/stz"
import {Scan} from "../../types.js"

export function idbRange({start, end}: Scan) {
	if (happy(start) && happy(end)) return IDBKeyRange.bound(start, end, false, true)
	if (happy(start)) return IDBKeyRange.lowerBound(start, false)
	if (happy(end)) return IDBKeyRange.upperBound(end, true)
}

