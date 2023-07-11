import { InputState } from './lib/types';

let port: MessagePort | null = null;

onmessage = (event) => {
    if (event.data === "connect") {
        port = event.ports[0];
        run(port);
    }
};

function run(port: MessagePort) {
    const playerIndex = Math.floor(Math.random() * 10);
    const input = new InputState("Player " + playerIndex);
    input.dy = 1;
    port.postMessage(input);
}