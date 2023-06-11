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
    boostSpawner: BoostSpawner,
    boostShuffler: BoostShuffler,
    obstacles: Obstacle[],
    areaBoosters: AreaBooster[],
}

export type Color = string | CanvasGradient | CanvasPattern;

export type KnownBooster = { name: string, color: Color, weight: number };
export type Booster = { name: string, color: Color, collider: CircleCollider };
export type BoosterValidator = (gameState: GameState, booster: Booster) => boolean;
export type BoostSpawner = (dt: number, game: GameState, boosters: Booster[], validator: BoosterValidator) => void;
export type BoostShuffler = (dt: number, boosters: Booster[]) => void;

export type AreaBooster = {
    collider: CircleCollider,
    duration: number,
    color: Color
}

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
