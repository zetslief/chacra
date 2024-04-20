import {
    GameState,
    InputState,
    BoosterState,
} from './lib/types';

import {
    drawBackground,
    drawAreaBooster,
    drawPlayer,
    drawBallOwner,
    drawObstacle,
    drawBall,
    drawBooster,
    drawBoosterSlot,
    drawOverlay,
    drawLine,
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
    drawLine(ctx, scale, { x: 0.5, y: 0 }, { x: 0.5, y: 1 });
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
    for (const slot of game.slots) {
        drawBoosterSlot(ctx, scale, slot);
    }
    drawBall(ctx, scale, game.ball, game.ballOwner.color);
    for (const booster of game.boosters) {
        if (!booster) {
            continue;
        }
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
let exited = false;
let gameFieldSet = false;
function loop(render: RenderState, view: PerfView) {
    const newState = newStates.shift();
    if (!newState) {
        requestAnimationFrame(() => loop(render, view));
        ++frameSkipCounter;
        view.write("frames skipped", frameSkipCounter);
        return;
    }
    if (!gameFieldSet) {
        render.canvas.width = newState.fieldWidth;
        render.canvas.height = newState.fieldHeight;
        gameFieldSet = true;
        console.log("Game field is set:", newState.fieldWidth, newState.fieldHeight);
    }
    frameSkipCounter = 0;
    view.write("frames skipped", frameSkipCounter);
    const start = Date.now();
    const game = newState;
    if (game.players.length == 1) {
        draw(game, render);
        drawFinalScreen(game, render);
        if (!exited) {
            setTimeout(() => { location.assign("/"); }, 5 * 1000);
            exited = true;
        }
    } else {
        draw(game, render);
    }
    const stop = Date.now();
    view.write("frame time, ms", (stop - start));
    dumpGameState(game, (k, v) => view.write(k, v));
    loop(render, view);
}

function setupRenderState(): RenderState {
    const canvas = document.getElementById('gameField') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    return { canvas: canvas, ctx: ctx };
}

function setupInputHandlers(renderState: RenderState, update: (state: InputState) => void) {
    function sendClick(event: MouseEvent) {
        const input: InputState = new InputState(playerName);
        const width = renderState.canvas.offsetWidth;
        const height = renderState.canvas.offsetHeight;
        input.click = {
            x: event.offsetX / width,
            y: event.offsetY / height,
        };
        update(input);
    }

    const playerName = sessionStorage.getItem("playerName")!;
    renderState.canvas.onclick = sendClick;
    document.onmousemove = (e) => {
        if (e.ctrlKey) {
            sendClick(e);
        }
    };
    document.onkeydown = (e) => {
        const input: InputState = new InputState(playerName);
        if (e.isComposing) {
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
    dump("areaBoosters", game.areaBoosters.length);
}

const newStates: GameState[] = [];
async function main() {
    const renderer = setupRenderState();
    const perfView = new PerfView();

    const physicsWorker = new Worker("/physics.worker.js");
    const networkWorker = new Worker("/network.worker.js");

    physicsWorker.onmessage = (e) => {
        perfView.write("physics time, ms", e.data);
    };
    networkWorker.onmessage = (e) => {
        const newState = e.data as GameState;
        newStates.push(newState);
        if (newState.players.length == 1) {
            networkWorker.postMessage({
                type: "GameFinishedState",
            });
        }
    };
    setupInputHandlers(renderer, (input) => networkWorker.postMessage(input));
    new BoostersView(b => physicsWorker.postMessage(b));

    const messageChannel = new MessageChannel();
    physicsWorker.postMessage("connect", [ messageChannel.port1 ]);
    networkWorker.postMessage("connect", [ messageChannel.port2 ]);

    const playerName = sessionStorage.getItem("playerName");
    networkWorker.postMessage(playerName);
    networkWorker.postMessage("start");

    loop(renderer, perfView);
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
    constructor(onKnownBoosterTrigger: (knownBooster: BoosterState) => void) {
        const boosters = document.getElementById("boosters")!;
        const children = boosters.children;
        while (children.length > 0) {
            children[0].remove();
        }
        const divBoosterMap = new Map<HTMLButtonElement, BoosterState>();
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
