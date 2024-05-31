import {
    GameState,
    InputState,
    Player,
    Ball,
    Booster, BoostShufflerState,
    AreaBooster, AreaBoosterSpawnerState,
    Obstacle,
    createBackgroundBlinkEffect,
    isBackgroundBlinkEffect,
} from './types';

import {
    BALL_MAX_RADIUS,
    BALL_DEFAULT_SPEED,
    BOOSTER_SCALE,
    PLAYER_DEFAULT_SPEED,
    AREA_BOOSTER_RADIUS,
    AREA_BOOSTER_DURATION,
} from './configuration';

import {
    Vec2,
    vec2, smul, sum, sub, ssum, normalize, len,
    CircleCollider, LineCollider,
    collideCC, collideCL, directionCC
} from './math';


export function updatePhysics(
    game: GameState,
    inputs: [Player, InputState][],
    dt: number) {
    for (const [player, input] of inputs) {
        processInput(player, input, dt);
    }
    for (const player of game.players) {
        movePlayer(player, dt);
    }
    processEffects(game, dt);
    processAreaBoosterSpawners(game.areaBoosterSpawners, game.areaBoosters, game, dt);
    for (const areaBooster of game.areaBoosters) {
        processAreaBooster(areaBooster, dt);
    }
    moveBall(game.ball, game.ballDirection, dt);
    processTrajectory(game.ball, game.players, game);
    for (const player of game.players) {
        if (collideBallAndPlayer(game.ball, player.collider, game.ballDirection)) {
            console.log("Collision:", game.ball, player.collider);
            game.ballOwner = player;
            game.ballDirection = normalize(game.ballDirection);
            game.areaBoosters.push({
                collider: { ...player.collider, radius: AREA_BOOSTER_RADIUS },
                duration: AREA_BOOSTER_DURATION,
                color: player.color
            });
            const blinkCount = 1;
            game.effects.push(createBackgroundBlinkEffect(0.300, `hsla(${Math.random() * 360}, 20%, 50%, 0.3)`, blinkCount));
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
    let wallIndex = 0;
    for (const wall of game.walls) {
        if (collideCL(wall, game.ball.collider)) {
            if (wallIndex % 2 == 0) {
                game.ballDirection.x *= -1;
            } else {
                game.ballDirection.y *= -1;
            }
        } else {
            wallIndex += 1;
        }
    }
    collideBallAndObstacle(game, game.ball);
    processBoostShuffler(dt, game.boostShuffler, game.boosters);
    processRequestedBoosters(game, game.ballOwner);
    for (let index = 0; index < game.boosters.length; ++index) {
        const booster = game.boosters[index];
        if (!booster) {
            continue;
        }
        let collided = collideBallAndBooster(game, game.ball, booster, game.ballOwner);
        if (collided) {
            game.boosters[index] = null;
        }
    }
    game.players = game.players.filter(player => !player.dead);
    game.areaBoosters = game.areaBoosters.filter(ab => ab.duration > 0);
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

function processBoostShuffler(dt: number, state: BoostShufflerState, boosters: (Booster | null)[]) {
    if (!state.initialized) {
        for (const booster of boosters) {
            if (!booster) {
                continue;
            }
            let destination = smul(ssum(booster.collider, -0.5), 2)
            destination = smul(destination, -1);
            destination = ssum(smul(destination, 0.5), 0.5);
            state.destinationMap.set(booster, destination);
        }
        state.initialized = true;
    }
    for (const booster of boosters) {
        if (!booster) {
            continue;
        }
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

function createObstacle(booster: Booster): Obstacle {
    return {
        lifeCounter: 3,
        ...booster.collider
    };
}

function movePlayer(player: Player, dt: number) {
    const currentPosition = player.collider.y;
    const delta = player.target.y - currentPosition;
    const direction = Math.sign(delta);
    const step = direction * player.speed * dt;
    if (Math.abs(delta) < Math.abs(step)) {
        return;
    }
    const radius = player.collider.radius;
    let newPosition = currentPosition + step;
    if (newPosition < radius) {
        newPosition = radius;
    } else if (newPosition > (1 - radius)) {
        newPosition = 1 - radius;
    }
    player.collider.y = newPosition;
}

function moveBall(ball: Ball, direction: Vec2, dt: number) {
    const step = BALL_DEFAULT_SPEED;
    let newPosition = sum(ball.position, smul(smul(direction, dt), step));
    const size = ball.collider.radius;
    if (newPosition.x <= size || newPosition.x >= (1 - size))
    {
        direction.x *= -1;
    }
    if (newPosition.y <= size || newPosition.y >= (1 - size))
    {
        direction.y *= -1;
    }
    newPosition = sum(ball.position, smul(smul(direction, dt), step));
    ball.position = newPosition; 
    ball.collider.x = ball.position.x;
    ball.collider.y = ball.position.y;
}

function collideBallAndPlayer(ball: Ball, player: CircleCollider, direction: Vec2): boolean {
    if (collideCC(ball.collider, player)) {
        const newDirection = directionCC(ball.collider, player);
        direction.x = newDirection.x;
        direction.y = newDirection.y;
        return true;
    }
    return false;
}

function processBooster(game: GameState, booster: Booster, player: Player) {
    const boosterName = booster.name;
    if (boosterName == "biggerPlayer") {
        player.size *= BOOSTER_SCALE;
        player.collider.radius *= BOOSTER_SCALE;
    } else if (boosterName == "fasterPlayer") {
        player.speed += PLAYER_DEFAULT_SPEED * 0.1;
    } else if (boosterName == "slowerPlayer") {
        player.speed -= PLAYER_DEFAULT_SPEED * 0.1;
    } else if (boosterName == "biggerBall") {
        game.ball.size *= BOOSTER_SCALE;
        game.ball.size = Math.min(game.ball.size, BALL_MAX_RADIUS);
        game.ball.collider.radius = game.ball.size;
    } else if (boosterName == "fasterBall") {
        game.ball.speed += BALL_DEFAULT_SPEED * 0.1;
    } else if (boosterName == "slowerBall") {
        game.ball.speed -= BALL_DEFAULT_SPEED * 0.1;
    } else if (boosterName == "shuffleBoosters") {
        game.boostShuffler = createBoostShuffler();
    } else if (boosterName == "obstacle") {
        game.obstacles.push(createObstacle(booster));
    } else if (boosterName == "megaElectric") {
        game.areaBoosterSpawners.push(createAreaBoosterSpawner(player));
    } else if (boosterName == "deathBall") {
        // player.dead = true;
        return false;
    } else {
        console.error("Unknown booster", booster);
    }
    return true;
}

function processAreaBooster(areaBooster: AreaBooster, dt: number) {
    areaBooster.duration -= dt;
}

function processEffects(game: GameState, dt: number): void {
    const result = []
    for (const effect of game.effects) {
        effect.duration -= dt;
        if (isBackgroundBlinkEffect(effect)) {
            const progress = 1 - (effect.duration / effect.initialDuration)
            const numberOfPeriods = effect.blinkCount;
            const periodProgress = 1 / numberOfPeriods;
            effect.enabled = Math.round(progress / periodProgress) % 2 == 0;
        }
        if (effect.duration > 0) {
            result.push(effect);
        }
    }
    game.effects = result;
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
        var slot = game.slots[requestedBooster.index];
        const booster: Booster = {
            name: requestedBooster.name,
            color: requestedBooster.color,
            collider: { x: slot.x, y: slot.y, radius: slot.size },
        };
        processBooster(game, booster, player);
    }
}

function collideBallAndBooster(
    game: GameState,
    ball: Ball,
    booster: Booster,
    player: Player,
): boolean {
    if (collideCC(ball.collider, booster.collider)) {
        return processBooster(game, booster, player);
    } else {
        return false;
    }
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
    if (input.click) {
        player.target = input.click;
        input.click = undefined;
    }
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

function processTrajectory(ball: Ball, players: Player[], game: GameState): void {
    for (const player of players) {
        if (len(sub(ball.collider, player.collider)) > 0.35) {
            continue;
        }

        if ((Math.sign(game.ballDirection.x) > 0 && player.collider.x < 0.5)
           || (Math.sign(game.ballDirection.x) < 0 && player.collider.x > 0.5)) {
            continue;
        }

        const direction = normalize(game.ballDirection);
        const distance = len(sub(player.collider, ball.collider));

        const b = sum(ball.collider, smul(direction, distance));
        const line: LineCollider = { a: ball.collider, b };
        console.log(line);
        if (!collideCL(line, player.collider)) {
            continue;
        }

        const collisionDistance = distance - player.collider.radius;
        const collisionPoint = sum(ball.collider, smul(direction, collisionDistance));
        const tempBallPosition = sum(ball.collider, smul(direction, collisionDistance - ball.collider.radius));
        const tempBallCollider = { radius: ball.collider.radius, ...tempBallPosition };
        const directionAfterCollision = directionCC(player.collider, tempBallCollider);
        const pointAfterCollision = smul(directionAfterCollision, collisionDistance);

        game.trajectory = [
            ball.collider,   // point 0
            collisionPoint,
            collisionPoint, // point 1
            pointAfterCollision
        ];
        return;
    }
    game.trajectory = [];
}
