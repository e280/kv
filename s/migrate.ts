
import {need} from "@e280/stz"
import {Kv} from "./kv.js"
import {Op} from "./types.js"
import {Cell} from "./cell.js"

export async function migrate(
		kv: Kv,
		versionCell: Cell<number>,
		migrators: [v: number, fn: (op: (...o: Op[]) => void) => Promise<void>][],
	) {

	const map = new Map(migrators)
	const latestVersion = migrators.reduce((p, [v]) => Math.max(p, v + 1), 0)
	const version = (await versionCell.get()) ?? 0

	if (map.size !== migrators.length)
		throw new Error("duplicate migrators detected")

	if (!Number.isSafeInteger(version) || version < 0 || version > latestVersion)
		throw new Error(`bad version ${version}`)

	if (version === latestVersion)
		return

	// check that all migrators are present.
	for (let v = 0; v < latestVersion; v++)
		need(map, v, `missing migrator ${v}`)

	// run the migrators.
	for (let v = version; v < latestVersion; v++) {
		const ops: Op[] = []
		const migrator = need(map, v)
		await migrator((...o) => ops.push(...o))
		ops.push(versionCell.op.set(v + 1))
		await kv.commit(ops)
	}
}

