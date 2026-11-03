
export async function opfsDirectory(
		name: string,
		parent?: FileSystemDirectoryHandle,
	) {

	parent ??= await navigator.storage
		.getDirectory()

	return parent
		.getDirectoryHandle(name, {create: true})
}

