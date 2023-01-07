const BLACK = "black";
const BACKGROUND = "#3333dd";
const PLAYER = "#ff3333";

const DEFAULT_RADIUS = 10;
const LINE_WIDTH = 1;

// MATHTYPE

interface Vec2 { x: number, y: number };
interface Direction extends Vec2 { };
interface Point extends Vec2 { };

function vec2(x: number, y: number): Vec2 {
    return { x, y };
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
    const dst = Math.sqrt(distance(from, to));
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
    player: Player,
    enemySpawner: EnemySpawner,
    arena: Arena,
    activeSlot: Slot | null,
    slots: Slot[],
    chakras: Map<Chakra, Effect[]>,
    enemiesEffects: Map<Enemy, Effect[]>,
    spell: Spell | null,
    inputState: InputState
}

type Color = string | CanvasGradient | CanvasPattern;

type Slot = {
    index: number,
};

type Player = {
    x: number,
    y: number,
    size: number,
}

type EnemyFactory = () => Enemy;

type EnemySpawner = Point & {
    nextIndex: number,
    delay: number,
    delayLeft: number,
};

type Enemy = Point & {
    target: Point,
    collider: CircleCollider
};

type RenderState = {
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
};

type Chakra = { slot: Slot, collider: CircleCollider }
type Click = Point;
type Spell = Point & {
    collider: CircleCollider
};

type Effect = { collider: CircleCollider };
type ShieldEffect = Effect;
type MirrorEffect = Effect;

type InputState = {
    click: Click | null,
    spellActivated: boolean,
    player: Vec2
};

type InputUpdate = {
    click: Click | null
    spellActivated: boolean,
    player: Vec2
};

function slotPosition(slot: Slot, arena: Arena, slotsCount: number): Point {
    const angleStep = (Math.PI * 2) / slotsCount;
    const angleShift = 0;
    const angle = angleStep * slot.index + angleShift;
    const shiftX = (arena.radius * 0.8) * Math.cos(angle);
    const shiftY = (arena.radius * 0.8) * Math.sin(angle);
    const x = arena.x + shiftX;
    const y = arena.y + shiftY;
    return { x, y };
}

function setupState(): GameState {
    const arena = { x: window.innerWidth / 2, y: window.innerHeight / 2, radius: (window.innerHeight / 2) * 0.97 };
    function slot(index: number): Slot {
        return { index };
    }
    function generateSlots(count: number): Slot[] {
        const result = [];
        for (let index = 0; index < count; ++index) {
            result.push(slot(index));
        }
        return result;
    }
    function generateChakras(slots: Slot[], arena: Arena): Map<Chakra, []> {
        return new Map(slots.map(slot => {
            const { x, y } = slotPosition(slot, arena, slots.length);
            const collider = { x, y, radius: DEFAULT_RADIUS };
            return [{ slot, collider }, []];
        }));
    }
    const player = { x: arena.x, y: arena.y, size: 20, chakra: { timeout: 0 } };
    const enemySpawner = { x: arena.x, y: arena.y, nextIndex: 0, delay: 0.5, delayLeft: 1 };
    const spell = null;
    const defaultSlotsNumber = 7;
    const activeSlot = null;
    const slots = generateSlots(defaultSlotsNumber);
    const chakras = generateChakras(slots, arena);
    const enemiesEffects = new Map<Enemy, Effect[]>();
    const inputState = { click: null, spellActivated: false, player: vec2(0, 0) };
    return {
        player,
        enemySpawner,
        arena,
        spell,
        activeSlot,
        slots,
        chakras,
        enemiesEffects,
        inputState,
    };
}

