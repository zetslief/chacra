import { InputState } from './lib/types';

const root = "http://localhost:5000";

const connectUri = root + "/lobby/connect";
const inputUpdateUri = root + "/game/input";

const inputUpdateDelay = 50;

Promise.all(Array.from({length: 12}, (k, v) => runBot("Player" + v)))

async function runBot(playerName: string) {
    await sendConnect(connectUri, playerName);
    sendInputState(inputUpdateUri, playerName);
}

async function sendConnect(uri: string, playerName: string) {
    const body = JSON.stringify({
        playerName
    });
    console.log("Connecting", body);
    await fetch(uri, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
    });
}

function sendInputState(uri: string, playerName: string) {
    const state = new InputState(playerName);
    state.dy = 1;
    fetch(uri, {
        method: "POST",
        body: JSON.stringify(state),
        headers: { "Content-Type": "application/json" }
    })
        .then(() => setTimeout(() => sendInputState(uri, playerName), inputUpdateDelay))
        .catch((e) => {
            console.error(e);
            setTimeout(() => sendInputState(uri, playerName), inputUpdateDelay);
        });
}