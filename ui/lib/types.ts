import {
    Vec2, Point,
    CircleCollider,
    LineCollider
} from './math';

export type GameState = {
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

export type KnownBooster = { name: string, color: Color, weight: number };
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

export type InputState = {
    click: Click | null,
    dx: number,
    dy: number
};

export type Obstacle = CircleCollider & { lifeCounter: number };
