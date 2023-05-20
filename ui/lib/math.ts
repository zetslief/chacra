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

export function ssum(vec: Vec2, scalar: number) {
    return { x: vec.x + scalar, y: vec.y + scalar };
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

type KC = [ k: number, c: number ];
export function line_k_c(a: Point, b: Point): KC | undefined {
    if (a.x == b.x) {
        return undefined;
    }
    const k = (b.y - a.y) / (b.x - a.x);
    const c = (b.y*a.x - a.y*b.x) / (a.x - b.x);
    return [k, c];
}

export function collideLL(first: LineCollider, second: LineCollider): boolean {
    type ABKC = [number, number, number, number, number, number];
    type ABK = [number, number, number, number, number];
    type ABC = [number, number, number, number, number];
    type AB = [number, number, number, number];
    function line_line(first: ABKC, second: ABKC): boolean {
        const [ax1, ay1, bx1, by1, k1, c1] = first;
        const [ax2, ay2, bx2, by2, k2, c2] = second;
        const x = (c2 - c1) / (k1 - k2);
        const y = k1 * x + c1;
        return (ax1 <= x && bx1 >= x && ay1 <= y && by1 >= y)
            && (ax2 <= x && bx2 >= x && ay2 <= y && by2 >= y);
    }
    function line_horizontal(first: ABKC, second: AB): boolean {
        const [ax1, ay1, bx1, by1, k1, c1] = first;
        const [ax2, ay2, bx2, by2] = second;
        // y = kx + c
        // x = (y - c) / k
        const y = ay2; 
        const x = (y - c1) / k1;
        return (ax1 <= x && bx1 >= x && ay1 <= y && by1 >= y)
            && (ax2 <= x && bx2 >= x && ay2 <= y && by2 >= y);
    }
    function line_vertical(first: ABKC, second: AB): boolean {
        const [ax1, ay1, bx1, by1, k1, c1] = first;
        const [ax2, ay2, bx2, by2] = second;
        const x = ax2;
        const y = k1 * x + c1;
        return (ax1 <= x && bx1 >= x && ay1 <= y && by1 >= y)
            && (ax2 <= x && bx2 >= x && ay2 <= y && by2 >= y);
    }
    function parallel(first: AB, second: AB): boolean {
        const [ax1, ay1, bx1, by1] = first;
        const [ax2, ay2, bx2, by2] = second;
        return (ay1 == ay2) 
            && ((ax1 >= ax2 && ax1 <= bx2) || (bx1 >= ax2 && bx1 <= bx2));
    }

    function ordered(a: number, b: number): [number, number] {
        return a < b ? [a, b] : [b, a];
    }
    const [ax1, bx1] = ordered(first.a.x, first.b.x);
    const [ax2, bx2] = ordered(second.a.x, second.b.x);
    const [ay1, by1] = ordered(first.a.y, first.b.y);
    const [ay2, by2] = ordered(second.a.y, second.b.y);
    const kc1 = line_k_c(first.a, first.b);
    const kc2 = line_k_c(second.a, second.b);

    if (kc1 && kc2) {
        if (kc1[0] == kc2[0]) {
            const l1: AB = [ax1, ay1, bx1, by1];
            const l2: AB = [ax2, ay2, bx2, by2];
            return parallel(l1, l2);
        } else {
            const l1: ABKC = [ax1, ay1, bx1, by1, ...kc1];
            const l2: ABKC = [ax2, ay2, bx2, by2, ...kc2];
            return line_line(l1, l2);
        }
    } else if (kc1) {
        const l1: ABKC = [ax1, ay1, bx1, by1, ...kc1];
        const l2: AB = [ax2, ay2, bx2, by2];
        return line_vertical(l1, l2);
    } else if (kc2) {
        const l2: ABKC = [ax2, ay2, bx2, by2, ...kc2];
        const l1: AB = [ax1, ay1, bx1, by1];
        return line_vertical(l2, l1);
    } else {
        return (ax1 == ax2) 
            && ((ay1 >= ay2 && ay1 <= by2) || (by1 >= ay2 && by1 <= by2)); 
    }
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

