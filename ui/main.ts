const BLACK = "black";
const BACKGROUND = "#3333dd";
const PLAYER = "#ff3333";
const BALL = "#33dd33";

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

function smul(vec: Vec2, value: number): Vec2 {
    return { x: vec.x * value, y: vec.y * value };
}

function vmul(left: Vec2, right: Vec2): Vec2 {
    return { x: left.x * right.x, y: left.y * right.y };
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

function sum(left: Vec2, right: Vec2): Vec2 {
    return { x: left.x + right.x, y: left.y + right.y };
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
    ball: Ball,
    ballDirection: Vec2
}

type Color = string | CanvasGradient | CanvasPattern;

type Player = {
    name: string
    position: Point,
    size: number,
    collider: CircleCollider
};

type Ball = {
    position: Point,
    size: number,
    collider: CircleCollider
}

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
    scale: Vec2,
) {
    drawRect(ctx, 0, 0, scale.x, scale.y, BACKGROUND);
}

function drawPlayer(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    player: Player,
) {
    const x = player.position.x * scale.x;
    const y = player.position.y * scale.y;
    const size = player.size * scale.y;
    fillCircle(ctx, x, y, size, PLAYER);
    strokeCircle(ctx, x, y, size, "darkred", LINE_WIDTH);
}

function drawBall(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    ball: Ball,
) {
    const x = ball.position.x * scale.x;
    const y = ball.position.y * scale.y;
    const size = ball.size * scale.y;
    fillCircle(ctx, x, y, size, BALL);
    strokeCircle(ctx, x, y, size, "darkred", LINE_WIDTH);
}

function drawCollider(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    collider: CircleCollider) {
    const x = collider.x * scale.x;
    const y = collider.y * scale.y;
    const size = collider.radius * scale.y;
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
    function moveBall(ball: Ball, direction: Vec2, dt: number) {
        const step = 0.00005;
        ball.position = sum(ball.position, smul(smul(direction, dt), step));
        ball.collider.x = ball.position.x;
        ball.collider.y = ball.position.y;
        if (ball.position.x - ball.size / 2 <= 0 || ball.position.x + ball.size / 2 >= 1) {
            direction.x = -direction.x;
        }
        if (ball.position.y - ball.size / 2 <= 0 || ball.position.y + ball.size / 2 >= 1) {
            direction.y = -direction.y;
        }
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
    moveBall(game.ball, game.ballDirection, dt);
}

// MAIN

function draw(state: GameState, render: RenderState) {
    const ctx = render.ctx;
    const scale = vec2(render.canvas.width, render.canvas.height);
    drawBackground(ctx, scale);
    for (let player of state.players)
    {
        drawPlayer(ctx, scale, player);
        drawCollider(ctx, scale, player.collider);
    }
    drawBall(ctx, scale, state.ball); 
    drawCollider(ctx, scale, state.ball.collider); 
}

function loop(game: GameState, input: InputState,  render: RenderState, dt: number) {
    updatePhysics(game, input, dt);
    draw(game, render);
    requestAnimationFrame(() => loop(game, input, render, dt));
}

function setupRenderState(): RenderState {
    const canvas = document.getElementById('gameField') as HTMLCanvasElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    return { canvas: canvas, ctx: ctx };
}

function main() {
    function player(name: string, position: Point): Player {
        const [size, radius] = [0.1, 0.1];
        return { name, position, size, collider: { x: position.x, y: position.y, radius }};
    }
    function ball(position: Point): Ball {
        const [size, radius] = [0.1, 0.1];
        return { position, size, collider: { x: position.x, y: position.y, radius }};
    }
    function defaultState(): GameState {
        return {
            players: [
                player("Left", vec2(0, 0.5)),
                player("Right", vec2(1, 0.5)),
            ],
            ball: ball(vec2(0.5, 0.5)),
            ballDirection: vec2(1.0, 0.0)
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

