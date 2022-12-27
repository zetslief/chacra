const BLACK = "black";
const BACKGROUND = "#3333dd"
const PLAYER = "#ff3333"

// MATHTYPE

interface Vec2 { x: number, y: number };
interface Direction extends Vec2 {};
interface Point extends Vec2 {};

function vec2(x: number, y: number): Vec2 {
    return {x, y};
}

function distance(from: Point, to: Point): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.sqrt(dx * dx + dy * dy);
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

type GameState = {
    player: Player,
    enemySpawner: EnemySpawner,
    enemies: Enemy[],
    arena: Arena,
    slots: Slot[],
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
    chakra: Chakra
}

type EnemyFactory = () => Enemy;
type EnemySpawner = Point & {
    nextIndex: number,
    delay: number,
    delayLeft: number,
};

type Enemy = Point & {
    target: Point
};

type RenderState = {
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
};

type Chakra = { timeout: number }
type Cast = { x: number, y: number }
type Spell = {
    x0: number, y0: number,
    x1: number, y1: number,
    speed: number
};

type InputState = {
    cast: Cast | null,
    player: Vec2
};

type InputUpdate = {
    cast: Cast | null
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
        for(let index = 0; index < count; ++index) {
            result.push(slot(index));
        }
        return result;
    }
    const player = { x: arena.x, y: arena.y, size: 20, chakra: { timeout: 0 } };
    const enemySpawner = { x: arena.x, y: arena.y, nextIndex: 0, delay: 0.5, delayLeft: 1 };
    const enemies: Enemy[] = [];
    const spell = null;
    const defaultSlotsNumber = 7;
    const slots = generateSlots(defaultSlotsNumber);
    const inputState = { cast: null, player: vec2(0, 0) };
    return {
        player, 
        enemySpawner,
        enemies,
        arena,
        spell,
        slots,
        inputState,
    };
}

function setupHandlers(inputState: InputState) {
    document.addEventListener("click", (e) => {
        inputState.cast = { x: e.pageX, y: e.pageY };
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
    ctx.arc(spell.x0, spell.y0, 20 / 2, 0, 2 * Math.PI);
    ctx.fill();
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
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(arena.x, arena.y, arena.radius, 0, 2 * Math.PI);
    ctx.fill();
}

function drawSlots(ctx: CanvasRenderingContext2D, arena: Arena, slots: Slot[]) {
    ctx.fillStyle = "black";
    for(const slot of slots) {
        const position = slotPosition(slot, arena, slots.length);
        ctx.beginPath();
        ctx.arc(position.x, position.y, 10, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[]) {
    for(const enemy of enemies) {
        drawEnemy(ctx, enemy);
    }
}

// PROCESSING
function processInput(inputState: InputState): InputUpdate {
    let input: InputUpdate = { cast: null, player: vec2(0, 0) };
    if (inputState.cast) {
        input.cast = inputState.cast;
        inputState.cast = null;
    }
    return input;
}

function applyInput(state: GameState, inputChange: InputUpdate) {
    function spell(x0: number, y0: number, x1: number, y1: number): Spell {
        const defaultSpeed = 10;
        return { x0: x0, y0: y0, x1: x1, y1: y1, speed: defaultSpeed };
    }
    if (inputChange.cast) {
        state.spell = spell(state.player.x, state.player.y, inputChange.cast.x, inputChange.cast.y);
    }
    const playerMoveLength = distance(vec2(0, 0), inputChange.player);
    if (playerMoveLength > 0) {
    }
}

function updatePhysics(state: GameState, dt: number) {
    function updateEnemySpawner(enemySpawner: EnemySpawner, enemyFactory: EnemyFactory, dt: number): Enemy | null {
        if (enemySpawner.delayLeft < 0) {
            enemySpawner.delayLeft = enemySpawner.delay;
            const newEnemy = enemyFactory();
            console.log(newEnemy);
            return newEnemy;
        }
        enemySpawner.delayLeft -= dt;
        return null;
    }
    function handleEnemies(state: GameState, newEnemy: Enemy | null) {
        if (newEnemy) {
            state.enemies.push(newEnemy);
        }
        for(const enemy of state.enemies) {
            const defaultEnemySpeed = 10;
            const speed = defaultEnemySpeed;
            const dir = direction(enemy, enemy.target);
            enemy.x = enemy.x + dir.x * speed * dt;
            enemy.y = enemy.y + dir.y * speed * dt;
        }
        state.enemies = state.enemies.filter(enemy => {
            const dist = distance(enemy, enemy.target);
            return dist > 1;
        });
    }
    function createEnemy(): Enemy {
        const x = state.arena.x;
        const y = state.arena.y;
        const targetSlotIndex = Math.floor(Math.random() * state.slots.length);
        const targetSlot = state.slots[targetSlotIndex];
        return { x, y, target: slotPosition(targetSlot, state.arena, state.slots.length) };
    }
    const newEnemy = updateEnemySpawner(state.enemySpawner, createEnemy, dt);
    handleEnemies(state, newEnemy);
    if (state.spell) {
        const spell = state.spell
        const dist = distance(vec2(spell.x0, spell.y0), vec2(spell.x1, spell.y1));
        const spellExitDistance = 1;
        console.log(dist);
        if (dist < spellExitDistance) {
            state.spell = null;
        } else {
            const dir = direction(vec2(spell.x0, spell.y0), vec2(spell.x1, spell.y1));
            spell.x0 = spell.x0 + dir.x * spell.speed * dt;
            spell.y0 = spell.y0 + dir.y * spell.speed * dt;
        }
    }
}

// MAIN
function draw(state: GameState, render: RenderState) {
    const canvas = render.canvas;
    const ctx = render.ctx;
    drawBackground(ctx, canvas.width, canvas.height);
    drawArena(ctx, state.arena);
    drawSlots(ctx, state.arena, state.slots);
    drawEnemies(ctx, state.enemies);
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
    const deltaTime = 1000 / 60;
    setupHandlers(state.inputState)
    requestAnimationFrame(() => loop(state, renderState, deltaTime * 0.001));
}

main()
