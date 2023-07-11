import { InputState } from './lib/types';

let port: MessagePort | null = null;

function assertPortConnected(port: MessagePort | null): asserts port is MessagePort {
    if (!port) {
        throw Error("Port is not connected!");
    }
}

onmessage = (event) => {
    if (event.data === "connect") {
        port = event.ports[0];
    } else if (event.data === "start") {
        assertPortConnected(port);
        run(port);
    }
};

function run(port: MessagePort) {
    let index = 0;
    while (index < 1 * 12) {
        const input = new InputState("Player" + Math.floor(index % 12));
        input.dy = 1;
        port.postMessage(input);
        ++index;
    }
    setTimeout(() => run(port), 100);
}