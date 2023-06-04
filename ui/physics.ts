import {
    GameState,
    InputState,
    Player,
    Ball,
    Booster, BoostShuffler,
    Obstacle
} from './lib/types';

import {
    BOOSTER_SCALE,
    OBSTACLE_RADIUS,
} from './configuration';

import {
    Vec2, Point,
    vec2, smul, sum, sub, ssum, normalize, len,
    CircleCollider,
    collideCC,
} from './lib/math';


export function updatePhysics(game: GameState, input: InputState, dt: number) {
    function movePlayer(player: Player, dx: number, dy: number) {
        const step = (Math.PI / 2) * dt * dy;
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
            game.ball.collider.radius *= BOOSTER_SCALE;
        } else if (boosterName == "shuffleBoosters") {
            game.boostShuffler = createBoostShuffler();
        } else if (boosterName == "obstacle") {
            game.obstacles.push(createObstacle());
        } else if (boosterName == "deathBall") {
            player.dead = true;
        }
    }
    function collideBallAndBooster(game: GameState, ball: Ball, booster: Booster, player: Player): boolean {
        while (game.requestedBoosters.length > 0) {
            const requestedBooster = game.requestedBoosters.pop()!;
            processBooster(game, requestedBooster.name, player);
        }
        if (collideCC(ball.collider, booster.collider)) {
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
    function processInput(players: Player[], input: InputState) {
        if (players.length == 0) {
            return;
        }
        if (input.dx != 0 || input.dy != 0) {
            movePlayer(players[0], input.dx, input.dy)
            input.dx = 0;
            input.dy = 0;
        }
        let index = 1;
        while (index < players.length) {
            if (Math.random() > 0.95) {
                const dx = Math.round((Math.random() - 0.5) * 2);
                const dy = Math.round((Math.random() - 0.5) * 2);
                movePlayer(players[index], dx, dy);
            }
            index += 1;
        }
    }
    processInput(game.players, input);
    moveBall(game.ball, game.ballDirection, dt);
    for (const player of game.players) {
        if (collideBallAndPlayer(game.ball, player.collider, game.ballDirection)) {
            game.ballOwner = player;
            game.ballDirection = normalize(game.ballDirection);
            break;
        }
    }
    collideBallAndObstacle(game, game.ball);
    game.boostShuffler(dt, game.boosters);
    let boosters = []
    for (const booster of game.boosters) {
        const collided = collideBallAndBooster(game, game.ball, booster, game.ballOwner);
        if (!collided) {
            boosters.push(booster);
        }
    }
    game.players = game.players.filter(player => !player.dead);
    game.boosters = boosters;
    if (game.ballOwner.dead) {
        if (game.players.length > 0) {
            const randomPlayerIndex = Math.floor(Math.random() * game.players.length);
            game.ballOwner = game.players[randomPlayerIndex];
        }
    }
}

export function createBoostShuffler(): BoostShuffler {
    let initialized = false;
    const destinationMap = new Map<Booster, Point>();
    return (dt, boosters) => {
        if (!initialized) {
            for (const booster of boosters) {
                let destination = smul(ssum(booster.collider, -0.5), 2)
                destination = smul(destination, -1);
                destination = ssum(smul(destination, 0.5), 0.5);
                destinationMap.set(booster, destination);
            }
            initialized = true;
        }
        for (const booster of boosters) {
            if (!destinationMap.has(booster)) {
                destinationMap.delete(booster);
            }
        }
        for (const [booster, destination] of destinationMap.entries()) {
            const step = 0.10 * dt;
            const direction = normalize(sub(destination, booster.collider));
            booster.collider = {
                radius: booster.collider.radius,
                ...sum(booster.collider, smul(direction, step))
            };
            // TODO: remove this mutation from the loop!
            if (len(sub(booster.collider, destination)) < 0.0050) {
                destinationMap.delete(booster);
            }
        }
    }
}

function createObstacle(): Obstacle {
    let position = vec2(Math.random(), Math.random());
    position = smul(position, 0.7);
    return {
        lifeCounter: 3,
        radius: OBSTACLE_RADIUS,
        ...position
    };
}