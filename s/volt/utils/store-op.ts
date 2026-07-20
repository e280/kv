
import {Op} from "./op.js"

export class StoreOp<V = unknown> {
	tx

	constructor(tx: Op<V>, public key: string) {
		this.tx = tx
	}

	set<X extends V = V>(value: X | undefined) {
		return this.tx.set(this.key, value)
	}
}

