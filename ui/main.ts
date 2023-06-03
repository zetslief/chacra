import {
    Vec2, Point, vec2,
    smul, sum, sub, ssum, normalize,
    CircleCollider, collideCC,
    LineCollider
} from './lib/math';

const BACKGROUND = "#33ddff";
const PLAYER = "#dddd33";
const BALL = "#33dd33";

const BALL_RADIUS = 0.020;
const PLAYER_RADIUS = 0.05;
const BOOSTER_RADIUS = 0.020;
const LINE_WIDTH = 1.00;

const PLAYERS_COUNT = 12;
const BOOSTER_SCALE = 1.1;

const BIGGER_PLAYER_WEIGHT = 60;
const BIGGER_BALL_WEIGHT = 30
const SHUFFLE_BOOSTERS_WEIGHT = 30
const DEATH_BALL_WEIGHT = 10;

// GAME

type GameState = {
    numberOfPlayers: number,
    players: Player[],
    ballOwner: Player,
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
    collider: CircleCollider,
    color: Color,
    dead: boolean
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
    strokeCircle(ctx, x, y, size, BALL, LINE_WIDTH * 6);
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

// PROCESSING

function updatePhysics(game: GameState, input: InputState, dt: number) {
    function movePlayer(player: Player, dx: number, dy: number) {
        const step = (Math.PI / 2) * dt * 0.001 * dy;
        const position = smul(ssum(player.position, -0.5), 2);
        const angle = Math.atan2(position.y, position.x) + step;
        const x = Math.cos(angle);
        const y = Math.sin(angle);
        player.position = ssum(smul(vec2(x, y), 0.5), 0.5);
        player.collider.x = player.position.x;
        player.collider.y = player.position.y;
    }
    function moveBall(ball: Ball, direction: Vec2, dt: number) {
        const step = 0.0003;
        ball.position = sum(ball.position, smul(smul(direction, dt), step));
        if (ball.position.x > 1) {
            ball.position.x -= 1;
        }
        if (ball.position.x < 0) {
            ball.position.x += 1;
        }
        if (ball.position.y > 1) {
            ball.position.y -= 1;
        }
        if (ball.position.y < 0) {
            ball.position.y += 1;
        }
        ball.collider.x = ball.position.x;
        ball.collider.y = ball.position.y;
    }
    function collideBallAndPlayer(ball: Ball, player: CircleCollider, direction: Vec2): boolean {
        if (collideCC(ball.collider, player)) {
            const newDirection = normalize(sub(ball.collider, player));
            direction.x = newDirection.x;
            direction.y = newDirection.y;
            return true;
        }
        return false;
    }
    function collideBallAndBooster(ball: Ball, booster: Booster, player: Player): boolean {
        if (collideCC(ball.collider, booster.collider)) {
            if (booster.name == "biggerPlayer") {
                player.size *= BOOSTER_SCALE;
                player.collider.radius *= BOOSTER_SCALE;
            } else if (booster.name == "biggerBall") {
                ball.size *= BOOSTER_SCALE;
                ball.collider.radius *= BOOSTER_SCALE;
            } else if (booster.name == "deathBall") {
                player.dead = true;
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
        if (collideBallAndPlayer(game.ball, player.collider, game.ballDirection))
        {
            game.ballOwner = player;
            game.ballDirection = normalize(game.ballDirection);
            break;
        }
    }
    let boosters = []
    for (const booster of game.boosters) {
        const collided = collideBallAndBooster(game.ball, booster, game.ballOwner);
        if (!collided) {
            boosters.push(booster);
        }
    }
    game.players = game.players.filter(player => !player.dead);
    game.boosters = boosters;
    if (game.ballOwner.dead) {
        const randomPlayerIndex = Math.floor(Math.random() * game.players.length);
        game.ballOwner = game.players[randomPlayerIndex];
    }
}

function draw(game: GameState, render: RenderState) {
    const ctx = render.ctx;
    const scale = vec2(render.canvas.width, render.canvas.height);
    drawBackground(ctx, scale);
    for (let player of game.players)
    {
        drawPlayer(ctx, scale, player);
    }
    drawBallOwner(ctx, scale, game.ballOwner);
    drawBall(ctx, scale, game.ball, game.ballOwner.color); 
    for (const booster of game.boosters) {
        drawBooster(ctx, scale, booster);
    }
}

let previousFrame = Date.now();

function loop(
    game: GameState,
    input: InputState,
    render: RenderState,
    view: PerfView,
    dt: number) {
    const start = Date.now();
    game.boostSpawner(dt, game.boosters);
    updatePhysics(game, input, dt);
    draw(game, render);
    const stop = Date.now();
    const duration = stop - start;
    view.dt = dt;
    view.physics = duration;
    view.frame = start - previousFrame;
    previousFrame = start;
    if (dt - duration < 0) {
        loop(game, input, render, view, dt);
    } else {
        setTimeout(() => loop(game, input, render, view, dt), (dt - duration));
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
            { name: "biggerPlayer", color: "purple", weight: BIGGER_PLAYER_WEIGHT },
            { name: "biggerBall", color: "lightgreen", weight: BIGGER_BALL_WEIGHT },
            { name: "shuffleBoosters", color: "yellow", weight: SHUFFLE_BOOSTERS_WEIGHT },
            { name: "deathBall", color: "red", weight: DEATH_BALL_WEIGHT },
        ];
        const totalWeight = knownBoosters.map(b => b.weight).reduce((prev, cur) => prev + cur);
        const selectedWeight = Math.floor(Math.random() * totalWeight);
        const offset = 0.2;
        const collider = {
            x: offset + Math.random() * (1 - offset),
            y: offset + Math.random() * (1 - offset),
            radius: BOOSTER_RADIUS
        };
        let weightCounter = 0;
        for (let index = 0; index < knownBoosters.length; ++index) {
            const booster = knownBoosters[index];
            weightCounter += booster.weight;
            if (weightCounter > selectedWeight) {
                return { collider, ...booster };
            }
        }
        return { collider, ...knownBoosters[knownBoosters.length - 1] };
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

type Pivot = Point & { angle: number };
function calculatePivots(startAngle: number, angleStep: number, pivotCount: number): Pivot[] {
    let pivots = [];
    let angle = startAngle;
    for (let index = 0; index < pivotCount; index +=1)
    {
        let pivot = vec2(Math.cos(angle), Math.sin(angle));
        pivot = ssum(smul(pivot, 0.5), 0.5);
        pivots.push({ angle, ...pivot });
        angle += angleStep;
    }
    return pivots;
}

function main() {
    function ball(position: Point): Ball {
        const [size, radius] = [BALL_RADIUS, BALL_RADIUS];
        return { position, size, collider: { x: position.x, y: position.y, radius }};
    }
    function createPlayers(pivots: Pivot[]): Player[] {
        const [size, radius] = [PLAYER_RADIUS, PLAYER_RADIUS];
        let players = []
        for (const pivot of pivots) {
            const index: number = players.length + 1;
            const name = "Player" + index;
            const redLevel = Math.floor(index * (255 / pivots.length));
            const colorValue = (redLevel << 16) + (redLevel * 2 << 8) + 200; 
            const color = "#" + colorValue.toString(16);
            console.log(color);
            const position = { x: pivot.x, y: pivot.y };
            const dead = false;
            players.push({ name, position, size, color, collider: { radius, ...position }, dead});
        }
        return players;
    }
    function walls(pivots: Pivot[]): LineCollider[] {
        let walls = [];
        for (let index = 0; index < pivots.length - 1; index += 1)
        {
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
            boostSpawner: boostSpawner()
        }
    }
    const state = defaultState();
    const renderer = setupRenderState();
    const input = { click: null, dx: 0, dy: 0 };
    setupHandlers(input);
    const dt = (1000 / 30);
    loop(state, input, renderer, new PerfView(), dt);
}

class PerfView {
    private readonly _dt: HTMLElement;
    private readonly _physics: HTMLElement;
    private readonly _frame: HTMLElement;

    constructor() {
        this._dt = document.getElementById("dt")!;
        this._physics = document.getElementById("physics")!;
        this._frame = document.getElementById("frame")!;
    }

    set dt(value: number) {
        this._dt.innerHTML = value.toString();
    }

    set physics(value: number) {
        this._physics.innerHTML = value.toString();
    }

    set frame(value: number) {
        this._frame.innerHTML = value.toString();
    }
};

window.onload = main;
