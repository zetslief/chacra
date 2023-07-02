import {
    Vec2, Point,
    CircleCollider,
    LineCollider
} from './math';

export type StateType = 
    "GameState"
    | "InputState"
    | "KnownBooster";

export type State = {
    readonly type: StateType;
};

export type GameState = State & {
    numberOfPlayers: number,
    players: Player[],
    ballOwner: Player,
    ball: Ball,
    walls: LineCollider[],
    ballDirection: Vec2,
    boosters: Booster[],
    requestedBoosters: KnownBooster[],
    boostSpawner: BoostSpawnerState,
    boostShuffler: BoostShufflerState,
    obstacles: Obstacle[],
    areaBoosters: AreaBooster[],
    areaBoosterSpawners: AreaBoosterSpawnerState[],
}

export type Color = string | CanvasGradient | CanvasPattern;

export type KnownBooster = State & { name: string, color: Color, weight: number };
export type Booster = { name: string, color: Color, collider: CircleCollider };

export type BoosterValidatorState = { };
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
    position: Point,
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
    readonly playerName: string;
    click?: Click;
    dx: number = 0;
    dy: number = 0;

    constructor(playerName: string) {
        this.playerName = playerName;
    }
};

export type Obstacle = CircleCollider & { lifeCounter: number };
