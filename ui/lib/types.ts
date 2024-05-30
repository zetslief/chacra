import {
    Vec2, Point,
    CircleCollider,
    LineCollider
} from './math';

export type StateType =
    "InitialState"
    | "GameStartState"
    | "GameState"
    | "InputState"
    | "BoosterState"
    | "DeltaState"
    | "GameFinished";

export function isInitialState(item: any): item is InitialState {
    return typeof item === "object"
        && "type" in item
        && item.type === "InitialState";
}

export function isGameStartState(item: any): item is GameStartState {
    return typeof item === "object"
        && "type" in item
        && item.type === "GameStartState";
}

export function isInputState(item: any): item is InputState {
    return typeof item === "object"
        && "type" in item
        && item.type === "InputState";
}

export function isGameFinishedState(item: any): item is GameFinishedState {
    return typeof item === "object"
        && "type" in item
        && item.type == "GameFinishedState";
}

export function isDeltaState(data: any): data is DeltaState {
    return typeof data === "object"
        && "type" in data
        && data.type === "DeltaState";
}

export function isBoosterState(data: any): data is BoosterState {
    return typeof data === "object"
        && "type" in data
        && data.type === "BoosterState";
}

export type State = {
    readonly type: StateType,
};

export type InitialState = State & {
    readonly game: GameData,
    readonly players: PlayerData[],
};

export type GameData = {
    readonly fieldWidth: number,
    readonly fieldHeight: number,
};

export type PlayerData = {
    readonly name: string,
    readonly color: Color,
};

export type GameStartState = State & {
    readonly x: number,
    readonly y: number,
};

export type GameFinishedState = State & {
    readonly won: string,
};

export type DeltaState = State & {
    readonly delta: number
};

export type GameState = State & {
    fieldWidth: number,
    fieldHeight: number,
    numberOfPlayers: number,
    players: Player[],
    ballOwner: Player,
    ball: Ball,
    walls: LineCollider[],
    ballDirection: Vec2,
    boosters: (Booster | null)[],
    requestedBoosters: BoosterState[],
    boostShuffler: BoostShufflerState,
    slots: BoosterSlot[],
    obstacles: Obstacle[],
    areaBoosters: AreaBooster[],
    areaBoosterSpawners: AreaBoosterSpawnerState[],
    trajectory: Point[],
    effects: Effect[]
}

export type Color = string | CanvasGradient | CanvasPattern;

export type BoosterState = State & {
    index: number,
    name: string,
    color: Color,
};

export type Booster = {
    name: string,
    color: Color,
    collider: CircleCollider
};

export type BoostShufflerState = {
    initialized: boolean,
    readonly destinationMap: Map<Booster, Point>,
};
export type BoostShuffler = (dt: number, boosters: Booster[]) => void;

export type AreaBooster = {
    collider: CircleCollider,
    duration: number,
    color: Color
}
export type AreaBoosterSpawnerState = {
    index: number,
    count: number,
    elapsedTime: number,
    delay: number,
    player: Player,
    finished: boolean,
};
export type AreaBoosterSpawner = (dt: number, game: GameState, areaBoosters: AreaBooster[]) => void;

export type Player = {
    name: string
    size: number,
    target: Point,
    collider: CircleCollider,
    color: Color,
    speed: number,
    dead: boolean
};

export type BoosterSlot = Point & {
    size: number
};

export type Ball = {
    position: Point,
    speed: number,
    size: number,
    collider: CircleCollider
}

export type Click = Point;

export class InputState implements State {
    readonly type: StateType = "InputState";
    click?: Click;
    dx: number = 0;
    dy: number = 0;

    constructor(readonly playerName: string) { }
};

export type Obstacle = CircleCollider & { lifeCounter: number };

export type EffectType =
    "BackgroundBlink";

export type Effect = {
    type: EffectType,
    initialDuration: number,
    duration: number,
};

export interface BackgroundBlinkEffect extends Effect {
    color: Color,
    blinkCount: number
    enabled: boolean
};

export function isBackgroundBlinkEffect(effect: Effect): effect is BackgroundBlinkEffect 
{
    return effect.type == "BackgroundBlink";
}

export function createBackgroundBlinkEffect(
    duration: number,
    color: Color,
    blinkCount: number,
): BackgroundBlinkEffect {
    return {
        type: "BackgroundBlink",
        initialDuration: duration,
        duration,
        color,
        blinkCount,
        enabled: true,
    };
}
