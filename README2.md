
# 🪇 kv

**the tiny run-anywhere key-value database typescript library.**

```bash
npm install @e280/kv
```

```ts
import {Kv} from "@e280/kv"

const kv = new Kv()
```

- **bet that kv can get and set.**
    ```ts
    await kv.set("hello", "world")
    ```
    ```ts
    await kv.get("hello")
      // "world"
    ```
- **keys are strings. values can be any json data.**
    ```ts
    await kv.set("hello", {alpha: 123, bravo: ["bingus"]})
    ```
- **commit batches of changes, atomically.**
    ```ts
    await kv.commit([
      kv.op.set("hello", "world"),
      kv.op.delete("bingus"),
    ])
    ```



## 🪇 plug in your favorite kv magazine
- **MemoryMagazine *(default),*** ephemeral in-memory storage (just a js map)
    ```ts
    import {Kv, MemoryMagazine} from "@e280/kv"

    const kv = new Kv(new MemoryMagazine())
    ```
- **LevelMagazine,** nodejs on-disk [leveldb](https://github.com/google/leveldb)
    ```ts
    import {Level} from "level"
    import {Kv, LevelMagazine} from "@e280/kv"

    const level = new Level("./kv")
    const kv = new Kv(new LevelMagazine(level))
    ```
- **IdbMagazine,** in-browser indexedDB storage
    ```ts
    import {Kv, IdbMagazine, idbOpen} from "@e280/kv"

    const idb = await idbOpen("kv")
    const kv = new Kv(new IdbMagazine(idb))
    ```
- **StorageMagazine,** in-browser localStorage/sessionStorage
    ```ts
    import {Kv, StorageMagazine} from "@e280/kv"

    const kv = new Kv(new StorageMagazine(localStorage))
    ```



## 🪇 kv scopes
- **create scoped namespaces.**
    ```ts
    const records = kv.scope("records")
      // creates a Kv instance for this scope

    await records.set("123", "bingus")
      // writes to key "records:123"

    await records.clear()
      // only effects our "records" namespace
    ```
- **scopes are nestable,** it's turtles all the way down.
    ```ts
    const turtles = kv.scope("records").scope("turtles")

    await turtles.set("123", "bingus")
      // writes to key "records.turtles:123"
    ```
- **the parent's operations don't hurt the children.**
    ```ts
    const records = kv.scope("records")
    const turtles = records.scope("turtles")

    await records.clear()
      // deletes "records" values without touching the "turtles" values
    ```
- **`crush` is black magic,** which allows the parents to hurt the children.
    ```ts
    await records.crush().clear()
      // okay now this wipes out all the turtles
    ```



## 🪇 more kv methods
- **`delete` deletes a key.**
  ```ts
  await kv.delete("hello")
  ```
- **`has` checks whether a key exists.**
  ```ts
  await kv.has("hello")
    // true
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
    // [123, 456] (or throws error)
  ```
- **`entries` loops over key-value pairs.**
  ```ts
  for await (const [key, value] of kv.entries())
    console.log(key, value)
  ```
- **entries can be scanned,** by range and limit.
  ```ts
  for await (const entry of kv.entries({
    start: "alpha",
    end: "omega",
    limit: 100,
  }))
    console.log(entry)
  ```
- **`clear` deletes everything,** within this namespace.
  ```ts
  await kv.clear()
  ```
- **`store` produces a little cubby,** for storing a single value.
  ```ts
  const stats = kv.store<{count: number}>("stats")
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

