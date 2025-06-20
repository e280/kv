
import {Science, suite, test, expect} from "@e280/science"

import {Kv} from "./kv.js"
import {collect} from "./parts/collect.js"

await Science.run({
	"access": suite({
		"string": test(async() => {
			const kv = new Kv()
			await kv.set("hello", "world")
			expect(await kv.get("hello")).is("world")
		}),

		"number": test(async() => {
			const kv = new Kv()
			await kv.set("hello", 123)
			expect(await kv.get("hello")).is(123)
		}),

		"object": test(async() => {
			const kv = new Kv()
			await kv.set("hello", {a: 1})
			const obj = await kv.get("hello")
			expect(obj).ok()
			expect(obj.a).is(1)
		}),

		"not found is undefined": test(async() => {
			const kv = new Kv()
			expect(await kv.get("hello")).is(undefined)
		}),

		"set undefined": test(async() => {
			const kv = new Kv<string>()
			await kv.set("hello", "world")
			expect(await kv.get("hello")).is("world")
			await kv.set("hello", undefined)
			expect(await kv.get("hello")).is(undefined)
			expect(await kv.has("hello")).is(false)
		}),

		"sets undefined": test(async() => {
			const kv = new Kv<string>()
			await kv.set("alpha", "ok")
			await kv.set("bravo", "ok")
			expect(await kv.get("alpha")).is("ok")
			expect(await kv.get("bravo")).is("ok")
			await kv.sets(
				["alpha", undefined],
				["bravo", undefined],
			)
			expect(await kv.get("alpha")).is(undefined)
			expect(await kv.get("bravo")).is(undefined)
			expect(await kv.has("alpha")).is(false)
			expect(await kv.has("bravo")).is(false)
		}),
	}),

	"mem driver": suite({
		"returned objects are clones": test(async() => {
			const kv = new Kv()
			await kv.set("hello", {a: 1})

			const alpha = await kv.get("hello")
			expect(alpha.a).is(1)
			alpha.a = 2
			expect(alpha.a).is(2)

			const bravo = await kv.get("hello")
			expect(bravo.a).is(1)
		}),
	}),

	"iterate": suite({
		"keys": suite({
			"basic": test(async() => {
				const kv = new Kv()
				await kv.sets(["record:1", 1], ["record:2", 2], ["record:3", 3], ["record:4", 4])
				const keys = await collect(kv.keys())
				expect(keys.length).is(4)
			}),
			"start/end": test(async() => {
				const kv = new Kv()
				await kv.sets(["record:1", 1], ["record:2", 2], ["record:3", 3], ["record:4", 4])
				const keys = await collect(kv.keys({start: "record:2", end: "record:3"}))
				expect(keys.length).is(2)
				expect(keys[0]).is("record:2")
			}),
			"limit": test(async() => {
				const kv = new Kv()
				await kv.sets(["record:1", 1], ["record:2", 2], ["record:3", 3], ["record:4", 4])
				const keys = await collect(kv.keys({limit: 2}))
				expect(keys.length).is(2)
				expect(keys[0]).is("record:1")
			}),
			"on scope": test(async() => {
				const kv = new Kv()
				await kv.set("bad", true)
				const sub = kv.scope("good")
				await sub.set("1", true)
				await sub.set("2", true)
				const keys = await collect(sub.keys())
				expect(keys.length).is(2)
				expect(keys.includes("1")).ok()
				expect(keys.includes("2")).ok()
				expect(keys.includes("bad")).not.ok()
			}),
		}),

		"entries": suite({
			"basic": test(async() => {
				const kv = new Kv()
				await kv.sets(["record:1", 1], ["record:2", 2], ["record:3", 3], ["record:4", 4])
				const entries = await collect(kv.entries())
				expect(entries.length).is(4)
			}),
			"start/end": test(async() => {
				const kv = new Kv()
				await kv.sets(["record:1", 1], ["record:2", 2], ["record:3", 3], ["record:4", 4])
				const entries = await collect(kv.entries({start: "record:2", end: "record:3"}))
				expect(entries.length).is(2)
				expect(entries[0][0]).is("record:2")
				expect(entries[0][1]).is(2)
			}),
			"limit": test(async() => {
				const kv = new Kv()
				await kv.sets(["record:1", 1], ["record:2", 2], ["record:3", 3], ["record:4", 4])
				const entries = await collect(kv.entries({limit: 2}))
				expect(entries.length).is(2)
				expect(entries[0][0]).is("record:1")
				expect(entries[0][1]).is(1)
			}),
		}),

		"values": suite({
			"basic": test(async() => {
				const kv = new Kv()
				await kv.sets(["record:1", 1], ["record:2", 2], ["record:3", 3], ["record:4", 4])
				const values = await collect(kv.values())
				expect(values.length).is(4)
				expect(values[0]).is(1)
				expect(values[1]).is(2)
				expect(values[2]).is(3)
				expect(values[3]).is(4)
			}),
		}),
	}),

	"scope": suite({
		"access": test(async() => {
			const kv = new Kv()
			const sub = kv.scope("a.b")
			await sub.set("hello", 123)
			expect(await sub.get("hello")).is(123)
			expect(await kv.get("a.b:hello")).is(123)
		}),

		"empty string still creates empty segments": test(async() => {
			const kv = new Kv()
			const sub1 = kv.scope("")
			await sub1.set("hello", 123)
			expect(await sub1.get("hello")).is(123)
			expect(await kv.get(":hello")).is(123)
			const sub2 = kv.scope("").scope("")
			await sub2.set("hello", 123)
			expect(await sub2.get("hello")).is(123)
			expect(await kv.get(".:hello")).is(123)
		}),

		"sub access": test(async() => {
			const kv = new Kv()
			const subsub = kv.scope("a.b").scope("c")
			await subsub.set("hello", 123)
			expect(await subsub.get("hello")).is(123)
			expect(await kv.get("a.b.c:hello")).is(123)
		}),

		"empty delimiter to wipe entire namespace": test(async() => {
			const kv = new Kv()
			const a = kv.scope("a")
			const aFlat = kv.scope("a", "")
			const b = a.scope("b")
			await b.set("hello", 123)
			expect(await b.get("hello")).is(123)
			expect(await kv.get("a.b:hello")).is(123)
			await aFlat.clear()
			expect(await b.get("hello")).is(undefined)
		}),

		"flatten for empty delimiter to wipe namespace": test(async() => {
			const kv = new Kv()
			const a = kv.scope("a")
			const aFlat = kv.scope("a").flatten()
			const b = a.scope("b")
			await b.set("hello", 123)
			expect(await b.get("hello")).is(123)
			expect(await kv.get("a.b:hello")).is(123)
			await aFlat.clear()
			expect(await b.get("hello")).is(undefined)
		}),

		"sub iterate keys": test(async() => {
			const kv = new Kv()
			const subsub = kv.scope("a.b").scope("c")
			await subsub.set("123", true)
			const [key] = await collect(subsub.keys())
			expect(key).is("123")
		}),

		"localized clear": test(async() => {
			const kv = new Kv()
			const alpha = kv.scope("alpha")
			const bravo = kv.scope("bravo")
			await alpha.set("hello1", 1)
			await bravo.set("hello2", 2)
			expect((await Kv.collect(kv.keys())).length).is(2)
			await bravo.clear()
			expect((await Kv.collect(kv.keys())).length).is(1)
			expect((await Kv.collect(alpha.keys()))[0]).is("hello1")
		}),

		"parent clear doesn't ruin child": test(async() => {
			const kv = new Kv()
			const alpha = kv.scope("alpha")
			const bravo = kv.scope("bravo")
			await alpha.set("hello1", 1)
			await bravo.set("hello2", 2)
			expect((await Kv.collect(kv.keys())).length).is(2)
			await alpha.clear()
			expect((await Kv.collect(kv.keys())).length).is(1)
			expect((await Kv.collect(bravo.keys()))[0]).is("hello2")
		}),

		"no parent/child collisions": test(async() => {
			const kv = new Kv()
			const a = kv.scope("a")
			const b = a.scope("b")
			await a.set("hello1", 1)
			await b.set("hello2", 2)
			const akeys = await collect(a.keys())
			const bkeys = await collect(b.keys())
			expect(akeys.length).is(1)
			expect(bkeys.length).is(1)
			expect(akeys[0]).is("hello1")
			expect(bkeys[0]).is("hello2")
		}),
	}),

	"transaction": suite({
		"write set/del": test(async() => {
			const kv = new Kv()
			await kv.set("hello", "world")
			await kv.transaction(tn => [
				tn.set("alpha", "bravo"),
				tn.del("hello"),
			])
			expect(await kv.get("hello")).is(undefined)
			expect(await kv.get("alpha")).is("bravo")
		}),
		"set undefined": test(async() => {
			const kv = new Kv<string>()
			await kv.set("alpha", "ok")
			await kv.set("bravo", "ok")
			expect(await kv.get("alpha")).is("ok")
			expect(await kv.get("bravo")).is("ok")
			await kv.transaction(tn => [
				tn.set("alpha", undefined),
				tn.set("bravo", undefined),
			])
			expect(await kv.get("alpha")).is(undefined)
			expect(await kv.get("bravo")).is(undefined)
		}),
		"sets undefined": test(async() => {
			const kv = new Kv<string>()
			await kv.set("alpha", "ok")
			await kv.set("bravo", "ok")
			expect(await kv.get("alpha")).is("ok")
			expect(await kv.get("bravo")).is("ok")
			await kv.transaction(tn => [
				tn.sets(
					["alpha", undefined],
					["bravo", undefined],
				),
			])
			expect(await kv.get("alpha")).is(undefined)
			expect(await kv.get("bravo")).is(undefined)
		}),
		"multi-tier": test(async() => {
			const kv = new Kv()
			const subsub = kv.scope("a.b").scope("c")
			await kv.transaction(tn => [
				tn.set("alpha", "bravo"),
				subsub.write.set("charlie", "delta"),
			])
			expect(await kv.get("alpha")).is("bravo")
			expect(await subsub.get("charlie")).is("delta")
			expect(await kv.get("a.b.c:charlie")).is("delta")
		}),
	}),
})

