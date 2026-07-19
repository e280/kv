
import {Tx} from "./tx.js"

export class StoreTx<V = any> {
	tx

	constructor(tx: Tx<V>, public key: string) {
		this.tx = tx
	}

	set<X extends V = V>(value: X | undefined) {
		return this.tx.set(this.key, value)
	}
}

