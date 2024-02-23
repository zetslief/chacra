import {
    GameState, State,
    isInputState, isGameFinishedState,
} from './lib/types';

const BASE = new URL("http://localhost:5000/");

let port: MessagePort | null = null;
let latestGameState: GameState | null = null;
let playerName: string | null = null;

function assertPortConnected(port: MessagePort | null): asserts port is MessagePort {
    if (!port) {
        throw Error("Port is not connected!");
    }
}

onmessage = async (event) => {
    if (event.data === "connect") {
        port = event.ports[0];
        port.onmessage = (e) => latestGameState = e.data as GameState;
    } else if (event.data === "start") {
        assertPortConnected(port);
        loop();
    } else if (typeof event.data === "string") {
        playerName = event.data;
    } else if (isInputState(event.data)) {
        console.log("post input state", event.data);
        const url = new URL(`/game/input`, BASE);
        const response = await fetch(url.toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(event.data),
        });
        if (!response.ok) {
            console.error("Failed to send input:", response);
        }
    } else if (isGameFinishedState(event.data)) {
        console.log("Post game finished state");
        const url = new URL(`/game/finished`, BASE);
        const response = await fetch(url.toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(event.data),
        });
        if (!response.ok) {
            console.error("Failed to send game finished", response);
        }
    } else {
        console.error("Receive unknown message data", event.data);
    }
};

async function loop() {
    async function poll() {
        if (!port) {
            console.warn("Polling before port is connected to the worker.");
            return;
        }
        const url = new URL(`/game/inputStates/${playerName}`, BASE);
        const response = await fetch(url.toString());
        if (!response.ok) {
            console.error(response.status);
            return;
        }
        const inputs = await response.json() as State[];
        if (inputs.length > 0) {
            port.postMessage(inputs);
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
    postMessage(state);
    // TODO: add this info into perf view.
    // console.log(stop - start, result.ok);
}
