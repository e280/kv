
![](https://i.imgur.com/SfYyhtx.png)

# 🪇 kv

**tiny key-value storage library.**  
typescript. node or web. kv can be backed in-memory, leveldb, localstorage, or indexeddb. scoped namespaces and atomic write batches.

my favorite thing about kv is that i can pass scoped and typed `Kv` instances around to my app's components, and they don't have to worry about where the data actually lives. oh, i need to save some stuff? i'll just need a `Kv<Stuff>` for that...

```bash
npm install @e280/kv
```

```ts
import {Kv} from "@e280/kv"
```



## 🪇 kv is easy.
- **make your kv.**
    ```ts
    const kv = new Kv()
    ```
- **set and get stuff.**
    ```ts
    await kv.set("penguins", 123)
      // setting undefined is the same as delete
    ```
    ```ts
    await kv.get("penguins")
      // 123
    ```
- **keys are strings. values can be any json data.**
    ```ts
    await kv.set("hello", {alpha: 123, bravo: ["bingus"]})
    ```
- **commit batches of ops, atomically.**
    ```ts
    await kv.commit([
      kv.op.set("pangolins", 100),
      kv.op.delete("bingus"),
    ])
    ```



## 🪇 plug in your favorite kv magazine.
- **MemoryMagazine *(default),*** ephemeral in-memory storage.  
    > *memory magazine is slow and non-atomic. it's meant for testing.*
    ```ts
    import {Kv, MemoryMagazine} from "@e280/kv"

    const kv = new Kv(new MemoryMagazine())
    ```
- **LevelMagazine,** nodejs on-disk [leveldb](https://github.com/google/leveldb).
    ```ts
    import {Level} from "level"
    import {Kv, LevelMagazine} from "@e280/kv"

    const level = new Level("./kv")
    const kv = new Kv(new LevelMagazine(level))
    ```
- **IdbMagazine,** in-browser indexedDB storage.
    ```ts
    import {Kv, IdbMagazine, idbOpen} from "@e280/kv"

    const idb = await idbOpen("kv")
    const kv = new Kv(new IdbMagazine(idb))
    ```
- **StorageMagazine,** in-browser localStorage/sessionStorage.
    > *storage magazine is slow and non-atomic. it's meant for small amounts of data.*
    ```ts
    import {Kv, StorageMagazine} from "@e280/kv"

    const kv = new Kv(new StorageMagazine(localStorage))
    ```
- **write your own magazine,** you won't believe how easy it is.
    ```ts
    import {Magazine, Op, Scan} from "@e280/kv"

    // three methods and you're done!
    export class MyMagazine implements Magazine {
      async commit(ops: Op<string>[]) {/*...*/}
      async getMany(keys: string[]) {/*...*/}
      async* entries(scan?: Scan) {/*...*/}
    }
    ```
    see [magazines/memory.ts](./s/magazines/memory.ts) for inspiration.



## 🪇 kv scopes.
- **`scope` makes namespaced Kv instances.**
    ```ts
    const users = kv.scope("users")
    const messages = kv.scope("messages")
    ```
    ```ts
    await users.set("111", "chase")
    await messages.set("222", ["111", "yo"])
    ```
    ```ts
    await kv.get("111") // undefined
      // 👮 parent is blind to child entries

    await users.get("222") // undefined
      // 👮 child is blind to sibling and parent entries
    ```
- **scopes are nestable,** and it's turtles all the way down.
    ```ts
    kv.scope("animals").scope("turtles")

    // 🥸 equivalent
    kv.scope("animals", "turtles")

    // 🙅 illegal: empty strings, reserved characters "." and ":"
    kv.scope("", "e280.org", "e280:org")
    ```
- **all kv operations are isolated to their own scope.**  
    > *the root kv is a scope like any other.*
    ```ts
    const animals = kv.scope("animals")
    const turtles = animals.scope("turtles")
    const squirrels = animals.scope("squirrels")
    ```
    ```ts
    await animals.clear()
      // 👮 turtles and squirrels are safe
    ```
    ```ts
    await squirrels.clear()
      // 👮 turtles are safe
    ```
- ☣️ **`subtree` is dangerous,** it allows a parent scope to hurt its children.  
    > *it returns a special `Subtree` instance that only has `count` and `clear` methods.*
    ```ts
    await animals.subtree.count()
      // count includes animals, turtles, and squirrels
    ```
    ```ts
    await animals.subtree.clear()
      // 💀 wipes out the turtles and squirrels. i'm sorry.
    ```
- **don't forget you can set strict types,** on both Kv and scopes.
    ```ts
    const kv = new Kv<unknown>()
    const users = kv.scope<string>("users")
    const messages = kv.scope<[author: string, text: string]>("messages")
    ```
- 🍋‍🟩 **commits can be cross-scoped,** don't miss this!
    ```ts
    await kv.commit([
      users.op.set("345", "bingus"),
      messages.op.set("456", ["345", "don't let the raccoons know"]),
    ])
    ```



## 🪇 more kv methods.
- **`delete` a pair by its key.**
    ```ts
    await kv.delete("hello")
    ```
    you can also pass multiple keys.
    ```ts
    await kv.delete("123", "234", "345")
    ```
- **`has` checks whether a key exists.**
    ```ts
    await kv.has("hello")
      // true
    ```
- **`setMany` sets many key-value pairs at once.**
    ```ts
    await kv.setMany([["1", "alpha"], ["2", "bravo"]])
    ```
- **`getMany` retrieves many values at once.**
    ```ts
    const values = await kv.getMany(["alpha", "bravo"])
      // [123, undefined]
    ```
- **`need` retrieves a value,** or throws if the value is missing/nullish.
    ```ts
    const value = await kv.need("hello")
      // "world" (or throws error)
    ```
- **`needMany` retrieves many values,** or throws on missing/nullish values.
    ```ts
    const values = await kv.needMany(["alpha", "bravo"])
      // [123, 234] (or throws error)
    ```
- **`entries` loops over key-value pairs.**
    ```ts
    for await (const [key, value] of kv.entries())
      console.log(key, value)
    ```
    it's aliased to `Symbol.asyncIterator`, so you can do this:
    ```ts
    for await (const [key, value] of kv)
      console.log(key, value)
    ```
    the `entries` method accepts scan options.
    ```ts
    for await (const [key, value] of kv.entries({
        limit: 100,
        reverse: false,
        start: "alpha", // inclusive
        end: "omega", // exclusive
      }))
      console.log(key, value)
    ```
    💡 you can use `collect` helper from `@e280/stz` to get entries/keys/values as an array:
    ```ts
    import {collect} from "@e280/stz"

    const entries = await collect(kv)
      // [["123", "alpha"], ["234", "bravo"]]

    const keys = await collect(kv.keys())
      // ["123", "234"]
    ```
- **`keys` and `values`.** *(accepts scan options)*
    ```ts
    for await (const key of kv.keys()) console.log(key)
    for await (const value of kv.values()) console.log(value)
    ```
- **`count` the number of entries** in this scope. *(accepts scan options)*
    ```ts
    await kv.count()
      // 123
    ```
- **`clear` deletes everything** in this scope. *(accepts scan options)*
    ```ts
    await kv.clear()
    ```
- **`cell` makes a little cubby,** for storing a single value.  
    > *(it implements `@e280/stz`'s `Cubby` type)*
    ```ts
    const muffins = kv.cell<number>("muffins")
    ```
    ```ts
    await muffins.set(99)
    ```
    ```ts
    await muffins.get() // number or undefined
    await muffins.need() // number or throws error
    await muffins.has() // true or false
    ```
    ```ts
    await muffins.delete()
    ```
    you can pass typed `Cell<X>` instances all around your app.
    ```ts
    import {Cell} from "@e280/kv"

    class MuffinCaptain {
      constructor(public muffins: Cell<number>) {}
    }
    ```



<br/><br/>

*https://e280.org/*

