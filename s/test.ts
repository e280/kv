
import {collect} from "@e280/stz"
import {science, suite, test, expect} from "@e280/science"

import {Kv} from "./kv.js"

await science.run({
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
			const kv = new Kv<{a: number}>()
			await kv.set("hello", {a: 1})
			const obj = await kv.need("hello")
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

		"commit undefined": test(async() => {
			const kv = new Kv<string>()
			await kv.set("alpha", "ok")
			await kv.set("bravo", "ok")
			expect(await kv.get("alpha")).is("ok")
			expect(await kv.get("bravo")).is("ok")
			await kv.commit([
				kv.x.delete("alpha"),
				kv.x.delete("bravo"),
			])
			expect(await kv.get("alpha")).is(undefined)
			expect(await kv.get("bravo")).is(undefined)
			expect(await kv.has("alpha")).is(false)
			expect(await kv.has("bravo")).is(false)
		}),
	}),

	"memory magazine": suite({
		"returned objects are clones": test(async() => {
			const kv = new Kv<{a: number}>()
			await kv.set("hello", {a: 1})

			const alpha = await kv.need("hello")
			expect(alpha.a).is(1)
			alpha.a = 2
			expect(alpha.a).is(2)

			const bravo = await kv.need("hello")
			expect(bravo.a).is(1)
		}),
	}),

	"iterate": suite({
		"basic": test(async() => {
			const kv = new Kv()
			await kv.commit([kv.x.set("1", 1), kv.x.set("2", 2), kv.x.set("3", 3), kv.x.set("4", 4)])
			expect((await collect(kv)).length).is(4)
		}),

		"start/end": test(async() => {
			const kv = new Kv()
			await kv.commit([kv.x.set("1", 1), kv.x.set("2", 2), kv.x.set("3", 3), kv.x.set("4", 4)])
			const keys = await collect(kv.keys({start: "2", end: "4"}))
			expect(keys.length).is(2)
			expect(keys[0]).is("2")
			expect(keys[1]).is("3")
		}),

		"limit": test(async() => {
			const kv = new Kv()
			await kv.commit([kv.x.set("1", 1), kv.x.set("2", 2), kv.x.set("3", 3), kv.x.set("4", 4)])
			const keys = await collect(kv.keys({limit: 2}))
			expect(keys.length).is(2)
			expect(keys[0]).is("1")
			expect(await kv.count({limit: 2})).is(2)
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
			expect((await collect(kv.keys())).includes("1")).not.ok()
		}),
	}),

	"scope": suite({
		"level one": test(async() => {
			const kv = new Kv()
			const sub = kv.scope("a")
			await sub.set("hello", 123)
			expect(await sub.get("hello")).is(123)
			expect(await kv.crush().get("a:hello")).is(123)
		}),

		"level two": test(async() => {
			const kv = new Kv()
			const subsub = kv.scope("a").scope("b")
			await subsub.set("hello", 123)
			expect(await subsub.get("hello")).is(123)
			expect(await kv.crush().get("a.b:hello")).is(123)
		}),

		"empty string still creates empty segments": test(async() => {
			const kv = new Kv()
			const sub1 = kv.scope("")
			await sub1.set("hello", 123)
			expect(await sub1.get("hello")).is(123)
			expect(await kv.crush().get(":hello")).is(123)
			const sub2 = kv.scope("").scope("")
			await sub2.set("hello", 123)
			expect(await sub2.get("hello")).is(123)
			expect(await kv.crush().get(".:hello")).is(123)
		}),

		"crush to wipe namespace": test(async() => {
			const kv = new Kv()
			const a = kv.scope("a")
			const aFlat = kv.scope("a").crush()
			const b = a.scope("b")
			await b.set("hello", 123)
			expect(await b.get("hello")).is(123)
			await aFlat.clear()
			expect(await b.get("hello")).is(undefined)
		}),

		"sub iterate keys": test(async() => {
			const kv = new Kv()
			const subsub = kv.scope("a").scope("b")
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
			expect((await collect(kv.crush())).length).is(2)
			await bravo.clear()
			expect((await collect(kv.crush())).length).is(1)
			expect((await collect(alpha.keys()))[0]).is("hello1")
		}),

		"parent clear doesn't ruin child": test(async() => {
			const kv = new Kv()
			const alpha = kv.scope("alpha")
			const bravo = alpha.scope("bravo")
			await alpha.set("hello1", 1)
			await bravo.set("hello2", 2)
			expect((await collect(alpha)).length).is(1)
			await alpha.clear()
			expect((await collect(alpha)).length).is(0)
			expect((await collect(bravo)).length).is(1)
			expect((await collect(bravo.keys()))[0]).is("hello2")
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

	"batch commits": suite({
		"write set/del": test(async() => {
			const kv = new Kv()
			await kv.set("hello", "world")
			await kv.commit([
				kv.x.set("alpha", "bravo"),
				kv.x.delete("hello"),
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
			await kv.commit([
				kv.x.set("alpha", undefined),
				kv.x.set("bravo", undefined),
			])
			expect(await kv.get("alpha")).is(undefined)
			expect(await kv.get("bravo")).is(undefined)
		}),

		"multi-tier": test(async() => {
			const kv = new Kv()
			const subsub = kv.scope("a").scope("b")
			await kv.commit([
				kv.x.set("alpha", "bravo"),
				subsub.x.set("charlie", "delta"),
			])
			expect(await kv.get("alpha")).is("bravo")
			expect(await subsub.get("charlie")).is("delta")
			expect(await kv.count()).is(1)
			expect(await subsub.count()).is(1)
		}),
	}),
})

