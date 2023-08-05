# chacra

Simple multiplayer game with `players`, `balls` and `boosters`.

## Game design

Main entities:
- `Player`: represents an actor that is allowed to guide the `ball`.
- `Ball`: represents a ball. `Player`s can interact with it to play collect `booster`s.
- `Booster`: represents an object on the field that can be collected by the `ball`.

`Lobby` is needed in order to start a gaming session. A player that creates the `lobby` is called `host`. The `host` is able to start the game once other players are connected.

## UI

### Login

Allows a user to enter the `player name` and connect to the lobby browser.

`Session storage` is used to store `player's data.

### Lobby browser

Allows a user to either select existing `lobby` or create a new one.

### Lobby host

This page is shown to the host of the `lobby`. It shows connected `player`s and allows to start the gaming session.

### Lobby guest

The page only shows the connected players to the `lobby`.

### Build

```bash
cd ui
./run.sh
```

The script buids the app and starts `esbuild`'s watch process.

### Test

```bash
npm run-script test
```

Just does the tests. Current tests are obsolete and probably can be removed. I keep them there just as a reminder that this area of the codebase it garbage.

## Backend

```bash
dotnet run
```

## Networking

So, there are several way to implement the networking.

The first way is to store game state on the `server` side.
This approach could introduce latency issues to the players.

The second approach is broadcasting events to all players.
This approach require more CPU time from the clients: all of them need to run physics calculations. Howewer, it could be possible to share the `physics` server if the clients (e.g. `bots`) are in the same domain.
