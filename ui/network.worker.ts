import {
    GameState, InputState,
    Player, Ball 
} from './lib/types';

import { distance } from './lib/math';

let port: MessagePort | null = null;
let closestPlayer: Player | null = null;
let ball: Ball | null = null;

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
        run(port);
        runInputPolling();
    }
};

function run(port: MessagePort) {
    if (closestPlayer && ball) {
        let index = 0;
        while (index < 1 * 5) {
            const input = new InputState(closestPlayer.name);
            if (ball.collider.x > closestPlayer.collider.x) {
                if (Math.abs(ball.collider.y - closestPlayer.collider.y) > closestPlayer.collider.radius) {
                    input.dy = ball.collider.y > closestPlayer.collider.y ? -1 : 1;
                }
            } else {
                if (Math.abs(ball.collider.y - closestPlayer.collider.y) > closestPlayer.collider.radius) {
                    input.dy = ball.collider.y > closestPlayer.collider.y ? 1 : -1;
                }
            }
            port.postMessage(input);
            ++index;
        }
    }
    setTimeout(() => run(port), 50);
}

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
    await fetch("http://localhost:5000/game/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
    });
}