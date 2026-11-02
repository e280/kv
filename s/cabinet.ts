
import {idbOpen, IdbMagazine, Kv} from "@e280/kv"
import {idbWait} from "./idb/wait.js"

export type Cabinet = Awaited<ReturnType<typeof makeCabinet>>

export async function makeCabinet(prefix: string) {
	const directory = await navigator.storage
		.getDirectory()
		.then(d => d.getDirectoryHandle(prefix, {create: true}))

	const idb = await idbOpen(prefix, "store")
	const kv = new Kv(new IdbMagazine(idb))

	async function destroy() {
		idb.db.close()
		await idbWait(indexedDB.deleteDatabase(prefix))
		await navigator.storage
			.getDirectory()
			.then(d => d.removeEntry(prefix, {recursive: true}))
	}

	return {kv, directory, idb, destroy}
}

