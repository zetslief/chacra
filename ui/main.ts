import {
    Vec2, Point, vec2,
    smul, sum, normalize,
    CircleCollider, collideCC,
    LineCollider, collideLL
} from './lib/math';

const BACKGROUND = "#3333dd";
const PLAYER = "#ff3333";
const BALL = "#33dd33";

const BALL_RADIUS = 0.020;
const PLAYER_RADIUS = 0.05;
const BOOSTER_RADIUS = 0.020;
const LINE_WIDTH = 1.00;

// GAME

type GameState = {
    numberOfPlayers: number,
    players: Player[],
    ball: Ball,
    walls: LineCollider[],
    ballDirection: Vec2,
    boosters: Booster[],
    boostSpawner: BoostSpawner,
}

type Color = string | CanvasGradient | CanvasPattern;

type Booster =  { name: string, color: Color, collider: CircleCollider };
type BoostSpawner = (dt: number, boosters: Booster[]) => void;

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

function drawColliderL(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    collider: LineCollider) {
    const ax = collider.a.x * scale.x;
    const ay = collider.a.y * scale.y;
    const bx = collider.b.x * scale.x;
    const by = collider.b.y * scale.y;
    ctx.beginPath();
    ctx.lineWidth = LINE_WIDTH * 2;
    ctx.strokeStyle = "lightgreen";
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
    function moveBall(ball: Ball, direction: Vec2, dt: number) {
        const step = 0.0003;
        ball.position = sum(ball.position, smul(smul(direction, dt), step));
        ball.collider.x = ball.position.x;
        ball.collider.y = ball.position.y;
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
    function collideBallAndBooster(ball: Ball, booster: Booster, player: Player): boolean {
        if (collideCC(ball.collider, booster.collider)) {
            if (booster.name == "biggerPlayer") {
                player.size *= 1.5;
                player.collider.radius *= 1.5;
            } else {
                ball.size *= 1.5;
                ball.collider.radius *= 1.5;
            }
            return true;
        }
        return false;
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
    for (const player of game.players) {
        collideBallAndPlayer(game.ball, player.collider, game.ballDirection);
    }
    const randomPlayer = game.players[Math.floor(Math.random() * 2)]
    let boosters = []
    for (const booster of game.boosters) {
        const collided = collideBallAndBooster(game.ball, booster, randomPlayer);
        if (!collided) {
            boosters.push(booster);
        }
    }
    game.boosters = boosters;
}

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
    for (const booster of state.boosters) {
        drawBooster(ctx, scale, booster);
    }
    for (const wall of state.walls) {
        drawColliderL(ctx, scale, wall);
    }
}

function loop(game: GameState, input: InputState,  render: RenderState, dt: number) {
    const start = Date.now();
    game.boostSpawner(dt, game.boosters);
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
    const parent = canvas.parentElement;
    const size = Math.min(parent!.clientHeight, parent!.clientWidth);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    return { canvas: canvas, ctx: ctx };
}

function boostSpawner(): BoostSpawner {
    function randomBooster(): Booster {
        const knownBoosters = [
            { name: "biggerPlayer", color: "purple" },
            { name: "biggerBall", color: "lightgreen" }
        ];
        const index = Math.floor(Math.random() * knownBoosters.length);
        const offset = 0.2;
        return {
            collider: {
                x: offset + Math.random() * (1 - offset),
                y: offset + Math.random() * (1 - offset),
                radius: BOOSTER_RADIUS
            },
            ...knownBoosters[index]
        };
    }

    const boosterDelay = 1000;
    let timeLeft = boosterDelay;
    return (dt, boosters) => {
        timeLeft -= dt;
        if (timeLeft < 0) {
            boosters.push(randomBooster());
            timeLeft = boosterDelay;
        }
    };
}

function main() {
    function player(name: string, position: Point): Player {
        const [size, radius] = [PLAYER_RADIUS, PLAYER_RADIUS];
        return { name, position, size, collider: { x: position.x, y: position.y, radius }};
    }
    function ball(position: Point): Ball {
        const [size, radius] = [BALL_RADIUS, BALL_RADIUS];
        return { position, size, collider: { x: position.x, y: position.y, radius }};
    }
    function walls(numberOfWalls: number): LineCollider[] {
        function calculateNormals(vec: Vec2, angle: number): [Vec2, Vec2] {
            return [
                normalize(vec2(Math.cos(angle + Math.PI / 2), Math.sin(angle + Math.PI / 2))),
                normalize(vec2(Math.cos(angle - Math.PI / 2), Math.sin(angle - Math.PI / 2)))
            ];
        }
        let walls = [];
        let angle = 0;
        const angleStep = (Math.PI * 2) / numberOfWalls;
        for (let index = 0; index < numberOfWalls; index +=1)
        {
            const pivot = vec2(Math.cos(angle), Math.sin(angle));
            const wallLength = Math.sin(angle / 2); 
            const [posNormal, negNormal] = calculateNormals(pivot, angle);
            const a = sum(pivot, smul(posNormal, wallLength));
            const b = sum(pivot, smul(negNormal, wallLength));

            walls.push({ a, b });
            angle += angleStep;
        }
        return walls;
    }
    function defaultState(): GameState {
        const numberOfPlayers = 2;
        return {
            numberOfPlayers,
            players: [
                player("Left", vec2(0, 0.5)),
                player("Right", vec2(1, 0.5)),
            ],
            ball: ball(vec2(0.5, 0.5)),
            walls: walls(numberOfPlayers),
            ballDirection: vec2(1.0, 0.0),
            boosters: [],
            boostSpawner: boostSpawner()
        }
    }
    const state = defaultState();
    const renderer = setupRenderState();
    const input = { click: null, dx: 0, dy: 0 };
    setupHandlers(input);
    const dt = (1000 / 30);
    loop(state, input, renderer, dt);
}

window.onload = main;

