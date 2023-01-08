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
    chakrasArray: Chakra[],
    chakras: Map<Chakra, Effect[]>,
    enemies: Map<Enemy, Effect[]>,
    spell: Spell | null,
    ability: Ability,
    inputState: InputState
}

type Color = string | CanvasGradient | CanvasPattern;

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

type Chakra = Point & { collider: CircleCollider }
type Click = Point;
type Spell = Point & {
    collider: CircleCollider
};

type Effect = { collider: CircleCollider };
type ShieldEffect = Effect;
type MirrorEffect = Effect;

enum AbilityType {
    Crown = 1,
    ThirdEye = 2
}
type Ability = { active: boolean, type: AbilityType };

type InputState = {
    click: Click | null,
    activatedAbility: AbilityType | undefined,
};

type InputUpdate = {
    click: CircleCollider | null
    activatedAbility: AbilityType | undefined,
};

function setupState(arena: Arena, chakras: Chakra[]): GameState {
    const player = { x: arena.x, y: arena.y, size: PLAYER_SIZE, chakra: { timeout: 0 } };
    const enemySpawner = { x: arena.x, y: arena.y, nextIndex: 0, delay: 0.5, delayLeft: 1 };
    const spell = null;
    const ability = { active: false, type: AbilityType.Crown };
    const enemies = new Map<Enemy, Effect[]>();
    const inputState = { click: null, activatedAbility: undefined };
    return {
        player,
        enemySpawner,
        arena,
        spell,
        ability,
        chakrasArray: chakras,
        chakras: new Map<Chakra, Effect[]>(chakras.map(chakra => [chakra, []])),
        enemies,
        inputState,
    };
}