function setupHandlers(inputState: InputState) {
    document.addEventListener("click", (e) => {
        inputState.click = { x: e.pageX, y: e.pageY };
    });
    document.addEventListener("keydown", (e) => {
        if (e.isComposing || e.keyCode === 229) {
            return;
        }
        const key = e.code.toUpperCase();
        if (key === "W") {
            inputState.player.y = 1;
        }
        if (key === "S") {
            inputState.player.y = -1;
        }
        if (key === "D") {
            inputState.player.x = 1;
        }
        if (key === "A") {
            inputState.player.x = -1;
        }
        if (key === "DIGIT1") {
            inputState.spellActivated = !inputState.spellActivated;
        }
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
    player: Player
) {
    fillCircle(ctx, player.x, player.y, player.size, PLAYER);
}

function drawSpell(
    ctx: CanvasRenderingContext2D,
    spell: Spell
) {
    strokeCircle(ctx, spell.x, spell.y, spell.collider.radius, "green", LINE_WIDTH);
    fillCircle(ctx, spell.x, spell.y, spell.collider.radius * 0.7, "green");
}

function drawEnemy(
    ctx: CanvasRenderingContext2D,
    enemy: Enemy
) {
    const enemyRadius = 10;
    const enemyColor = "white";
    fillCircle(ctx, enemy.x, enemy.y, enemyRadius, enemyColor);
}


type Arena = {
    x: number,
    y: number,
    radius: number
}
function drawArena(
    ctx: CanvasRenderingContext2D,
    arena: Arena
) {
    fillCircle(ctx, arena.x, arena.y, arena.radius, "orange");
}

function drawSlots(ctx: CanvasRenderingContext2D, arena: Arena, slots: Slot[]) {
    for (const slot of slots) {
        const position = slotPosition(slot, arena, slots.length);
        fillCircle(ctx, position.x, position.y, DEFAULT_RADIUS, "black");
    }
}

function drawActiveSlot(ctx: CanvasRenderingContext2D, slot: Slot | null, arena: Arena, slots: Slot[]) {
    if (slot) {
        const position = slotPosition(slot, arena, slots.length);
        strokeCircle(ctx, position.x, position.y, DEFAULT_RADIUS * 1.1, "red", LINE_WIDTH);
    }
}

function drawEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[]) {
    for (const enemy of enemies) {
        drawEnemy(ctx, enemy);
    }
}

function drawEffects(ctx: CanvasRenderingContext2D, effects: Effect[]) {
    for (const effect of effects) {
        const { x, y, radius } = effect.collider;
        strokeCircle(ctx, x, y, radius, "purple", LINE_WIDTH * 3);
    }
}

// PROCESSING

function processInput(inputState: InputState): InputUpdate {
    let input: InputUpdate = { click: null, spellActivated: false, player: vec2(0, 0) };
    if (inputState.click) {
        input.click = inputState.click;
        inputState.click = null;
    }
    if (inputState.spellActivated != null) {
        input.spellActivated = inputState.spellActivated;
    }
    return input;
}

function applyInput(state: GameState, inputChange: InputUpdate) {
    function spell(x: number, y: number): Spell {
        return { x, y, collider: { x, y, radius: DEFAULT_RADIUS } };
    }
    if (inputChange.click) {
        let slotActivated = false;
        for (const chakra of state.chakras.keys()) {
            if (insideCircle(chakra.collider, inputChange.click)) {
                if (inputChange.spellActivated) {
                    const effects = state.chakras.get(chakra)!;
                    const radius = chakra.collider.radius * (1.0 + 0.4 * (effects.length + 1));
                    const collider = { ...chakra.collider, radius };
                    effects.push({ collider });
                    slotActivated = true;
                    break;
                } else {
                    state.activeSlot = chakra.slot;
                    slotActivated = true;
                    break;
                }
            }
        }
        if (!slotActivated) {
            state.spell = spell(inputChange.click.x, inputChange.click.y);
        }
    }
}

function updatePhysics(state: GameState, dt: number) {
    function updateEnemySpawner(enemySpawner: EnemySpawner, enemyFactory: EnemyFactory, dt: number): Enemy | null {
        if (enemySpawner.delayLeft < 0) {
            enemySpawner.delayLeft = enemySpawner.delay;
            const newEnemy = enemyFactory();
            return newEnemy;
        }
        enemySpawner.delayLeft -= dt;
        return null;
    }
    function handleEnemies(state: GameState, newEnemy: Enemy | null) {
        if (newEnemy) {
            state.enemiesEffects.set(newEnemy, []);
        }
        for (const enemy of state.enemiesEffects.keys()) {
            const defaultEnemySpeed = 10;
            const speed = defaultEnemySpeed;
            const dir = direction(enemy, enemy.target);
            enemy.x = enemy.x + dir.x * speed * dt;
            enemy.y = enemy.y + dir.y * speed * dt;
            enemy.collider.x = enemy.x;
            enemy.collider.y = enemy.y;
        }
    }
    function handleCollisions(state: GameState) {
        const enemiesToRemove = new Set<Enemy>();
        const effectsToRemove = new Set<Effect>();
        for (const enemy of state.enemiesEffects.keys()) {
            if (state.spell) {
                if (collide(state.spell.collider, enemy.collider)) {
                    state.spell = null;
                    enemiesToRemove.add(enemy);
                    break;
                }
            }
            for (const [_chakra, effects] of state.chakras) {
                for (const effect of effects) {
                    if (collide(effect.collider, enemy.collider)) {
                        enemiesToRemove.add(enemy);
                        effectsToRemove.add(effect);
                    }
                }
            }
            for (const chakra of state.chakras.keys()) {
                if (collide(chakra.collider, enemy.collider)) {
                    enemiesToRemove.add(enemy);
                }
            }
        }
        for(const enemyToRemove of enemiesToRemove) {
            state.enemiesEffects.delete(enemyToRemove);
        }
        for (const [chakra, effects] of state.chakras) {
            state.chakras.set(chakra, effects.filter(effect => !effectsToRemove.has(effect)));
        }
    }
    function createEnemy(): Enemy {
        const x = state.arena.x;
        const y = state.arena.y;
        const targetSlotIndex = Math.floor(Math.random() * state.slots.length);
        const targetSlot = state.slots[targetSlotIndex];
        return {
            x,
            y,
            target: slotPosition(targetSlot, state.arena, state.slots.length),
            collider: { x, y, radius: DEFAULT_RADIUS }
        };
    }
    const newEnemy = updateEnemySpawner(state.enemySpawner, createEnemy, dt);
    handleEnemies(state, newEnemy);
    handleCollisions(state);
}

// MAIN

function draw(state: GameState, render: RenderState) {
    const canvas = render.canvas;
    const ctx = render.ctx;
    drawBackground(ctx, canvas.width, canvas.height);
    drawArena(ctx, state.arena);
    drawSlots(ctx, state.arena, state.slots);
    drawActiveSlot(ctx, state.activeSlot, state.arena, state.slots);
    for (const effects of state.chakras.values()) {
        drawEffects(ctx, effects);
    }
    for(const enemy of state.enemiesEffects.keys()) {
        drawEnemy(ctx, enemy);
    }
    drawPlayer(ctx, state.player)
    if (state.spell) {
        drawSpell(ctx, state.spell);
    }
}

function loop(game: GameState, render: RenderState, deltaTime: number) {
    requestAnimationFrame(() => loop(game, render, deltaTime));
    const update = processInput(game.inputState);
    applyInput(game, update);
    updatePhysics(game, deltaTime);
    draw(game, render);
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
    const deltaTime = 1000 / 60;
    setupHandlers(state.inputState)
    requestAnimationFrame(() => loop(state, renderState, deltaTime * 0.001));
}

main()

