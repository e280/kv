
import {Scan} from "../types.js"

export function validateScan(scan: Scan) {
	const limit = scan.limit

	if (limit !== undefined) {
		if (!Number.isInteger(limit))
			throw new Error("scan limit must be integer")

		if (limit < 0)
			throw new Error("scan limit must be positive")
	}

	return scan
}

