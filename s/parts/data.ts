
export const Data = {
	parse: <V>(s: string) => JSON.parse(s) as V,
	stringify: <V>(v: V) => JSON.stringify(v),
}

