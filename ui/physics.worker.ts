import { 
    Player,
    Ball,
    BoosterState,
    Booster,
    InitialState, PlayerData,
    GameState, InputState, DeltaState,
    isInitialState, isGameStartState, isInputState, isDeltaState,
    isBoosterState,
} from './lib/types';

import { updatePhysics } from './lib/physics';

import {
    Point,
    LineCollider,
    vec2
} from './lib/math';

import { 
    BALL_RADIUS,
    BALL_DEFAULT_SPEED,
    PLAYER_RADIUS,
    PLAYER_DEFAULT_SPEED,
} from './lib/configuration';

let inputs: InputState[] = []; 
let boosterQueue: BoosterState[] = [];
let port: MessagePort | null = null;
let defaultGameState: GameState | null = null;

let state: GameState | null = null;

onmessage = (event) => {
    if (event.data === "connect") {
        port = event.ports[0];
        port.onmessage = (e) => e.data.forEach(processState);
    } else if (isBoosterState(event.data)) {
        boosterQueue.push(event.data);
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
    } else if (isBoosterState(data)) {
        boosterQueue.push(data);
    } else {
        console.error(`Unsupported event data:`, data);
    }
}

function physicsTick(game: GameState, delta: DeltaState) {
    const start = Date.now();
    const dt = delta.delta / 1000;
    processBoosterQueue(game, boosterQueue);
    boosterQueue = [];
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

function processBoosterQueue(game: GameState, boosterQueue: BoosterState[]) {
    for (const booster of boosterQueue) {
        if (booster.index >= game.slots.length) {
            console.error("Booster index is bigger than number of slots", booster);
            continue;
        }
        const slot = game.slots[booster.index];
        game.boosters[booster.index] = {
            name: booster.name,
            color: booster.color,
            collider: { x: slot.x, y: slot.y, radius: slot.size }
        };
    }
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
        return {
            position,
            speed: BALL_DEFAULT_SPEED,
            size,
            collider: { x: position.x, y: position.y, radius }
        };
    }
    function createPlayers(pivots: Pivot[]): Player[] {
        const [size, radius] = [PLAYER_RADIUS, PLAYER_RADIUS];
        let players = []
        for (const pivot of pivots) {
            const name: string = pivot.data.name;
            const color = pivot.data.color;
            const position = { x: pivot.x, y: pivot.y };
            const target = { x: pivot.x, y: pivot.y };
            const dead = false;
            players.push({
                name,
                size,
                color,
                target,
                collider: { radius, ...position },
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
    const boosterSlotSize = 0.05;
    return {
        type: "GameState",
        fieldWidth: initialState.game.fieldWidth,
        fieldHeight: initialState.game.fieldHeight,
        numberOfPlayers,
        players,
        ballOwner: players[randomPlayerIndex],
        ball: ball(vec2(0.5, 0.5)),
        walls: walls(),
        ballDirection: vec2(1.0, 0.0),
        boosters: Array<Booster | null>(8).fill(null),
        requestedBoosters: [],
        slots: [
            { x: 0.20, y: 0.25, size: boosterSlotSize },
            { x: 0.40, y: 0.25, size: boosterSlotSize },
            { x: 0.40, y: 0.80, size: boosterSlotSize },
            { x: 0.20, y: 0.80, size: boosterSlotSize },
            { x: 0.60, y: 0.25, size: boosterSlotSize },
            { x: 0.80, y: 0.25, size: boosterSlotSize },
            { x: 0.60, y: 0.80, size: boosterSlotSize },
            { x: 0.80, y: 0.80, size: boosterSlotSize },
            { x: 0.50, y: 0.50, size: boosterSlotSize },
        ],
        boostShuffler: {
            initialized: false,
            destinationMap: new Map(),
        },
        obstacles: [],
        areaBoosters: [],
        areaBoosterSpawners: [],
    }
}
