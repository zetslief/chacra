import { 
    InitialState,
    GameState,
    InputState,
    Player,
    Ball,
    KnownBooster,
    isInitialState,
    isGameStartState,
    isInputState,
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
let defaultGameState: GameState | null = null;

onmessage = (event) => {
    if (event.data === "connect") {
        port = event.ports[0];
        port.onmessage = (e) => {
            if (isInputState(e.data)) {
                inputs.push(e.data);
            } else if (isInitialState(e.data)) {
                defaultGameState = defaultState(e.data);
            } else if (isGameStartState(e.data)) {
                if (!defaultGameState) {
                    console.error("Default game state is not initialzed, cannot process GameStart state.");
                    return;
                }
                defaultGameState!.ball.position.x = e.data.x;
                defaultGameState!.ball.position.y = e.data.y;
                const fps = 60;
                const dt = (1 / fps);
                loop(defaultGameState!, Date.now() - dt, dt);
            } else {
                console.error(`Unsupported event data:`, e.data);
            }
        };
    } else if ("type" in event.data) {
        if (event.data.type === "KnownBooster") {
            knownBoosterQueue.push(event.data as KnownBooster);
        }
    } else {
        console.error("Unknown event data from message", event.data);
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

function defaultState(initialState: InitialState): GameState {
    type Pivot = Point & {
        name: string
    };
    function calculatePivots(players: string[]): Pivot[] {
        const result: Pivot[] = [];
        const angleOffset = Math.PI;
        const stepAngle = 2 * Math.PI / players.length;
        for (let index = 0; index < players.length; ++index) {
            const name = players[index];
            const angle = (stepAngle * index) + angleOffset;
            let x = Math.cos(angle);
            let y = Math.sin(angle);
            console.log(x, y, angle, angleOffset);
            x = (x + 1) * 0.5;
            y = (y + 1) * 0.5;
            result.push({name, x, y});
        }
        return result;
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
    const numberOfPlayers = initialState.players.length;
    const playerPivots = calculatePivots(initialState.players);
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
