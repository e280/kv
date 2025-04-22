
import {Scan, Write} from "./types.js"

export abstract class Core {
	abstract gets(...keys: string[]): Promise<(string | undefined)[]>
	abstract hasKeys(...keys: string[]): Promise<boolean[]>
	abstract keys(scan?: Scan): AsyncGenerator<string>
	abstract entries(scan?: Scan): AsyncGenerator<[string, string]>
	abstract transaction(...writes: Write[]): Promise<void>
}

