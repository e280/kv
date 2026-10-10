
import {isHappy} from "@e280/stz"
import {Scan} from "../../types.js"

export function idbRange({start, end}: Scan) {
	if (isHappy(start) && isHappy(end)) return IDBKeyRange.bound(start, end, false, true)
	if (isHappy(start)) return IDBKeyRange.lowerBound(start, false)
	if (isHappy(end)) return IDBKeyRange.upperBound(end, true)
}

