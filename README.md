# chacra

Simple multiplayer game with `players`, `balls` and `boosters`.

## Game design

Main entities:
- `Player`: represents an actor that is allowed to guide the `ball`.
- `Ball`: represents a ball. `Player`s can interact with it to play collect `booster`s.
- `Booster`: represents an object on the field that can be collected by the `ball`.

## UI

### Build

```bash
cd ui
./run.sh
```

The scripts starts `esbuild`'s watch process and simple `http` server in order to load all the workers and static files.

### Test

```bash
npm run-script test
```

Just does the tests. Current tests are obsolete and probably can be removed. I keep them there just as a reminder that this area of the codebase it garbage.

## BE

```bash
dotnet run
```

No development here so far.