
# `@e280/kv` changelog
- 🟥 breaking change
- 🔶 deprecation or possible breaking change
- 🍏 harmless addition, fix, or enhancement



<br/>

## v0.2

### v0.2.0
- 🟥 total rewrite!
- 🟥 `Driver` replaced by `Magazine`
  - 🟥 Magazine is a lot simpler than Driver, it only has three methods
  - 🟥 `MemDriver` replaced by `MemoryMagazine`
  - 🟥 `LevelDriver` replaced by `LevelMagazine`
  - 🟥 `StorageDriver` replaced by `StorageMagazine`
  - 🍏 new `IdbMagazine`
- 🟥 removed dependency `level`, now we just use our own in-house `LevelLike` type which should be leveldb compatible
- 🟥 `kv.transaction` replaced by `kv.commit`
  - 🟥 syntax for this feature has changed a little (see readme)
  - 🟥 `kv.write` replaced by `kv.op` (Operator instance)
  - 🟥 `Writer` class replaced by `Operator` class
  - 🟥 `Write` type replaced by `Op` type
- 🟥 kv method changes
  - 🟥 `kv.gets` renamed to `kv.getMany`
  - 🟥 `kv.require` renamed to `kv.need`
  - 🟥 `kv.requires` renamed to `kv.needMany`
  - 🟥 `kv.del` renamed to `kv.delete`
  - 🟥 `kv.sets` replaced by to `kv.setMany` (not rest param anymore)
  - 🟥 `kv.flatten` replaced by `kv.subtree`
- 🟥 kv generic type now defaults to `unknown` (was `any`) -- this means you may need to be more explicit with types in some cases
- 🟥 remove kv options `divisor`, `delimiter`, `chunkSize`
- 🟥 scan `end` is now EXCLUSIVE, it used to be inclusive -- scans are "half open"
- 🟥 rework the way prefixing works
  - 🟥 the root-level Kv instance is no longer special -- it no longer can see omnisciently into its child scopes -- it's like any other scope
  - 🟥 the change is that all root-level kv keys are actually (opaquely) prefixed with the delimiter (default `:`) -- that means if you inspect your magazine directly, you'll see root level has keys like `:123`
  - 🟥 eg, you used to be able to call `await kv.clear()` to wipe ALL data even in every scope -- this no longer works, you can only clear what's on your current scope
  - 🟥 if you actually wanna nuke everything on all child scopes, you do `await kv.subtree().clear()` -- subtree lets you "see" all child scopes
- 🟥 removed `collect` helper (its now in `@e280/stz`)
- 🟥 scopes containing `.` or `:` or empty string are no longer tolerated (throws error)
- 🍏 add kv option `codec` with type `Codec` which defaults to a json codec
- 🍏 add kv `count` method
- 🍏 add scan `reverse` option -- we can now scan stuff in reverse
- 🍏 add kv `Symbol.asyncIterator` alias for `entries`



<br/>

## v0.1

### v0.1.5
- 🍏 update deps

### v0.1.4
- 🍏 update deps

### v0.1.3
- 🍏 update deps

### v0.1.2
- 🍏 update deps

### v0.1.1
- 🍏 update deps, github actions

### v0.1.0
- 🍏 update dependencies



<br/>

## v0.0

### v0.0.0-12
- 🔶 remove wildcard path exports (more formal exports)
- 🍏 update dependencies

### v0.0.0-12
- 🟥 `kv.scope` param signature changed
  - old `kv.scope(...scopes: string[])`
  - new `kv.scope(scope: string, delimiter = ":")`
  - you can now specify `delimiter` useful for allowing you to select keys across sub-scopes
- 🍏 added new `kv.flatten()` helper
  - makes a new kv clone with `delimiter: ""`
  - these two forms are equivalent
    - `kv.scope("alpha", "")`
    - `kv.scope("alpha").flatten()`

### v0.0.0-11
- 🟥 rename `kv.namespace` to `kv.scope` (removing what was previous called scope)

### v0.0.0-10
- 🍏 allow rest-param `kv.namespace("a", "b")`
- 🍏 add `kv.scope("123", "deadbeef")`

### v0.0.0-4
- 🟥 rename `Core` -> `Driver`
  - `MemCore` -> `MemDriver`
  - `StorageCore` -> `StorageDriver`
  - `LevelCore` -> `LevelDriver`
- 🟥 rename `put` to `set`
  - `kv.put` -> `kv.set`
  - `kv.puts` -> `kv.sets`
- 🟥 setting `undefined` is now the same as a `del`
- 🟥 transaction returns are now simpler write types `[string, string | undefined]`

### v0.0.0-3
- 🍏 add `kv.values()` iterator
- 🍏 add `Kv.collect(iterator)` helper

### v0.0.0-0
- 🍏 first release