function setupHandlers(inputState: InputState) {
    document.onclick = (e) => {
        inputState.click = { x: e.pageX, y: e.pageY };
    };
    document.onkeydown = (e) => {
        if (e.isComposing || e.keyCode === 229) {
            return;
        }
        const key = e.code.toUpperCase();
        if (key === "DIGIT1") {
            inputState.activatedAbility = AbilityType.Crown;
        }
        if (key === "DIGIT2") {
            inputState.activatedAbility = AbilityType.ThirdEye;
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
    const x = player.x * scale;
    const y = player.y * scale;
    const size = player.size * scale;
    fillCircle(ctx, x, y, size, PLAYER);
    strokeCircle(ctx, x, y, size, "darkred", LINE_WIDTH);
}

function drawSpell(
    ctx: CanvasRenderingContext2D,
    spell: Spell,
    _scale: number,
) {
    strokeCircle(ctx, spell.x, spell.y, spell.collider.radius, "green", LINE_WIDTH);
    fillCircle(ctx, spell.x, spell.y, spell.collider.radius * 0.7, "green");
}

function drawEnemy(
    ctx: CanvasRenderingContext2D,
    enemy: Enemy,
    scale: number
) {
    const x = enemy.x * scale;
    const y = enemy.y * scale;
    const radius = DEFAULT_RADIUS * scale;
    fillCircle(ctx, x, y, radius, "white");
    const colliderX = enemy.collider.x * scale;
    const colliderY = enemy.collider.y * scale;
    const colliderRadius = enemy.collider.radius * scale;
    strokeCircle(ctx, colliderX, colliderY, colliderRadius, "gray", 1);
}

function drawChakra(
    ctx: CanvasRenderingContext2D,
    chakra: Chakra,
    scale: number,
) {
    const x = chakra.x * scale;
    const y = chakra.y * scale;
    const radius = DEFAULT_RADIUS * scale;
    fillCircle(ctx, x, y, radius, "black");
    const colliderX = chakra.collider.x * scale;
    const colliderY = chakra.collider.y * scale;
    const colliderRadius = chakra.collider.radius * scale;
    strokeCircle(ctx, colliderX, colliderY, colliderRadius, "gray", 1);
}


type Arena = {
    x: number,
    y: number,
    radius: number
}
function drawArena(
    ctx: CanvasRenderingContext2D,
    arena: Arena,
    scale: number
) {
    fillCircle(ctx, arena.x * scale, arena.y * scale, arena.radius * scale, "orange");
}

function drawEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[], scale: number) {
    for (const enemy of enemies) {
        drawEnemy(ctx, enemy, scale);
    }
}

function drawEffects(ctx: CanvasRenderingContext2D, effects: Effect[], _scale: number) {
    for (const effect of effects) {
        const { x, y, radius } = effect.collider;
        strokeCircle(ctx, x, y, radius, "purple", LINE_WIDTH * 3);
    }
}

// PROCESSING

function processInput(inputState: InputState): InputUpdate {
    let input: InputUpdate = { click: null, activatedAbility: undefined };
    if (inputState.click) {
        input.click = { radius: DEFAULT_CLICK_RADIUS, ...inputState.click };
        inputState.click = null;
    }
    if (inputState.activatedAbility) {
        input.activatedAbility = inputState.activatedAbility;
        inputState.activatedAbility = undefined;
    }
    return input;
}

function applyInput(state: GameState, inputChange: InputUpdate) {
    if (inputChange.activatedAbility) {
        if (state.ability.active && inputChange.activatedAbility === state.ability.type) {
            state.ability.active = false;
        } else {
            state.ability.active = true;
        }
        state.ability.type = inputChange.activatedAbility;
    }
    if (inputChange.click) {
        let clickProcessed = false;
        for (const chakra of state.chakras.keys()) {
            if (collide(chakra.collider, inputChange.click)) {
                if (state.ability.active && state.ability.type === AbilityType.Crown) {
                    const effects = state.chakras.get(chakra)!;
                    const radius = chakra.collider.radius * (1.0 + 0.4 * (effects.length + 1));
                    const collider = { ...chakra.collider, radius };
                    effects.push({ collider });
                }
                console.log("Clicked on chakra", chakra);
                clickProcessed = true;
                break;
            }
        }
        for (const [enemy, effects] of state.enemies) {
            if (collide(enemy.collider, inputChange.click)) {
                if (state.ability.active && state.ability.type === AbilityType.ThirdEye) {
                    effects.push({ collider: enemy.collider });
                    enemy.target = { x: state.arena.x, y: state.arena.y };
                }
                console.log("Clicked on enemy", enemy);
                clickProcessed = true;
                break;
            }
        }
        if (!clickProcessed) {
            const x = inputChange.click.x;
            const y = inputChange.click.y;
            state.spell = { x, y, collider: { x, y, radius: DEFAULT_RADIUS } };
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
            state.enemies.set(newEnemy, []);
        }
        for (const enemy of state.enemies.keys()) {
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
        for (const enemy of state.enemies.keys()) {
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
        for (const enemyToRemove of enemiesToRemove) {
            state.enemies.delete(enemyToRemove);
        }
        for (const [chakra, effects] of state.chakras) {
            state.chakras.set(chakra, effects.filter(effect => !effectsToRemove.has(effect)));
        }
    }
    function createEnemy(): Enemy {
        const x = state.arena.x;
        const y = state.arena.y;
        const targetChakraIndex = Math.floor(Math.random() * state.chakrasArray.length);
        const targetChakra = state.chakrasArray[targetChakraIndex];
        return {
            x,
            y,
            target: { x: targetChakra.x, y: targetChakra.y },
            collider: { x, y, radius: DEFAULT_RADIUS }
        };
    }
    const newEnemy = updateEnemySpawner(state.enemySpawner, createEnemy, dt);
    handleEnemies(state, newEnemy);
    handleCollisions(state);
}

// MAIN

function draw(state: GameState, render: RenderState) {
    const ctx = render.ctx;
    const size = Math.min(document.body.scrollHeight, document.body.scrollWidth);
    drawBackground(ctx, size, size);
    drawArena(ctx, state.arena, size);
    for (const [chakra, effects] of state.chakras) {
        drawChakra(ctx, chakra, size);
        drawEffects(ctx, effects, size);
    }
    for (const enemy of state.enemies.keys()) {
        drawEnemy(ctx, enemy, size);
    }
    drawPlayer(ctx, state.player, size)
    if (state.spell) {
        drawSpell(ctx, state.spell, size);
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
    const size = Math.min(document.body.scrollWidth, document.body.scrollHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    return { canvas: canvas, ctx: ctx };
}

function connectBackend() {
    const baseUrl = 'http://localhost:5000/';
    const initializationUrl = baseUrl + 'initializeGameState';
    function updateState() {
        fetch(baseUrl)
            .then((response) => response.text().then(text => {
                console.log(text);
                setTimeout(updateState, 500);
            }))
            .catch((error) => {
                console.error(error);
            });
    }
    console.log("Initializing...");
    fetch(initializationUrl)
        .then(async (response) => {
            const text = await response.text();
            const result = JSON.parse(text);
            const state = setupState(result.arena, result.chakras);
            const renderState = setupRenderState();
            const deltaTime = 1000 / 60;
            setupHandlers(state.inputState)
            requestAnimationFrame(() => loop(state, renderState, deltaTime * 0.001));
            updateState();
            console.log("State initialization finished...");
        })
        .catch((error) => console.error(error));
}

function main() {
    connectBackend();
}

main();

