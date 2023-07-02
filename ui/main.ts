import {
    GameState,
    InputState,
    Player,
    KnownBooster,
    Color,
    Ball, Booster, Obstacle,
    AreaBooster,
} from './lib/types';

import { Vec2, vec2, } from './lib/math';

import { KNOWN_BOOSTERS } from './lib/configuration';

export type RenderState = {
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
};

const LINE_WIDTH = 1.00;

const BACKGROUND = "#111122";
const OVERLAY = "rgba(100, 100, 255, 0.50)";
const BALL = "#33dd33";
const OBSTACLE_COLOR = "cyan";

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

let frameSkipCounter = 0;
function loop(render: RenderState, view: PerfView) {
    if (!newState) {
        requestAnimationFrame(() => loop(render, view));
        ++frameSkipCounter;
        view.write("Frames skipped", frameSkipCounter);
        return;
    }
    view.write("frames skipped", frameSkipCounter);
    frameSkipCounter = 0;
    const game = newState;
    newState = null;
    const start = Date.now();
    if (game.players.length == 1) {
        draw(game, render);
        drawFinalScreen(game, render);
    } else {
        draw(game, render);
    }
    const stop = Date.now();
    view.write("frame time, ms", (stop - start));
    dumpGameState(game, (k, v) => view.write(k, v));
    requestAnimationFrame(() => loop(render, view));
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

function setupInputHandlers(update: (state: InputState) => void) {
    const input: InputState = new InputState("Player4");
    document.onclick = (e) => {
        input.click = { x: e.pageX, y: e.pageY };
        update(input);
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
        update(input);
    };
}

type Dump = (name: string, content: string | number) => void;
function dumpGameState(game: GameState, dump: Dump) {
    dump("players", game.players.length);
    dump("ballOwner", game.ballOwner.name);
    dump("boosters", game.boosters.length);
    dump("obstacles", game.obstacles.length);
    dump("areaBoosters", game.areaBoosters.length);
}

let newState: GameState | null = null;
function main() {
    const renderer = setupRenderState();
    var worker = new Worker("./physics.worker.js");
    worker.onmessage = (e) => newState = e.data as GameState;
    setupInputHandlers((input) => worker.postMessage(input));
    new BoostersView(b => worker.postMessage(b));
    worker.postMessage("start");
    loop(renderer, new PerfView());
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
