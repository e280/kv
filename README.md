
![](https://i.imgur.com/SfYyhtx.png)

# 🪇 kv

**kv is a tiny key-value database.**  
typescript library. node or web. kv can be backed in-memory, leveldb, localstorage, or indexeddb. kv does smart stuff like scoped namespaces and atomic write batches.

```bash
npm install @e280/kv
```

```ts
import {Kv} from "@e280/kv"

const kv = new Kv()
```

- **set and get.**
    ```ts
    await kv.set("hello", "world")
      // setting undefined is the same as delete
    ```
    ```ts
    await kv.get("hello")
      // "world"
    ```
- **keys are strings. values can be any json data.**
    ```ts
    await kv.set("hello", {alpha: 123, bravo: ["bingus"]})
    ```
- **commit batches of ops, atomically.**
    ```ts
    await kv.commit([
      kv.op.set("hello", "world"),
      kv.op.delete("bingus"),
    ])
    ```



## 🪇 plug in your favorite kv magazine
- **MemoryMagazine *(default),*** ephemeral in-memory storage.  
    > *memory magazine is slow and the commits are not atomic. it's meant for testing.*
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
    > *storage magazine is slow and the commits are not atomic. it's meant for small amounts of data.*
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



## 🪇 kv scopes
- **`scope` creates a namespace.**
    ```ts
    const records = kv.scope("records")
      // creates a Kv instance for this scope

    await records.set("123", "bingus")
      // writes to key "records:123"
    ```
- **scopes are nestable,** it's turtles all the way down.
    ```ts
    const turtles = kv.scope("records").scope("turtles")

    await turtles.set("123", "bingus")
      // writes to key "records.turtles:123"
    ```
- **the parent's operations don't hurt siblings or children.**
    ```ts
    const records = kv.scope("records")
    const turtles = records.scope("turtles")

    await records.clear()
      // deletes "records" values without touching the "turtles" values
    ```
- **more about scope names,**
    ```ts
    // use rest params if you like
    const turtles = kv.scope("records", "turtles")
    ```
    ```ts
    // ❌ illegal: empty strings, reserved characters "." and ":"
    kv.scope("", "e280.org", "e280:org")
    ```
- **don't forget you can set strict types,** on both Kv and its scopes.
    ```ts
    const kv = new Kv<unknown>()
    const metadatas = kv.scope<{size: number}>("metadatas")
    const turtles = kv.scope("records").scope<string>("turtles")

    await metadatas.set("123", {size: 234})
    ```
- 🍋‍🟩 **commits can be cross-scoped,** don't miss this!
    ```ts
    await kv.commit([
      metadatas.op.set("123", {size: 234}), // key "metadatas:123"
      turtles.op.set("123", "bingus"), // key "records.turtles:123"
    ])
    ```
- **the root kv is just an unnamed scope,** and works like any other scope.
    > *generally, you should always be using a scoped kv. it's weird to directly use the root scope.*
    ```ts
    await kv.set("123", "bingus") // key ":123"
    ```
- **`subtree` is black magic,** which allows the parents to hurt their children.
    ```ts
    await records.subtree().count()
      // counts all keys including child scopes like the turtles.
    ```
    ```ts
    await records.subtree().clear()
      // this wipes out all the turtles.
    ```



## 🪇 more kv methods
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
    await kv.setMany(["1", "alpha"], ["1", "alpha"])
    ```
- **`getMany` retrieves many values at once.**
    ```ts
    const values = await kv.getMany(["alpha", "bravo"])
      // [123, undefined]
    ```
- **`need` retrieves a value,** or throws when the key doesn't exist.
    ```ts
    const value = await kv.need("hello")
      // "world" (or throws error)
    ```
- **`needMany` retrieves many values,** or throws when any key doesn't exist.
    ```ts
    const values = await kv.needMany(["alpha", "bravo"])
      // [123, 234] (or throws error)
    ```
- **`entries` loops over key-value pairs.**
    ```ts
    for await (const [key, value] of kv.entries())
      console.log(key, value)
    ```
    it's aliased to Symbol.asyncIterator, so you can do this:
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
- **`cell` produces a little cubby,** for storing a single value.  
    > *(it implements `@e280/stz`'s `Cubby` type)*
    ```ts
    const stats = kv.cell<{count: number}>("stats")
    ```
    ```ts
    await stats.set({count: 123})
    ```
    ```ts
    await stats.get()
      // {count: 123} or undefined
    ```



<br/><br/>

*https://e280.org/*

