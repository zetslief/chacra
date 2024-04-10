import {
    AreaBooster,
    Ball,
    Obstacle,
    Booster,
    BoosterSlot,
    Player,
    Color,
} from './types';

import {
    Vec2, Point,
} from './math';

const LINE_WIDTH = 1.00;
const BACKGROUND = "#111122";
const BALL = "#33dd33";
const BOOSTER_SLOT = "gold";
const OBSTACLE_COLOR = "cyan";
const OVERLAY = "rgba(100, 100, 255, 0.50)";

export function drawRect(
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

export function fillCircle(
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

export function strokeCircle(
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

export function fillCenteredText(
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

export function drawOverlay(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
) {
    drawRect(ctx, 0, 0, scale.x, scale.y, OVERLAY);
}

export function drawBackground(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
) {
    drawRect(ctx, 0, 0, scale.x, scale.y, BACKGROUND);
}

export function drawPlayer(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    player: Player,
) {
    const x1 = player.collider.x * scale.x;
    const y1 = player.collider.y * scale.y;
    const size = player.collider.radius * scale.x;
    fillCircle(ctx, x1, y1, size, player.color);
}

export function drawBallOwner(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    player: Player,
) {
    const x1 = player.collider.x * scale.x;
    const y1 = player.collider.y * scale.y;
    const size = player.collider.radius * scale.x * 1.1;
    strokeCircle(ctx, x1, y1, size, BALL, LINE_WIDTH * 3);
}

export function drawBoosterSlot(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    slot: BoosterSlot,
) {
    const x = slot.x * scale.x;
    const y = slot.y * scale.y;
    const size = slot.size * scale.x * 1.1;
    strokeCircle(ctx, x, y, size, BOOSTER_SLOT, LINE_WIDTH);
}

export function drawLine(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    from: Point,
    to: Point,
) {
    const fromX = from.x * scale.x;
    const fromY = from.y * scale.y;
    const toX = to.x * scale.x;
    const toY = to.y * scale.y;
    ctx.lineWidth = LINE_WIDTH;
    ctx.strokeStyle = "lightgreen";
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
}

export function drawBall(
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

export function drawBooster(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    booster: Booster) {
    const collider = booster.collider;
    const x = collider.x * scale.x;
    const y = collider.y * scale.y;
    const size = collider.radius * scale.x;
    fillCircle(ctx, x, y, size, booster.color);
}

export function drawObstacle(
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

export function drawAreaBooster(
    ctx: CanvasRenderingContext2D,
    scale: Vec2,
    areaBooster: AreaBooster,
) {
    const collider = areaBooster.collider;
    const x = collider.x * scale.x;
    const y = collider.y * scale.y;
    const radius = collider.radius * scale.x;
    strokeCircle(ctx, x, y, radius, areaBooster.color, LINE_WIDTH);
}


export class RenderContext {
    constructor(public readonly canvas: CanvasRenderingContext2D) {
    }
}
