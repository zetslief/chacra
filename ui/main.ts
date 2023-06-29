import {
    GameState,
    InputState,
    Player,
    KnownBooster,
    Color,
    Ball, Booster, Obstacle,
    BoostSpawner,
    AreaBooster,
} from './lib/types';

import {
    Vec2, Point,
    vec2, smul, ssum,
    LineCollider,
} from './lib/math';

import {
    KNOWN_BOOSTERS,
    BOOSTER_RADIUS,
    BALL_RADIUS,
    PLAYER_RADIUS,
    PLAYER_DEFAULT_SPEED,
    PLAYERS_COUNT
} from './lib/configuration';

import {
    updatePhysics,
} from './lib/physics';

export type RenderState = {
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
};

const LINE_WIDTH = 1.00;

const BACKGROUND = "#111122";
const OVERLAY = "rgba(100, 100, 255, 0.50)";
const BALL = "#33dd33";
const OBSTACLE_COLOR = "cyan";

function setupHandlers(input: InputState) {
    document.onclick = (e) => {
        input.click = { x: e.pageX, y: e.pageY };
    };
    document.onkeydown = (e) => {
        if (e.isComposing || e.keyCode === 229) {
            return;
        }
        const key = e.code.toUpperCase();
        if (key === "ARROWUP") {
            input.dy = 1;
        }
        if (key === "ARROWDOWN") {
            input.dy = -1;
        }
    };
}

// DRAWING
function drawRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: Color
) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function fillCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: Color
) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
}

function strokeCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: Color,
    lineWidth: number
) {
    const defaultLineWidth = ctx.lineWidth;
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.lineWidth = defaultLineWidth;
}

function fillCenteredText(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    text: string,
    fontSize: number
) {
    ctx.fillStyle = "gold"; 
    ctx.font = Math.round(fontSize) + "px serif";
    const textWidth = ctx.measureText(text).width;
    ctx.fillText(text, scale.x / 2 - textWidth / 2, scale.y / 2);
}

function drawOverlay(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    color: Color,
) {
    drawRect(ctx, 0, 0, scale.x, scale.y, color);
}

function drawBackground(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
) {
    drawOverlay(ctx, scale, BACKGROUND);
}

function drawPlayer(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    player: Player,
) {
    const x = player.position.x * scale.x;
    const y = player.position.y * scale.y;
    const size = player.size * scale.x;
    fillCircle(ctx, x, y, size, player.color);
}

function drawBallOwner(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    player: Player,
) {
    const x = player.position.x * scale.x;
    const y = player.position.y * scale.y;
    const size = player.size * scale.x * 1.1;
    strokeCircle(ctx, x, y, size, BALL, LINE_WIDTH * 3);
}

function drawBall(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    ball: Ball,
    color: Color,
) {
    const x = ball.position.x * scale.x;
    const y = ball.position.y * scale.y;
    const size = ball.size * scale.x;
    fillCircle(ctx, x, y, size, color);
    strokeCircle(ctx, x, y, size, BALL, LINE_WIDTH * 2);
}

function drawBooster(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    booster: Booster) {
    const collider = booster.collider;
    const x = collider.x * scale.x;
    const y = collider.y * scale.y;
    const size = collider.radius * scale.x;
    fillCircle(ctx, x, y, size, booster.color);
}

function drawObstacle(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    obstacle: Obstacle) {
    const collider = obstacle;
    const x = collider.x * scale.x;
    const y = collider.y * scale.y;
    const size = collider.radius * scale.x;
    strokeCircle(ctx, x, y, size, OBSTACLE_COLOR, LINE_WIDTH);
    const textHeight = Math.round(size / 2);
    ctx.font = textHeight + "px Serif";
    ctx.strokeStyle = OBSTACLE_COLOR;
    const text = obstacle.lifeCounter.toString();
    const metrics = ctx.measureText(text);
    ctx.strokeText(text, x - metrics.width / 2, y + textHeight / 2);
}

function drawAreaBooster(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    areaBooster: AreaBooster,
) {
    const collider = areaBooster.collider;
    const x = collider.x * scale.x;
    const y = collider.y * scale.y;
    const radius = collider.radius * scale.y;
    strokeCircle(ctx, x, y, radius, areaBooster.color, LINE_WIDTH);
}

// PROCESSING

function draw(game: GameState, render: RenderState) {
    const ctx = render.ctx;
    const scale = vec2(render.canvas.width, render.canvas.height);
    drawBackground(ctx, scale);
    for (const particle of game.areaBoosters) {
        drawAreaBooster(ctx, scale, particle);
    }
    for (let player of game.players) {
        drawPlayer(ctx, scale, player);
    }
    drawBallOwner(ctx, scale, game.ballOwner);
    for (const obstacle of game.obstacles) {
        drawObstacle(ctx, scale, obstacle);
    }
    drawBall(ctx, scale, game.ball, game.ballOwner.color);
    for (const booster of game.boosters) {
        drawBooster(ctx, scale, booster);
    }
}

function drawFinalScreen(game: GameState, render: RenderState) {
    const ctx = render.ctx;
    const scale = vec2(render.canvas.width, render.canvas.height);
    drawOverlay(ctx, scale, OVERLAY);
    const text = game.players[0].name + " won!";
    fillCenteredText(ctx, scale, text, scale.y / 10);
}

let previousFrame = Date.now();

