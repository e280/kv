
import {Codec} from "../types.js"

export class JsonCodec implements Codec {
	encode = (value: unknown) => JSON.stringify(value)
	decode = <X>(text: string): X => JSON.parse(text)
}

