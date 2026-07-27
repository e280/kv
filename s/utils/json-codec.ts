
import {Codec, Value} from "../types.js"

export class JsonCodec implements Codec {
	encode = (value: Value) => JSON.stringify(value)
	decode = <X>(text: string): X | undefined => {
		try { return JSON.parse(text) }
		catch { return undefined }
	}
}

