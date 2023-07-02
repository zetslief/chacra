import { 
    GameState,
    InputState,
    Player,
    Ball,
    KnownBooster,
} from './lib/types';

import { updatePhysics } from './lib/physics';

import {
    Point,
    LineCollider,
    vec2, smul, ssum,
} from './lib/math';

import { 
    BALL_RADIUS,
    PLAYER_RADIUS,
    PLAYER_DEFAULT_SPEED,
    PLAYERS_COUNT
} from './lib/configuration';

let inputs: InputState[] = []; 
let knownBoosterQueue: KnownBooster[] = [];

onmessage = (event) => {
    if (event.data === "start") {
        const fps = 60;
        const dt = (1 / fps);
        loop(defaultState(), Date.now() - dt, dt);
    } else if ("type" in event.data) {
        if (event.data.type === "InputState") {
            const input = event.data as InputState;
            inputs.push(input);
        } else if (event.data.type === "KnownBooster") {
            knownBoosterQueue.push(event.data as KnownBooster);
        }
    }
};

function loop(game: GameState, previousFrame: number, dt: number) {
    const originalDt = dt; 
    const start = Date.now();
    dt = (start - previousFrame) / 1000;
    game.requestedBoosters = knownBoosterQueue;
    knownBoosterQueue = [];
    if (game.players.length > 1) {
        const playerInputs = [];
        for (const input of inputs) {
            const player = game.players.find(p => p.name === input.playerName)!;
            if (player) {
                playerInputs.push([player, input] as [Player, InputState]);
            }
        }
        inputs = [];
        updatePhysics(game, playerInputs, dt);
    }
    postMessage(game);
    const stop = Date.now();
    const duration = (stop - start) / 1000;
    previousFrame = start;
    if (originalDt - duration < 0) {
        loop(game, previousFrame, originalDt);
    } else {
        setTimeout(() => loop(game, previousFrame, originalDt), (originalDt - duration) * 1000);
    }
}

function defaultState(): GameState {
    type Pivot = Point & { angle: number };
    function calculatePivots(startAngle: number, angleStep: number, pivotCount: number): Pivot[] {
        let pivots = [];
        let angle = startAngle;
        for (let index = 0; index < pivotCount; index += 1) {
            let pivot = vec2(Math.cos(angle), Math.sin(angle));
            pivot = ssum(smul(pivot, 0.5), 0.5);
            pivots.push({ angle, ...pivot });
            angle += angleStep;
        }
        return pivots;
    }
    function ball(position: Point): Ball {
        const [size, radius] = [BALL_RADIUS, BALL_RADIUS];
        return { position, size, collider: { x: position.x, y: position.y, radius } };
    }
    function createPlayers(pivots: Pivot[]): Player[] {
        const [size, radius] = [PLAYER_RADIUS, PLAYER_RADIUS];
        let players = []
        for (const pivot of pivots) {
            const index: number = players.length;
            const name = "Player" + index;
            const colorValue = Math.round(index * (360 / pivots.length));
            const color = "hsl(" + colorValue + ", 80%, 70%)";
            const position = { x: pivot.x, y: pivot.y };
            const dead = false;
            players.push({
                name,
                position,
                size,
                color,
                collider: { radius, ...position },
                speed: PLAYER_DEFAULT_SPEED,
                dead });
        }
        return players;
    }
    function walls(pivots: Pivot[]): LineCollider[] {
        let walls = [];
        for (let index = 0; index < pivots.length - 1; index += 1) {
            const pivot = pivots[index];
            const nextPivot = pivots[index + 1];
            const a = pivot;
            const b = nextPivot;
            walls.push({ a, b });
        }
        walls.push({ a: pivots[pivots.length - 1], b: pivots[0] });
        return walls;
    }
    const numberOfPlayers = PLAYERS_COUNT;
    const sectionAngle = (Math.PI * 2) / numberOfPlayers
    const wallPivots = calculatePivots(0, sectionAngle, numberOfPlayers);
    const playerPivots = calculatePivots(sectionAngle / 2, sectionAngle, numberOfPlayers);
    const players = createPlayers(playerPivots);
    const randomPlayerIndex = Math.floor(Math.random() * players.length);
    return {
        type: "GameState",
        numberOfPlayers,
        players,
        ballOwner: players[randomPlayerIndex],
        ball: ball(vec2(0.5, 0.5)),
        walls: walls(wallPivots),
        ballDirection: vec2(1.0, 0.0),
        boosters: [],
        requestedBoosters: [],
        boostSpawner: {
            delay: 1,
            timeLeft: 1,
        },
        boostShuffler: {
            initialized: false,
            destinationMap: new Map(),
        },
        obstacles: [],
        areaBoosters: [],
        areaBoosterSpawners: [],
    }
}
