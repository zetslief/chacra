import { 
    Player,
    Ball,
    KnownBoosterState,
    InitialState, PlayerData,
    GameState, InputState, DeltaState,
    isInitialState, isGameStartState, isInputState, isDeltaState,
    isKnownBoosterState,
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
let knownBoosterQueue: KnownBoosterState[] = [];
let port: MessagePort | null = null;
let defaultGameState: GameState | null = null;

let state: GameState | null = null;

onmessage = (event) => {
    if (event.data === "connect") {
        port = event.ports[0];
        port.onmessage = (e) => e.data.forEach(processState);
    } else if (isKnownBoosterState(event.data)) {
        knownBoosterQueue.push(event.data);
    } else {
        console.error("Unknown event data from message", event.data);
    }
};

function processState(data: any) {
    if (isInputState(data)) {
        inputs.push(data);
    } else if (isInitialState(data)) {
        defaultGameState = defaultState(data);
        console.log("game init");
    } else if (isGameStartState(data)) {
        console.log("game started");
        if (!defaultGameState) {
            console.error("Default game state is not initialzed, cannot process GameStart state.");
            return;
        }
        state = {...defaultGameState};
        state.ball.position.x = data.x;
        state.ball.position.y = data.y;
    } else if (isDeltaState(data)) {
        if (!state) {
            console.warn("Skipping delta time, no state initialized!", data);
            return;
        }
        physicsTick(state, data);
    } else if (isKnownBoosterState(data)) {
        knownBoosterQueue.push(data);
    } else {
        console.error(`Unsupported event data:`, data);
    }
}

function physicsTick(game: GameState, delta: DeltaState) {
    const start = Date.now();
    const dt = delta.delta / 1000;
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
}

function defaultState(initialState: InitialState): GameState {
    type Pivot = Point & {
        data: PlayerData
    };
    function calculatePivots(players: PlayerData[]): Pivot[] {
        const result: Pivot[] = [];
        const angleOffset = Math.PI;
        const stepAngle = 2 * Math.PI / players.length;
        for (let index = 0; index < players.length; ++index) {
            const angle = (stepAngle * index) + angleOffset;
            let x = Math.cos(angle);
            let y = Math.sin(angle);
            console.log(x, y, angle, angleOffset);
            x = (x + 1) * 0.5;
            y = (y + 1) * 0.5;
            console.log(players);
            result.push({x, y, data: players[index]});
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
            const name: string = pivot.data.name;
            const color = pivot.data.color;
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
