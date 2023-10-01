import {
    GameState,
    InputState,
    Player,
    Ball,
    Booster, BoosterValidator, BoostSpawnerState, BoostShufflerState,
    AreaBooster, AreaBoosterSpawnerState,
    Obstacle,
} from './types';

import {
    BALL_MAX_RADIUS,
    BOOSTER_RADIUS, BOOSTER_SCALE,
    OBSTACLE_RADIUS,
    PLAYER_DEFAULT_SPEED,
    AREA_BOOSTER_RADIUS,
    AREA_BOOSTER_DURATION,
    KNOWN_BOOSTERS,
} from './configuration';

import {
    Vec2,
    vec2, smul, sum, sub, ssum, normalize, len,
    CircleCollider,
    collideCC,
} from './math';


export function updatePhysics(
    game: GameState,
    inputs: [Player, InputState][],
    dt: number) {
    for (const [player, input] of inputs) {
        processInput(player, input, dt);
    }
    processBoostSpawner(dt, game.boostSpawner, game, game.boosters, validateBooster);
    processAreaBoosterSpawners(game.areaBoosterSpawners, game.areaBoosters, game, dt);
    for (const areaBooster of game.areaBoosters) {
        processAreaBooster(areaBooster, dt);
    }
    moveBall(game.ball, game.ballDirection, dt);
    for (const player of game.players) {
        if (collideBallAndPlayer(game.ball, player.collider, game.ballDirection)) {
            game.ballOwner = player;
            game.ballDirection = normalize(game.ballDirection);
            game.areaBoosters.push({
                collider: { ...player.collider, radius: AREA_BOOSTER_RADIUS},
                duration: AREA_BOOSTER_DURATION,
                color: player.color
            });
            break;
        }
        player.speed = PLAYER_DEFAULT_SPEED;
        for (const areaBooster of game.areaBoosters) {
            if (areaBooster.color != player.color) {
                continue;
            }
            if (collideCC(areaBooster.collider, player.collider)) {
                player.speed *= 1.5;
                break;
            }
        }
    }
    collideBallAndObstacle(game, game.ball);
    processBoostShuffler(dt, game.boostShuffler, game.boosters);
    processRequestedBoosters(game, game.ballOwner);
    let boosters = []
    for (const booster of game.boosters) {
        let collided = collideBallAndBooster(game, game.ball, booster, game.ballOwner);
        if (!collided) {
            for (const player of game.players) {
                collided = collidePlayerAndBooster(game, player, booster);
                if (collided) {
                    break;
                }
            }
        }
        if (!collided) {
            boosters.push(booster);
        }
    }
    game.players = game.players.filter(player => !player.dead);
    game.areaBoosters = game.areaBoosters.filter(ab => ab.duration > 0);
    game.boosters = boosters;
    if (game.ballOwner.dead) {
        if (game.players.length > 0) {
            const randomPlayerIndex = Math.floor(Math.random() * game.players.length);
            game.ballOwner = game.players[randomPlayerIndex];
        }
    }
}

function createBoostShuffler(): BoostShufflerState {
    return { initialized: false, destinationMap: new Map() };
}

function processBoostShuffler(dt: number, state: BoostShufflerState, boosters: Booster[]) {
    if (!state.initialized) {
        for (const booster of boosters) {
            let destination = smul(ssum(booster.collider, -0.5), 2)
            destination = smul(destination, -1);
            destination = ssum(smul(destination, 0.5), 0.5);
            state.destinationMap.set(booster, destination);
        }
        state.initialized = true;
    }
    for (const booster of boosters) {
        if (!state.destinationMap.has(booster)) {
            state.destinationMap.delete(booster);
        }
    }
    for (const [booster, destination] of state.destinationMap.entries()) {
        const step = 0.10 * dt;
        const direction = normalize(sub(destination, booster.collider));
        booster.collider = {
            radius: booster.collider.radius,
            ...sum(booster.collider, smul(direction, step))
        };
        // TODO: remove this mutation from the loop!
        if (len(sub(booster.collider, destination)) < 0.0050) {
            state.destinationMap.delete(booster);
        }
    }
}

function createObstacle(): Obstacle {
    let position = vec2(Math.random(), Math.random());
    position = ssum(smul(position, 0.64), 0.5 - 0.64 / 2);
    return {
        lifeCounter: 3,
        radius: OBSTACLE_RADIUS,
        ...position
    };
}

function movePlayer(player: Player, _dx: number, dy: number, dt: number) {
    const step = player.speed * dt * dy;
    const position = smul(ssum(player.position, -0.5), 2);
    const angle = Math.atan2(position.y, position.x) + step;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    player.position = ssum(smul(vec2(x, y), 0.5), 0.5);
    player.collider.x = player.position.x;
    player.collider.y = player.position.y;
}

function moveBall(ball: Ball, direction: Vec2, dt: number) {
    const step = 0.20;
    ball.position = sum(ball.position, smul(smul(direction, dt), step));
    if (ball.position.x > 1) {
        ball.position.x -= 1;
    }
    if (ball.position.x < 0) {
        ball.position.x += 1;
    }
    if (ball.position.y > 1) {
        ball.position.y -= 1;
    }
    if (ball.position.y < 0) {
        ball.position.y += 1;
    }
    ball.collider.x = ball.position.x;
    ball.collider.y = ball.position.y;
}

function collideBallAndPlayer(ball: Ball, player: CircleCollider, direction: Vec2): boolean {
    if (collideCC(ball.collider, player)) {
        const newDirection = normalize(sub(ball.collider, player));
        direction.x = newDirection.x;
        direction.y = newDirection.y;
        return true;
    }
    return false;
}

