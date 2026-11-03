
export async function opfsDestroy(
		name: string,
		parent?: FileSystemDirectoryHandle,
	) {

	parent ??= await navigator.storage
		.getDirectory()

	return parent
		.removeEntry(name, {recursive: true})
}