function loop(
    game: GameState,
    input: InputState,
    render: RenderState,
    view: PerfView,
    dt: number) {
    const originalDt = dt; 
    const start = Date.now();
    dt = (start - previousFrame) / 1000;
    if (game.players.length == 1) {
        if (input.click) {
            input.click = null;
            main();
            return;
        }
        draw(game, render);
        drawFinalScreen(game, render);
    } else {
        updatePhysics(game, input, dt);
        draw(game, render);
    }
    const stop = Date.now();
    const duration = (stop - start) / 1000;
    view.write("dt", dt * 1000);
    view.write("physics", duration * 1000);
    view.write("frame",  start - previousFrame);
    dumpGameState(game, (k, v) => view.write(k, v));
    previousFrame = start;
    if (originalDt - duration < 0) {
        requestAnimationFrame(() => loop(game, input, render, view, originalDt));
    } else {
        setTimeout(() => loop(game, input, render, view, originalDt), (originalDt - duration) * 1000);
    }
}

function setupRenderState(): RenderState {
    const canvas = document.getElementById('gameField') as HTMLCanvasElement;
    const parent = canvas.parentElement;
    const size = Math.min(parent!.clientHeight, parent!.clientWidth);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    return { canvas: canvas, ctx: ctx };
}

type Pivot = Point & { angle: number };
function calculatePivots(startAngle: number, angleStep: number, pivotCount: number): Pivot[] {
    let pivots = [];
    let angle = startAngle;
    for (let index = 0; index < pivotCount; index += 1) {
        let pivot = vec2(Math.cos(angle), Math.sin(angle));
        pivot = ssum(smul(pivot, 0.5), 0.5);
        pivots.push({ angle, ...pivot });
        angle += angleStep;
    }
    return pivots;
}

type Dump = (name: string, content: string | number) => void;
function dumpGameState(game: GameState, dump: Dump) {
    dump("players", game.players.length);
    dump("ballOwner", game.ballOwner.name);
    dump("boosters", game.boosters.length);
    dump("obstacles", game.obstacles.length);
    dump("areaBoosters", game.areaBoosters.length);
}

function main() {
    function ball(position: Point): Ball {
        const [size, radius] = [BALL_RADIUS, BALL_RADIUS];
        return { position, size, collider: { x: position.x, y: position.y, radius } };
    }
    function createPlayers(pivots: Pivot[]): Player[] {
        const [size, radius] = [PLAYER_RADIUS, PLAYER_RADIUS];
        let players = []
        for (const pivot of pivots) {
            const index: number = players.length;
            const name = "Player" + index;
            const colorValue = Math.round(index * (360 / pivots.length));
            const color = "hsl(" + colorValue + ", 80%, 70%)";
            const position = { x: pivot.x, y: pivot.y };
            const dead = false;
            players.push({
                name,
                position,
                size,
                color,
                collider: { radius, ...position },
                speed: PLAYER_DEFAULT_SPEED,
                dead });
        }
        return players;
    }
    function walls(pivots: Pivot[]): LineCollider[] {
        let walls = [];
        for (let index = 0; index < pivots.length - 1; index += 1) {
            const pivot = pivots[index];
            const nextPivot = pivots[index + 1];
            const a = pivot;
            const b = nextPivot;
            walls.push({ a, b });
        }
        walls.push({ a: pivots[pivots.length - 1], b: pivots[0] });
        return walls;
    }
    function defaultState(): GameState {
        const numberOfPlayers = PLAYERS_COUNT;
        const sectionAngle = (Math.PI * 2) / numberOfPlayers
        const wallPivots = calculatePivots(0, sectionAngle, numberOfPlayers);
        const playerPivots = calculatePivots(sectionAngle / 2, sectionAngle, numberOfPlayers);
        const players = createPlayers(playerPivots);
        const randomPlayerIndex = Math.floor(Math.random() * players.length);
        return {
            numberOfPlayers,
            players,
            ballOwner: players[randomPlayerIndex],
            ball: ball(vec2(0.5, 0.5)),
            walls: walls(wallPivots),
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
    const state = defaultState();
    const renderer = setupRenderState();
    const input = { click: null, dx: 0, dy: 0 };
    setupHandlers(input);
    const dt = (1000 / 30) / 1000;
    new BoostersView(b => state.requestedBoosters.push(b));
    var worker = new Worker("physics_worker.js");
    worker.postMessage(state);
    loop(state, input, renderer, new PerfView(), dt);
}

type Set = (arg: number | string) => void;
class PerfView {
    private readonly labels: HTMLElement;
    private readonly values: HTMLElement;
    private readonly entries: Map<string, Set> = new Map<string, Set>();

    constructor() {
        this.labels = document.getElementById("statsLabels")!;
        this.values = document.getElementById("statsValues")!;
    }

    write(key: string, value: string | number) {
        let entry = this.entries.get(key);
        if (!entry) {
            const label = document.createElement("p");
            const text = document.createElement("p");
            this.labels.appendChild(label);
            this.values.appendChild(text);
            label.innerText = key;
            entry = (v) => text.innerText = v.toString();
            this.entries.set(key, entry);
        }
        entry(value);
    }
}

class BoostersView {
    constructor(onKnownBoosterTrigger: (knownBooster: KnownBooster) => void) {
        const boosters = document.getElementById("boosters")!;
        const children = boosters.children;
        while (children.length > 0) {
            children[0].remove();
        }
        const divBoosterMap = new Map<HTMLButtonElement, KnownBooster>();
        for (var booster of KNOWN_BOOSTERS) {
            const boosterButton = document.createElement("button");
            boosterButton.type = "button";
            boosterButton.style.backgroundColor = booster.color as string;
            boosterButton.innerHTML = booster.name;
            boosterButton.onclick = (e) => {
                if (e.target instanceof HTMLButtonElement) {
                    const clickedBooster = divBoosterMap.get(e.target)!;
                    onKnownBoosterTrigger(clickedBooster);
                }
            };
            divBoosterMap.set(boosterButton, booster);
            boosters.appendChild(boosterButton);
        }
    }
}

window.onload = main;
