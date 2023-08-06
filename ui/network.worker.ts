import {
    GameState, InputState,
} from './lib/types';

let port: MessagePort | null = null;

function assertPortConnected(port: MessagePort | null): asserts port is MessagePort {
    if (!port) {
        throw Error("Port is not connected!");
    }
}

onmessage = (event) => {
    if (event.data === "connect") {
        port = event.ports[0];
        port.onmessage = async (e) => await processGameState(e.data as GameState);
    } else if (event.data === "start") {
        assertPortConnected(port);
        runInputPolling();
    }
};

function runInputPolling() {
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

    poll()
        .then(() => setTimeout(runInputPolling, 1000 / 30))
        .catch((e) => {
            console.error(e);
            runInputPolling();
        });
}

async function processGameState(state: GameState) {
    const start = Date.now();
    await fetch("http://localhost:5000/game/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
    });
    const stop = Date.now();
    console.log(stop - start);
}