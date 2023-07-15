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
        port.onmessage = (e) => processGameState(e.data as GameState);
    } else if (event.data === "start") {
        assertPortConnected(port);
        run(port);
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

function processGameState(state: GameState) {
    if (state.players.length == 0) {
        return;
    }
    ball = state.ball;
    closestPlayer = state.players[0];
    let closestDistance = distance(closestPlayer.collider, state.ball.collider);
    for (let index = 1; index < state.players.length; ++index) {
        const player = state.players[index];
        const currentDistance = distance(player.collider, state.ball.collider)
        if (currentDistance < closestDistance) {
            closestPlayer = player;
            closestDistance = currentDistance;
        }
    }
    if (Math.random() > 0.5) {
        closestPlayer = state.ballOwner;
    }
}