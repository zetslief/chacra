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
    vec2
} from './lib/math';

import { 
    BALL_RADIUS,
    PLAYER_RADIUS,
    PLAYER_DEFAULT_SPEED,
} from './lib/configuration';

let inputs: InputState[] = []; 
let knownBoosterQueue: KnownBooster[] = [];
let port: MessagePort | null = null;

onmessage = (event) => {
    if (event.data === "connect") {
        port = event.ports[0];
        port.onmessage = (e) => {
            inputs.push(e.data as InputState);
        };
    } else if (event.data === "start") {
        const fps = 60;
        const dt = (1 / fps);
        loop(defaultState(), Date.now() - dt, dt);
    } else if ("type" in event.data) {
        if (event.data.type === "KnownBooster") {
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
    if (port) {
        port.postMessage(game);
    }
    const stop = Date.now();
    postMessage((stop - start).toString());
    const duration = (stop - start) / 1000;
    previousFrame = start;
    if (originalDt - duration < 0) {
        loop(game, previousFrame, originalDt);
    } else {
        setTimeout(() => loop(game, previousFrame, originalDt), (originalDt - duration) * 1000);
    }
}

function defaultState(): GameState {
    type Pivot = Point & {
        name: string
    };
    function calculatePivots(playerOne: string, playerTwo: string): Pivot[] {
        return [
            { name: playerOne, ...vec2(0.0, 0.5) },
            { name: playerTwo, ... vec2(1.0, 0.5) }
        ];
    }
    function ball(position: Point): Ball {
        const [size, radius] = [BALL_RADIUS, BALL_RADIUS];
        return { position, size, collider: { x: position.x, y: position.y, radius } };
    }
    function createPlayers(pivots: Pivot[]): Player[] {
        const [size, radius] = [PLAYER_RADIUS, PLAYER_RADIUS];
        let players = []
        for (const pivot of pivots) {
            const index: number = Math.random();
            const name: string = pivot.name;
            const colorValue = Math.round(index * 360);
            const color = "hsl(" + colorValue + ", 80%, 70%)";
            const position = { x: pivot.x, y: pivot.y };
            const dead = false;
            players.push({
                name,
                size,
                color,
                colliders: { bottom: { radius, ...position }, top: { radius, ...position } },
                speed: PLAYER_DEFAULT_SPEED,
                dead });
        }
        return players;
    }
    function walls(): LineCollider[] {
        return [
            { a: vec2(0.0, 0.0), b: vec2(0.0, 1.0) },
            { a: vec2(0.0, 1.0), b: vec2(1.0, 1.0) },
            { a: vec2(1.0, 1.0), b: vec2(1.0, 0.0) },
            { a: vec2(1.0, 0.0), b: vec2(0.0, 0.0) },
        ];
    }
    const numberOfPlayers = 2;
    const playerPivots = calculatePivots("New Player", "New Player2");
    const players = createPlayers(playerPivots);
    const randomPlayerIndex = Math.floor(Math.random() * players.length);
    return {
        type: "GameState",
        numberOfPlayers,
        players,
        ballOwner: players[randomPlayerIndex],
        ball: ball(vec2(0.5, 0.5)),
        walls: walls(),
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
