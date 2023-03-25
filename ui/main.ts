const BLACK = "black";
const BACKGROUND = "#3333dd";
const PLAYER = "#ff3333";

const DEFAULT_RADIUS = 0.01;
const DEFAULT_CLICK_RADIUS = 0.003;
const PLAYER_SIZE = 0.1;
const LINE_WIDTH = 1;

// MATHTYPE

interface Vec2 { x: number, y: number };
interface Direction extends Vec2 { };
interface Point extends Vec2 { };

function vec2(x: number, y: number): Vec2 {
    return { x, y };
}

function mul(vec: Vec2, value: number) {
    return { x: vec.x * value, y: vec.y * value };
}

function len(vec: Vec2): number {
    return distance(vec2(0, 0), vec);
}

function distance(from: Point, to: Point): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function sub(left: Vec2, right: Vec2): Vec2 {
    return { x: left.x - right.x, y: left.y - right.y };
}

function normalize(v: Vec2) {
    return direction(vec2(0, 0), v);
}

function direction(from: Point, to: Point): Vec2 {
    const dst = distance(from, to);
    if (dst < 0.001) {
        console.warn("Small distance", dst);
        return vec2(0, 0);
    }
    return vec2(
        (to.x - from.x) / dst,
        (to.y - from.y) / dst
    );
}

// COLLISIONS

type CircleCollider = Point & {
    radius: number
}

function collide(first: CircleCollider, second: CircleCollider): boolean {
    const diff = sub(first, second);
    return len(diff) < (first.radius + second.radius);
}

function insideCircle(circle: CircleCollider, point: Point): boolean {
    const diff = sub(circle, point);
    return len(diff) <= circle.radius;
}

// GAME

type GameState = {
    players: Player[],
}

type Color = string | CanvasGradient | CanvasPattern;

type Player = {
    name: string
    position: Point,
    collider: CircleCollider
};

type RenderState = {
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
};

type Click = Point;

type InputState = {
    click: Click | null,
    dx: number,
    dy: number
};

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
            input.dy = -1;
        }
        if (key === "ARROWDOWN") {
            input.dy = 1;
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

function drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
) {
    drawRect(ctx, 0, 0, width, height, BACKGROUND);
}

function drawPlayer(
    ctx: CanvasRenderingContext2D,
    player: Player,
    scale: number
) {
    const x = player.position.x * scale;
    const y = player.position.y * scale;
    const size = player.collider.radius * scale;
    fillCircle(ctx, x, y, size, PLAYER);
    strokeCircle(ctx, x, y, size, "darkred", LINE_WIDTH);
}

function drawCollider(ctx: CanvasRenderingContext2D, collider: CircleCollider, scale: number) {
    const x = collider.x * scale;
    const y = collider.y * scale;
    const size = collider.radius * scale;
    strokeCircle(ctx, x, y, size, "lightgreen", LINE_WIDTH * 2);
}

// PROCESSING

function updatePhysics(game: GameState, input: InputState, dt: number) {
    function movePlayer(player: Player, dx: number, dy: number) {
        const step = 0.001;
        const {x, y} = player.position;
        player.position = vec2(x + dx * step * dt, y + dy * step * dt);
        player.collider.x = player.position.x;
        player.collider.y = player.position.y;
    }
    function processInput(game: GameState, input: InputState) {
        if (input.dx != 0 || input.dy != 0) {
            for (const player of game.players) {
                movePlayer(player, input.dx, input.dy)
            }
            input.dx = 0;
            input.dy = 0;
        }
    }
    processInput(game, input);
}

// MAIN

function draw(state: GameState, render: RenderState) {
    const ctx = render.ctx;
    const size = Math.min(render.canvas.width, render.canvas.height);
    drawBackground(ctx, size, size);
    for (let player of state.players)
    {
        drawPlayer(ctx, player, size);
        drawCollider(ctx, player.collider, size);
    }
}

function loop(game: GameState, input: InputState,  render: RenderState, dt: number) {
    updatePhysics(game, input, dt);
    draw(game, render);
    requestAnimationFrame(() => loop(game, input, render, dt));
}

function setupRenderState(): RenderState {
    const canvas = document.getElementById('gameField') as HTMLCanvasElement;
    const size = Math.min(window.innerWidth, window.innerHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    return { canvas: canvas, ctx: ctx };
}

function main() {
    function player(name: string, position: Point) {
        const radius = 0.1;
        return { name, position, collider: { x: position.x, y: position.y, radius }};
    }
    function defaultState(): GameState {
        return {
            players: [
                player("Left", vec2(0, 0.5)),
                player("Right", vec2(1, 0.5)),
            ]
        }
    }
    const state = defaultState();
    const renderer = setupRenderState();
    const input = { click: null, dx: 0, dy: 0 };
    setupHandlers(input);
    const dt = (1000 / 16);
    loop(state, input, renderer, dt);
}

main();

