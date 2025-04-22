
import {Suite, expect} from "cynic"

import {Kv} from "./kv.js"
import {collect} from "./parts/collect.js"

export default <Suite>{
	async "access string"() {
		const kv = new Kv()
		await kv.put("hello", "world")
		expect(await kv.get("hello")).equals("world")
	},

	async "access number"() {
		const kv = new Kv()
		await kv.put("hello", 123)
		expect(await kv.get("hello")).equals(123)
	},

	"key iterations": {
		async "basic iteration"() {
			const kv = new Kv()
			await kv.puts(["record:1", 1], ["record:2", 2], ["record:3", 3], ["record:4", 4])
			const keys = await collect(kv.keys())
			expect(keys.length).equals(4)
		},
		async "start/end"() {
			const kv = new Kv()
			await kv.puts(["record:1", 1], ["record:2", 2], ["record:3", 3], ["record:4", 4])
			const keys = await collect(kv.keys({start: "record:2", end: "record:3"}))
			expect(keys.length).equals(2)
			expect(keys[0]).equals("record:2")
		},
		async "limit"() {
			const kv = new Kv()
			await kv.puts(["record:1", 1], ["record:2", 2], ["record:3", 3], ["record:4", 4])
			const keys = await collect(kv.keys({limit: 2}))
			expect(keys.length).equals(2)
			expect(keys[0]).equals("record:1")
		},
		async "iterate on namespace"() {
			const kv = new Kv()
			await kv.put("bad", true)
			const sub = kv.namespace("good")
			await sub.put("1", true)
			await sub.put("2", true)
			const keys = await collect(sub.keys())
			console.log(keys)
			expect(keys.length).equals(2)
			expect(keys.includes("1")).ok()
			expect(keys.includes("2")).ok()
			expect(keys.includes("bad")).not.ok()
		},
	},

	"entry iterations": {
		async "basic iteration"() {
			const kv = new Kv()
			await kv.puts(["record:1", 1], ["record:2", 2], ["record:3", 3], ["record:4", 4])
			const entries = await collect(kv.entries())
			expect(entries.length).equals(4)
		},
		async "start/end"() {
			const kv = new Kv()
			await kv.puts(["record:1", 1], ["record:2", 2], ["record:3", 3], ["record:4", 4])
			const entries = await collect(kv.entries({start: "record:2", end: "record:3"}))
			expect(entries.length).equals(2)
			expect(entries[0][0]).equals("record:2")
			expect(entries[0][1]).equals(2)
		},
		async "limit"() {
			const kv = new Kv()
			await kv.puts(["record:1", 1], ["record:2", 2], ["record:3", 3], ["record:4", 4])
			const entries = await collect(kv.entries({limit: 2}))
			expect(entries.length).equals(2)
			expect(entries[0][0]).equals("record:1")
			expect(entries[0][1]).equals(1)
		},
	},

	"namespaces": {
		async "namespace"() {
			const kv = new Kv()
			const sub = kv.namespace("a.b")
			await sub.put("hello", 123)
			expect(await sub.get("hello")).equals(123)
			expect(await kv.get("a.b:hello")).equals(123)
		},

		async "sub namespace"() {
			const kv = new Kv()
			const subsub = kv.namespace("a.b").namespace("c")
			await subsub.put("hello", 123)
			expect(await subsub.get("hello")).equals(123)
			expect(await kv.get("a.b.c:hello")).equals(123)
		},

		async "sub namespace key iteration"() {
			const kv = new Kv()
			const subsub = kv.namespace("a.b").namespace("c")
			await subsub.put("123", true)
			const [key] = await collect(subsub.keys())
			expect(key).equals("123")
		},
	},

	async "write transaction"() {
		const kv = new Kv()
		await kv.put("hello", "world")
		await kv.transaction(tn => [
			tn.put("alpha", "bravo"),
			tn.del("hello"),
		])
		expect(await kv.get("hello")).equals(undefined)
		expect(await kv.get("alpha")).equals("bravo")
	},

	async "multi-tier transaction"() {
		const kv = new Kv()
		const subsub = kv.namespace("a.b").namespace("c")
		await kv.transaction(tn => [
			tn.put("alpha", "bravo"),
			subsub.write.put("charlie", "delta"),
		])
		expect(await kv.get("alpha")).equals("bravo")
		expect(await subsub.get("charlie")).equals("delta")
		expect(await kv.get("a.b.c:charlie")).equals("delta")
	},
}

