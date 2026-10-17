
import {need} from "@e280/stz"
import {Kv} from "./kv.js"
import {Op} from "./types.js"
import {Cell} from "./cell.js"

export async function migrate(
		latestVersion: number,
		kv: Kv,
		versionCell: Cell<number>,
		migrators: [v: number, fn: (op: (...o: Op[]) => void) => Promise<void>][],
	) {

	const map = new Map(migrators)
	const version = (await versionCell.get()) ?? 0

	if (version === latestVersion)
		return

	if (version > latestVersion)
		throw new Error("unknown version")

	for (let v = version; v < latestVersion; v++) {
		const ops: Op[] = []
		const migrator = need(map, v)
		await migrator((...o) => ops.push(...o))
		ops.push(versionCell.op.set(v + 1))
		await kv.commit(ops)
	}
}

