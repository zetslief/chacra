import {
    GameState,
    InputState,
    KnownBooster,
} from './lib/types';

import {
    drawBackground,
    drawAreaBoosters,
    drawPlayer,
    drawBallOwner,
    drawObstacle,
    drawBall,
    drawBooster,
    drawOverlay,
    fillCenteredText,
} from './lib/render';

import { vec2, } from './lib/math';

import { KNOWN_BOOSTERS } from './lib/configuration';

export type RenderState = {
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
};


// PROCESSING

function draw(game: GameState, render: RenderState) {
    const ctx = render.ctx;
    const scale = vec2(render.canvas.width, render.canvas.height);
    drawBackground(ctx, scale);
    drawAreaBoosters(ctx, scale, game.areaBoosters);
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
    drawOverlay(ctx, scale);
    const text = game.players[0].name + " won!";
    fillCenteredText(ctx, scale, text, scale.y / 10);
}

let frameSkipCounter = 0;
function loop(render: RenderState, view: PerfView) {
    if (!newState) {
        requestAnimationFrame(() => loop(render, view));
        ++frameSkipCounter;
        view.write("frames skipped", frameSkipCounter);
        return;
    }
    frameSkipCounter = 0;
    view.write("frames skipped", frameSkipCounter);
    const start = Date.now();
    const game = newState;
    newState = null;
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
    dump("areaBoosterSpawners", game.areaBoosterSpawners.length);
    dump("areaBoosters", game.areaBoosters.duration.length);
}

let newState: GameState | null = null;
async function main() {
    const renderer = setupRenderState();
    const perfView = new PerfView();

    const physicsWorker = new Worker("/physics.worker.js");
    const networkWorker = new Worker("/network.worker.js");

    physicsWorker.onmessage = (e) => {
        perfView.write("physics time, ms", e.data);
    };
    setupInputHandlers((input) => physicsWorker.postMessage(input));
    new BoostersView(b => physicsWorker.postMessage(b));

    const messageChannel = new MessageChannel();
    physicsWorker.postMessage("connect", [ messageChannel.port1 ]);
    networkWorker.postMessage("connect", [ messageChannel.port2 ]);

    physicsWorker.postMessage("start");
    networkWorker.postMessage("start");

    while (!newState) {
        newState = await getGameState();
    }
    setInterval(async () => {
        const state = await getGameState();
        if (state) {
            newState = state;
        }
    }, 30);
    loop(renderer, perfView);
}

async function getGameState(): Promise<GameState | null> {
    const response = await fetch("http://localhost:5000/game/state");
    if (response.ok) {
        const jsonString = await response.json();
        if (jsonString.length > 0) {
            return JSON.parse(jsonString);
        }
    } else {
        console.error("Failed to get game state");
        console.error(response);
    }
    return null;
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
