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
    | "KnownBooster"
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

export function isKnownBoosterState(data: any): data is KnownBoosterState {
    return typeof data === "object"
        && "type" in data
        && data.type === "KnownBoosterState";
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
    boosters: Booster[],
    requestedBoosters: KnownBoosterState[],
    boostSpawner: BoostSpawnerState,
    boostShuffler: BoostShufflerState,
    obstacles: Obstacle[],
    areaBoosters: AreaBooster[],
    areaBoosterSpawners: AreaBoosterSpawnerState[],
}

export type Color = string | CanvasGradient | CanvasPattern;

export type KnownBoosterState = State & {
    name: string,
    color: Color,
    weight: number,
};

export type Booster = { name: string, color: Color, collider: CircleCollider };

export type BoosterValidatorState = {};
export type BoosterValidator = (gameState: GameState, booster: Booster) => boolean;

export type BoostSpawnerState = {
    readonly delay: number;
    timeLeft: number;
};
export type BoostSpawner = (dt: number, state: BoostSpawnerState, game: GameState, boosters: Booster[], validator: BoosterValidator) => void;

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
    collider: CircleCollider,
    color: Color,
    speed: number,
    dead: boolean
};

export type Ball = {
    position: Point,
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
