import { KnownBoosterState } from './types';

export const BALL_RADIUS = 0.020;
export const BALL_MAX_RADIUS = 0.15;

export const PLAYER_RADIUS = 0.05;
export const PLAYER_DEFAULT_SPEED = 0.6;

export const BOOSTER_RADIUS = 0.020;

export const OBSTACLE_RADIUS = 0.030;

export const AREA_BOOSTER_RADIUS = 0.10;
export const AREA_BOOSTER_DURATION = 4;

export const BOOSTER_SCALE = 1.1;

export const BIGGER_PLAYER_WEIGHT = 40;
export const BIGGER_BALL_WEIGHT = 30
export const SHUFFLE_BOOSTERS_WEIGHT = 10
export const DEATH_BALL_WEIGHT = 10;
export const OBSTACLE_WEIGHT = 20;
export const MEGA_ELECTRIC_WEIGHT = 10;

export const KNOWN_BOOSTERS: KnownBoosterState[] = [
    { type: "KnownBooster", name: "biggerPlayer", color: "purple", weight: BIGGER_PLAYER_WEIGHT },
    { type: "KnownBooster", name: "biggerBall", color: "lightgreen", weight: BIGGER_BALL_WEIGHT },
    { type: "KnownBooster", name: "shuffleBoosters", color: "yellow", weight: SHUFFLE_BOOSTERS_WEIGHT },
    { type: "KnownBooster", name: "deathBall", color: "red", weight: DEATH_BALL_WEIGHT },
    { type: "KnownBooster", name: "obstacle", color: "gold", weight: OBSTACLE_WEIGHT },
    { type: "KnownBooster", name: "megaElectric", color: "cyan", weight: MEGA_ELECTRIC_WEIGHT },
];
