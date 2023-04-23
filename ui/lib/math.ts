export interface Vec2 { x: number, y: number };
export interface Direction extends Vec2 { };
export interface Point extends Vec2 { };

export function vec2(x: number, y: number): Vec2 {
    return { x, y };
}

export function point(x: number, y: number): Point {
    return { x, y }
}

export function smul(vec: Vec2, value: number): Vec2 {
    return { x: vec.x * value, y: vec.y * value };
}

export function vmul(left: Vec2, right: Vec2): Vec2 {
    return { x: left.x * right.x, y: left.y * right.y };
}

export function len(vec: Vec2): number {
    return distance(vec2(0, 0), vec);
}

export function distance(from: Point, to: Point): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function sub(left: Vec2, right: Vec2): Vec2 {
    return { x: left.x - right.x, y: left.y - right.y };
}

export function sum(left: Vec2, right: Vec2): Vec2 {
    return { x: left.x + right.x, y: left.y + right.y };
}

export function normalize(v: Vec2) {
    return direction(vec2(0, 0), v);
}

export function direction(from: Point, to: Point): Vec2 {
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

export type CircleCollider = Point & {
    radius: number
}

export type LineCollider = {
    a: Point,
    b: Point
}

function lineCollider(a: Point, b: Point) {
    return { a, b }
}

export function line_k(a: Point, b: Point): number | undefined {
    return a.x == b.x 
        ? undefined
        : (b.y - a.y) / (b.x - a.x);
}

export function line_c(a: Point, b: Point): number | undefined {
    return a.x == b.x
        ? undefined
        : (b.y*a.x - a.y*b.x) / (a.x - b.x);
}

export function collideLL(first: LineCollider, second: LineCollider): boolean {
    function ordered(a: number, b: number): [number, number] {
        return a < b ? [a, b] : [b, a];
    }
    const [ax1, bx1] = ordered(first.a.x, first.b.x);
    const [ax2, bx2] = ordered(second.a.x, second.b.x);
    if (bx1 < ax2 || ax1 > bx2) {
        return false;
    }
    const [ay1, by1] = ordered(first.a.y, first.b.y);
    const [ay2, by2] = ordered(second.a.y, second.b.y);
    if (by1 < ay2 || ay1 > by2) {
        return false;
    }
    return true;
}

export function collideCC(first: CircleCollider, second: CircleCollider): boolean {
    const diff = sub(first, second);
    return len(diff) < (first.radius + second.radius);
}

export function collideCL(rect: LineCollider, circle: CircleCollider): boolean {
    console.error("Rect x Circle collistions are not implemented", rect, circle);
    return false;
}

export function insideCircle(circle: CircleCollider, point: Point): boolean {
    const diff = sub(circle, point);
    return len(diff) <= circle.radius;
}

