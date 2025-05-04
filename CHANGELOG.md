
# `@e280/kv` changelog
- 🟥 breaking change
- 🔶 deprecation or possible breaking change
- 🍏 harmless addition, fix, or enhancement

<br/>

## v0.0

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

