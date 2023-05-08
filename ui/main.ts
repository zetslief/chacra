import {
    Vec2, Point, vec2,
    smul, sum, sub,
    CircleCollider, collideCC,
    LineCollider, collideLL
} from './lib/math';

const BLACK = "black";
const BACKGROUND = "#3333dd";
const PLAYER = "#ff3333";
const BALL = "#33dd33";

const DEFAULT_RADIUS = 0.01;
const DEFAULT_CLICK_RADIUS = 0.003;
const PLAYER_SIZE = 0.1;
const LINE_WIDTH = 1;

// GAME

type GameState = {
    players: Player[],
    ball: Ball,
    walls: LineCollider[]
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
    const size = player.size * scale.x;
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
    const size = ball.size * scale.x;
    fillCircle(ctx, x, y, size, BALL);
    strokeCircle(ctx, x, y, size, "darkred", LINE_WIDTH);
}

function drawColliderC(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    collider: CircleCollider) {
    const x = collider.x * scale.x;
    const y = collider.y * scale.y;
    const size = collider.radius * scale.x;
    strokeCircle(ctx, x, y, size, "green", LINE_WIDTH * 2);
}

function drawColliderL(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    collider: LineCollider) {
    const ax = collider.a.x * scale.x;
    const ay = collider.a.y * scale.y;
    const bx = collider.b.x * scale.x;
    const by = collider.b.y * scale.y;
    ctx.beginPath();
    ctx.strokeStyle = "lightgreen";
    ctx.lineWidth = LINE_WIDTH * 2;
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
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
    function moveBall(ball: Ball, walls: LineCollider[], direction: Vec2, dt: number) {
        const step = 0.00005;
        ball.position = sum(ball.position, smul(smul(direction, dt), step));
        ball.collider.x = ball.position.x;
        ball.collider.y = ball.position.y;
        const ballHLine = {
            a: vec2(ball.collider.x - ball.collider.radius, ball.collider.y),
            b: vec2(ball.collider.x + ball.collider.radius, ball.collider.y),
        }
        const ballVLine = {
            a: vec2(ball.collider.x, ball.collider.y + ball.collider.radius),
            b: vec2(ball.collider.x, ball.collider.y - ball.collider.radius),
        }
        if (collideLL(walls[0], ballHLine) || collideLL(walls[2], ballHLine)) {
            direction.x = -direction.x;
        }
        if (collideLL(walls[1], ballVLine) || collideLL(walls[3], ballVLine)) {
            direction.y = -direction.y;
        }
    }
    function collideBallAndPlayer(ball: Ball, player: CircleCollider, direction: Vec2) {
        if (collideCC(ball.collider, player)) {
            direction.x = -direction.x;
            if (ball.collider.y <= player.y) {
                direction.y = (ball.collider.y - player.y) / (ball.collider.radius + player.radius)
            } else {
                direction.y = (ball.collider.y - player.y) / (ball.collider.radius + player.radius)
            }
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
    moveBall(game.ball, game.walls, game.ballDirection, dt);
    for (const player of game.players) {
        collideBallAndPlayer(game.ball, player.collider, game.ballDirection);
    }
}

// MAIN

function draw(state: GameState, render: RenderState) {
    const ctx = render.ctx;
    const scale = vec2(render.canvas.width, render.canvas.height);
    drawBackground(ctx, scale);
    for (let player of state.players)
    {
        drawPlayer(ctx, scale, player);
        drawColliderC(ctx, scale, player.collider);
    }
    drawBall(ctx, scale, state.ball); 
    drawColliderC(ctx, scale, state.ball.collider); 
    for (const wall of state.walls) {
        drawColliderL(ctx, scale, wall);
    }
}

function loop(game: GameState, input: InputState,  render: RenderState, dt: number) {
    const start = Date.now();
    updatePhysics(game, input, dt);
    draw(game, render);
    const stop = Date.now();
    const duration = stop - start;
    if (dt - duration < 0) {
        loop(game, input, render, dt);
    } else {
        setTimeout(() => loop(game, input, render, dt), (dt - duration));
    }
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
    function player(name: string, position: Point): Player {
        const [size, radius] = [0.1, 0.1];
        return { name, position, size, collider: { x: position.x, y: position.y, radius }};
    }
    function ball(position: Point): Ball {
        const [size, radius] = [0.1, 0.1];
        return { position, size, collider: { x: position.x, y: position.y, radius }};
    }
    function walls(): LineCollider[] {
        return [
            { a: vec2(0, 0), b: vec2(0, 1) },
            { a: vec2(0, 1), b: vec2(1, 1) },
            { a: vec2(1, 1), b: vec2(1, 0) },
            { a: vec2(1, 0), b: vec2(0, 0) },
        ]
    }
    function defaultState(): GameState {
        return {
            players: [
                player("Left", vec2(0, 0.5)),
                player("Right", vec2(1, 0.5)),
            ],
            ball: ball(vec2(0.5, 0.5)),
            walls: walls(),
            ballDirection: vec2(1.0, 0.0)
        }
    }
    const state = defaultState();
    const renderer = setupRenderState();
    const input = { click: null, dx: 0, dy: 0 };
    setupHandlers(input);
    const dt = (1000 / 30);
    loop(state, input, renderer, dt);
}

main();

