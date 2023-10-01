import {
    GameState, InputState,
} from './lib/types';

let port: MessagePort | null = null;
let latestGameState: GameState | null = null;

function assertPortConnected(port: MessagePort | null): asserts port is MessagePort {
    if (!port) {
        throw Error("Port is not connected!");
    }
}

onmessage = (event) => {
    if (event.data === "connect") {
        port = event.ports[0];
        port.onmessage = (e) => latestGameState = e.data as GameState;
    } else if (event.data === "start") {
        assertPortConnected(port);
        loop();
    }
};

async function loop() {
    async function poll() {
        const response = await fetch("http://localhost:5000/game/inputStates");
        if (!response.ok) {
            console.error(response.status);
            return;
        }
        const inputs = await response.json() as InputState[];
        if (port) {
            for (const input of inputs) {
                port.postMessage(input);
            }
        }
    }

    while (latestGameState) {
        await processGameState();
        await poll();
    }
    await poll();
    setTimeout(loop, 5);
}

async function processGameState() {
    const state = latestGameState;
    latestGameState = null;
    await fetch("http://localhost:5000/game/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
    });
    // TODO: add this info into perf view.
    // console.log(stop - start, result.ok);
}