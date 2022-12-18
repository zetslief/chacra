const BLACK = "black";
const BACKGROUND = "#3333dd"
const PLAYER = "#ff3333"

type GameState = {
    loopInterval: number,
    player: Player,
    spell: Spell | null,
    inputState: InputState
}

type Color = string | CanvasGradient | CanvasPattern;

type Player = {
    x: number,
    y: number,
    size: number,
    chakra: Chakra
}

type RenderState = {
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
}

type Chakra = { timeout: number }
type Cast = { x: number, y: number }
type Spell = {
    x0: number, y0: number,
    x1: number, y1: number,
    speed: number
}

type InputState = {
    cast: Cast | null
}
type InputUpdate = {
    cast: Cast | null
}

function setupState(): GameState {
    return {
        loopInterval: 100,
        player: { x: 40, y: 40, size: 20, chakra: { timeout: 0 } },
        spell: null,
        inputState: { cast: null },
    };
}

function setupHandlers(inputState: InputState) {
    document.addEventListener("click", (e) => {
        inputState.cast = { x: e.pageX, y: e.pageY };
    });
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

function drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
) {
    drawRect(ctx, 0, 0, width, height, BACKGROUND);
}

function drawPlayer(
    ctx: CanvasRenderingContext2D,
    player: Player
) {
    ctx.fillStyle = PLAYER;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, 2 * Math.PI);
    ctx.fill();
}

function drawSpell(
    ctx: CanvasRenderingContext2D,
    spell: Spell
) {
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.arc(spell.x1, spell.y1, 20 / 2, 0, 2 * Math.PI);
    ctx.fill();
}

// PROCESSING
function processInput(inputState: InputState): InputUpdate {
    let input: InputUpdate = { cast: null };
    if (inputState.cast) {
        input.cast = inputState.cast;
        inputState.cast = null;
    }
    return input;
}

function applyInput(state: GameState, inputChange: InputUpdate) {
    function spell(x0: number, y0: number, x1: number, y1: number): Spell {
        return { x0: x0, y0: y0, x1: x1, y1: y1, speed: 10 };
    }
    if (inputChange.cast) {
        state.spell = spell(state.player.x, state.player.y, inputChange.cast.x, inputChange.cast.y);
        console.log(state.spell);
    }
}

function updatePhysics(_state: GameState) {
}

// MAIN

function draw(state: GameState, render: RenderState) {
    const canvas = render.canvas;
    const ctx = render.ctx;
    drawBackground(ctx, canvas.width, canvas.height);
    drawPlayer(ctx, state.player)
    if (state.spell) {
        drawSpell(ctx, state.spell);
    }
}

function loop(game: GameState, render: RenderState) {
    const update = processInput(game.inputState);
    applyInput(game, update);
    updatePhysics(game);
    draw(game, render)
}

function setupRenderState(): RenderState {
    const canvas = document.getElementById('gameField') as HTMLCanvasElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    return { canvas: canvas, ctx: ctx };
}

function main() {
    const state = setupState();
    const renderState = setupRenderState();
    setupHandlers(state.inputState)
    setInterval(() => loop(state, renderState), state.loopInterval);
}

main()
