import { BoosterState } from './types';

export const BALL_RADIUS = 0.020;
export const BALL_MAX_RADIUS = 0.15;
export const BALL_DEFAULT_SPEED = 0.20;

export const PLAYER_RADIUS = 0.05;
export const PLAYER_DEFAULT_SPEED = 0.6;

export const BOOSTER_RADIUS = 0.020;

export const OBSTACLE_RADIUS = 0.030;

export const AREA_BOOSTER_RADIUS = 0.10;
export const AREA_BOOSTER_DURATION = 4;

export const BOOSTER_SCALE = 1.1;

export const KNOWN_BOOSTERS: ((index: number) => BoosterState)[] = [
    (index) => (
        { type: "BoosterState", name: "biggerPlayer", color: "purple", index }
    ),
    (index) => (
        { type: "BoosterState", name: "fasterPlayer", color: "yellow", index }
    ),
    (index) => (
        { type: "BoosterState", name: "slowerPlayer", color: "darkyellow", index }
    ),
    (index) => (
        { type: "BoosterState", name: "biggerBall", color: "lightgreen", index }
    ),
    (index) => (
        { type: "BoosterState", name: "fasterBall", color: "lightblue", index }
    ),
    (index) => (
        { type: "BoosterState", name: "slowerBall", color: "lightblue", index }
    ),
];
