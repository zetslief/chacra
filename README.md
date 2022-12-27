# chacra

Simple network game.

Game design:

Tower diffence with enemy spawner in the center.

* Chakras stays at around the circle arena.
* Chakras cannot move.
* Chakras can use their spell on either enemy or chakra.
* Different types of enemies could be managed by different chakras.

Current State:

* `Player` is in the center.
* `Slots` is a chakra.
* There are `defaultSlotNumber` which defines a number of the slots.
* `Arena` is a circle within which the `player` and the `slots` are located.
* `EnemySpawner` is in the center of `Arena` and creates enemies along the `y` axis.