function processBooster(game: GameState, boosterName: string, player: Player) {
    if (boosterName == "biggerPlayer") {
        player.size *= BOOSTER_SCALE;
        player.collider.radius *= BOOSTER_SCALE;
    } else if (boosterName == "biggerBall") {
        game.ball.size *= BOOSTER_SCALE;
        game.ball.size = Math.min(game.ball.size, BALL_MAX_RADIUS);
        game.ball.collider.radius = game.ball.size;
    } else if (boosterName == "shuffleBoosters") {
        game.boostShuffler = createBoostShuffler();
    } else if (boosterName == "obstacle") {
        game.obstacles.push(createObstacle());
    } else if (boosterName == "megaElectric") {
        game.areaBoosterSpawners.push(createAreaBoosterSpawner(player));
    } else if (boosterName == "deathBall") {
        player.dead = true;
    }
}

function processAreaBooster(areaBooster: AreaBooster, dt: number) {
    areaBooster.duration -= dt;
}

function processAreaBoosterSpawners(spawners: AreaBoosterSpawnerState[], areaBoosters: AreaBooster[], game: GameState, dt: number) {
    for (const state of spawners) {
        processAreaBoosterSpawner(state, areaBoosters, state.player, dt);
    }
    game.areaBoosterSpawners = spawners.filter((spawner) => !spawner.finished);
}

function processRequestedBoosters(game: GameState, player: Player) {
    while (game.requestedBoosters.length > 0) {
        const requestedBooster = game.requestedBoosters.pop()!;
        processBooster(game, requestedBooster.name, player);
    }
}

function collideBallAndBooster(
    game: GameState,
    ball: Ball,
    booster: Booster,
    player: Player,
): boolean {
    if (collideCC(ball.collider, booster.collider)) {
        processBooster(game, booster.name, player);
        return true;
    }
    return false;
}

function collidePlayerAndBooster(
    game: GameState,
    player: Player,
    booster: Booster,
): boolean {
    if (collideCC(player.collider, booster.collider)) {
        processBooster(game, booster.name, player);
        return true;
    }
    return false;
}

function collideBallAndObstacle(game: GameState, ball: Ball) {
    for (const obstacle of game.obstacles) {
        if (collideCC(ball.collider, obstacle)) {
            const newDirection = normalize(sub(ball.collider, obstacle));
            game.ballDirection = newDirection;
            obstacle.lifeCounter -= 1;
        }
    }
    game.obstacles = game.obstacles.filter(o => o.lifeCounter > 0);
}

function processInput(player: Player, input: InputState, dt: number) {
    if (input.dx != 0 || input.dy != 0) {
        movePlayer(player, input.dx, input.dy, dt);
        input.dx = 0;
        input.dy = 0;
    }
    input.click = undefined;
}

function validateBooster(gameState: GameState, booster: Booster): boolean {
    return !collideAny(gameState, booster.collider);
}

function collideAny(
    game: GameState,
    collider: CircleCollider): boolean {
    if (collideCC(collider, game.ball.collider)) {
        return true;
    }
    for (const player of game.players) {
        if (collideCC(collider, player.collider)) {
            return true;
        }
    }
    for (const booster of game.boosters) {
        if (collideCC(collider, booster.collider)) {
            return true;
        }
    }
    for (const obstacle of game.obstacles) {
        if (collideCC(collider, obstacle)) {
            return true;
        }
    }
    return false;
}

function createAreaBoosterSpawner(player: Player): AreaBoosterSpawnerState {
    return {
        index: 0,
        count: 360,
        elapsedTime: 0,
        delay: 0.01,
        player,
        finished: false,
    };
}

function processAreaBoosterSpawner(state: AreaBoosterSpawnerState, areaBoosters: AreaBooster[], player: Player, dt: number) {
    const angleStep = (Math.PI * 2) / state.count;
    state.elapsedTime += dt;
    while (state.elapsedTime / state.delay > state.index) {
        if (state.index == state.count) {
            state.finished = true;
            break;
        }
        const angle = angleStep * state.index;
        let pos = vec2(Math.cos(angle), Math.sin(angle));
        pos = ssum(smul(pos, 0.5), 0.5);
        areaBoosters.push({
            collider: { ...pos, radius: player.collider.radius * 1.1 },
            color: player.color,
            duration: AREA_BOOSTER_DURATION,
        });
        ++state.index;
    }
}

function processBoostSpawner(dt: number, state: BoostSpawnerState, game: GameState, boosters: Booster[], validate: BoosterValidator) {
    function randomBooster(): Booster {
        const totalWeight = KNOWN_BOOSTERS.map(b => b.weight).reduce((prev, cur) => prev + cur);
        const selectedWeight = Math.floor(Math.random() * totalWeight);
        const offset = 0.2;
        const collider = {
            x: offset + Math.random() * (1 - offset),
            y: offset + Math.random() * (1 - offset),
            radius: BOOSTER_RADIUS
        };
        let weightCounter = 0;
        for (let index = 0; index < KNOWN_BOOSTERS.length; ++index) {
            const booster = KNOWN_BOOSTERS[index];
            weightCounter += booster.weight;
            if (weightCounter > selectedWeight) {
                return { collider, ...booster };
            }
        }
        return { collider, ...KNOWN_BOOSTERS[KNOWN_BOOSTERS.length - 1] };
    }

    state.timeLeft -= dt;
    if (state.timeLeft < 0) {
        let attempts = 0;
        let booster = randomBooster();
        while (attempts < 10 && !validate(game, booster)) {
            booster = randomBooster();
        }

        boosters.push(randomBooster());
        state.timeLeft = state.delay;
    }
}
