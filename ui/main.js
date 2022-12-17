const BLACK = "black";
const BACKGROUND = "#3333dd"
const PLAYER = "#ff3333"

function setupState() {
    function defaultChakra() {
        return { timeout: 0 }
    }
    function defaultInputState() {
        return { cast: null }
    }
    const canvas = document.getElementById("gameField");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    return { 
        loopInterval: 100, 
        canvas: canvas,
        player: { x: 40, y: 40, size: 20, chakra: defaultChakra() },
        spell: null,
        inputState: defaultInputState(),
        ctx: canvas.getContext('2d')
    };
}

function setupHandlers(inputState) {
    function createCast(x, y) {
        return { x: x, y: y };
    }
    document.addEventListener("click", (e) => {
        inputState.cast = createCast(e.pageX, e.pageY);
    });
}

// DRAWING

function drawRect(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height, color);
}

function drawBackground(ctx, width, height) {
    drawRect(ctx, 0, 0, width, height, BACKGROUND);
}

function drawPlayer(ctx, player) {
    ctx.fillStyle = PLAYER;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, 2 * Math.PI, 1);
    ctx.fill();
}

function drawSpell(ctx, spell) {
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.arc(spell.x1, spell.y1, 20 / 2, 0, 2 * Math.PI, 1);
    ctx.fill();
}

// PROCESSING

function processInput(inputState) {
    function defaultInput() {
        return { cast: null };
    }
    let input = defaultInput();
    if (inputState.cast) {
        input.cast = inputState.cast;
        inputState.cast = null;
    }
    return input;
}

function applyInput(state, inputChange) {
    function spell(x0, y0, x1, y1) {
        return { x0: x0, y0: y0, x1: x1, y1: y1, speed: 10 };
    }
    if (inputChange.cast) {
        state.spell = spell(state.player.x, state.player.y, inputChange.cast.x, inputChange.cast.y);
        console.log(state.spell);
    }
}

function updatePhysics(state, input) {
    if (state.spell) {
    }
}

// MAIN

function draw(state) {
    const canvas = state.canvas;
    const ctx = state.ctx;
    drawBackground(ctx, canvas.width, canvas.height);
    drawPlayer(ctx, state.player)
    if (state.spell) {
        drawSpell(ctx, state.spell);
    }
}

function loop(state) {
    const change = processInput(state.inputState);
    applyInput(state, change);
    updatePhysics(state, change); 
    draw(state)
}

function main() {
    const state = setupState();
    setupHandlers(state.inputState)
    setInterval(() => loop(state), state.loopInterval);
}

main()
