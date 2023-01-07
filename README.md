# chacra

Simple multiplayer game.

## How to build

```bash
cd ui
tsc
```

## Game design

Tower diffence with enemy spawner in the center:
* Chakras stays at around the circle arena.
* Chakras cannot move.
* Chakras can use their spell on either enemy or chakra.
* Different types of enemies could be managed by different chakras.

Chakras:
* `Crown`: give a shield to a chakra.
* `Third Eye`: make an enemy to move in opposite direction.

Restrications:
* Each gamer have only 1 click to apply an action.
* Game must be simple enough to be implemented without external dependencies.

## Current State:

* `Player` is in the center.
* `Slots` is a chakra.
* There are `defaultSlotNumber` which defines a number of the slots.
* `Arena` is a circle within which the `player` and the `slots` are located.
* `EnemySpawner` is in the center of `Arena` and creates enemies along the `y` axis.

## In progress

* Several types of `effects`. 
* Several types of `chakras`.

