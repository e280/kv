
import {Idb} from "./types.js"
import {idbWait} from "./wait.js"

export async function idbDestroy({db, dbName}: Idb) {
	db.close()

	await idbWait(indexedDB.deleteDatabase(dbName))

	await navigator.storage
		.getDirectory()
		.then(d => d.removeEntry(dbName, {recursive: true}))
}

