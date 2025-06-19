
# 🪇 Kv

***Json Key-value Storage for TypeScript.***

Damn simple typescript database. String keys. Json values.

Kv is an agnostic interface. You insert different drivers, which allows Kv to write data in-memory, or to local storage, or to [leveldb](https://github.com/Level/level), or wherever you want.

Kv does smart stuff, like namespacing, batch operations, and atomic write transactions.

<br/>

## Get started

### Install Kv into your project
- `npm install @e280/kv`

### Make your Kv instance
- Kv uses the in-memory `MemDriver` by default
  ```ts
  import {Kv} from "@e280/kv"

  const kv = new Kv()
  ```
- or alternatively, pop in a `LevelDriver` to use [leveldb](https://github.com/Level/level), a local on-disk database (kinda like sqlite)
  ```ts
  import {Kv} from "@e280/kv"
  import {LevelDriver} from "@e280/kv/level"

  const kv = new Kv(new LevelDriver("path/to/database"))
  ```
- or alternatively, pop in a `StorageDriver` to use browser localStorage
  ```ts
  import {Kv, StorageDriver} from "@e280/kv"

  const kv = new Kv(new StorageDriver())
  ```

### Get and set key-value pairs
- The most basic thing you can do with Kv, is write and read values using string keys.
  ```ts
  await kv.set("101", "hello")
  await kv.set("102", 123.456)

  await kv.get("101") // "hello"
  await kv.get("102") // 123.456

  await kv.get("103") // undefined
  ```

<br/>

## Kv usage

### Example usage walkthrough
- so, for my use case, i'm doing stuff like saving user accounts, it might give you an idea of how Kv is meant to be used
  ```ts
  // create a kv instance
  const kv = new Kv()

  // creating some typed scopes for which i'll insert records
  const accounts = kv.scope<Account>("accounts")
  const characters = kv.scope<Character>("characters")

  // my app's function for adding a character to an account
  async function addCharacter(accountId: string, character: Character) {

    // obtain the account
    const account = await accounts.require(accountId)
      // actually uses key `accounts:${accountId}` because of the scope prefix

    // modifying the data
    character.ownerId = account.id
    account.characterIds.push(character.id)

    // create an atomic write transaction to save the data
    await kv.transaction(() => [
      accounts.write.set(account.id, account),
      characters.write.set(character.id, character),
    ])
  }

  // my app's function for listing all characters
  async function listCharacters(accountId: string) {
    const account = await accounts.require(accountId)
    return characters.requires(...account.characterIds)
  }
  ```

### Functionality reference

#### Setting stuff
- `set` saves key-value pairs
  ```ts
  await kv.set("hello", "world")
  ```
- `set` can save any serializable json-friendly javascript crap
  ```ts
  await kv.set("hello", {data: ["world"], count: 123.456})
  ```
- `set` will interpret `undefined` as the same as a deletion (like json)
  ```ts
  await kv.set("hello", undefined) // same as deleting "hello"
  ```
  - like json you can use `null` instead of you want the key to exist
- `sets` saves many pairs, as an atomic batch
  ```ts
  await kv.sets(["101", "alpha"], ["102", "bravo"])
  ```

#### Getting stuff
- `get` loads a value (or undefined if the key's not found)
  ```ts
  await kv.get("101")
    // "alpha" (or undefined)
  ```
- `gets` loads many values at once (undefined for not-found keys)
  ```ts
  await kv.gets("101", "102", "103")
    // ["alpha", "bravo", undefined]
  ```

#### Deleting stuff
- `del` deletes things
  ```ts
  await kv.del("hello")
  ```
- `del` can also delete many things
  ```ts
  await kv.del("101", "102", "103")
  ```

#### Having stuff
- `has` checks if a key exists
  ```ts
  await kv.has("hello")
    // true (or false)
  ```
- `hasKeys` checks many keys
  ```ts
  await kv.hasKeys("101", "102", "103")
    // [true, true, false]
  ```

#### Fancy stuff
- `require` gets a value, but throws an error if the key is missing
  ```ts
  await kv.require("101")
    // "world" (or an error is thrown)
  ```
- `requires` gets many things, throws an error if any keys are missing
  ```ts
  await kv.requires("101", "102")
    // ["alpha", {data: 123.45}] (or an error is thrown)
  ```
- `guarantee` gets or creates a thing
  ```ts
  await kv.guarantee("hello", () => "world")
    // "world"
  ```

### Transactions make you cool and incredible
- make an atomic transaction, where the writes happen all-or-nothing to avoid corruption
  ```ts
  // all these succeed or fail together
  await kv.transaction(write => [
    write.del("obsolete:99"),
    write.set("owners:4", [101, 102]),
    write.sets(
      ["records:101", {msg: "lol", owner: 4}],
      ["records:102", {msg: "lel", owner: 4}],
    ),
  ])
  ```
  - you can use `write.set`, `write.sets`, and `write.del` to schedule write operations into the transaction

### Scopes keep things tidy
- a scope is just a Kv instance that has a key prefix assigned
  ```ts
  const records = kv.scope("records")

  // writes to key "records:123"
  await records.set("123", "lol")
  ```
- a scope can do everything a Kv can do (it *is* a Kv)
  ```ts
  const records = kv.scope("records")
  await records.set("124", {data: "bingus"})
  await records.transaction(write => [write.del("124")])
  ```
- yes, you can scope a scope — *it's turtles all the way down*
  ```ts
  const records = kv.scope("records")
  const owners = records.scope("owners")
  const accounts = records.scope("accounts")

  // writes to key "records.owners:5"
  await owners.set("5", "lol")

  // writes to key "records.accounts:123"
  await accounts.set("123", "rofl")
  ```
- you can constrain a scope with a typescript type
  ```ts
  type MyData = {count: number}

    //                  provide your type
    //                           👇
  const records = kv.scope<MyData>("records")

  // now typescript knows `count` is a number
  const {count} = records.get("123")
  ```
- you can in fact do transactional writes across multiple scopes
  ```ts
  const records = kv.scope("records")
  const owners = records.scope("owners")
  const accounts = records.scope("accounts")

  await kv.transaction(() => [
    owners.write.set("5", {records: [101, 102]}),
    accounts.write.set("101", {data: "alpha", owner: 5}),
    accounts.write.set("102", {data: "bravo", owner: 5}),
  ])
  ```
- *new!* you can now also do scopes like this:
  ```ts
  const records = kv.scope("records", "alpha")
  const scoped = kv.scope("dead", "beef")

  // writes to key "records.alpha:dead:beef:123"
  await scoped.set(123, "hello")
  ```

### Stores keep you focused
- a store is an object that focuses on reading/writing the value of a single key
  ```ts
  const login = kv.store<Login>("login")

  // save data to the store
  await login.set({token: "lol"})

  // load data from the store
  const {token} = await login.get()
  ```

<br/>

## Drivers
- if you want Kv to operate on a new database, it's pretty easy to write a new Driver
- here is the abstract Driver class you'd have to extend
  ```ts
  export abstract class Driver {
    abstract gets(...keys: string[]): Promise<(string | undefined)[]>
    abstract hasKeys(...keys: string[]): Promise<boolean[]>
    abstract keys(scan?: Scan): AsyncGenerator<string>
    abstract entries(scan?: Scan): AsyncGenerator<[string, string]>
    abstract transaction(...writes: Write[]): Promise<void>
  }
  ```
- then you can just provide your new driver to the Kv constructor, eg
  ```ts
  // instance your new driver and give it to Kv
  const kv = new Kv(new MyDriver())
  ```
- see [drivers/mem.ts](./s/drivers/mem.ts)
- see [drivers/level.ts](./s/drivers/level.ts)
- see [drivers/storage.ts](./s/drivers/storage.ts)
- you can do it!

<br/>

## 💖 Made with open source love
- free and open source
- build with us at https://e280.org/ but only if you're cool
- star this on github if you think it's cool

