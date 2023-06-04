import {
    Vec2, Point,
    CircleCollider,
    LineCollider
} from './lib/math';

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
}

export type Color = string | CanvasGradient | CanvasPattern;

export type KnownBooster = { name: string, color: Color, weight: number };
export type Booster = { name: string, color: Color, collider: CircleCollider };
export type BoostSpawner = (dt: number, boosters: Booster[]) => void;
export type BoostShuffler = (dt: number, boosters: Booster[]) => void;

export type Player = {
    name: string
    position: Point,
    size: number,
    collider: CircleCollider,
    color: Color,
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
