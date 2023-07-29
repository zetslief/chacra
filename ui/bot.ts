import { InputState } from './lib/types';

const uri = "http://localhost:5000/game/input";
const inputUpdateDelay = 50;

Promise.all(Array.from({length: 12}, (k, v) => runBot(uri, "Player" + v)))
    .then(() => console.log("Bot finished!"));

async function runBot(uri: string, playerName: string) {
    sendInputState(uri, playerName);
}

function sendInputState(uri: string, playerName: string) {
    const state = new InputState(playerName);
    state.dy = 1;
    fetch(uri, {
        method: "POST",
        body: JSON.stringify(state),
        headers: { "Content-Type": "application/json" }
    })
        .then(() => setTimeout(() => runBot(uri, playerName), inputUpdateDelay))
        .catch((e) => {
            console.error(e);
            setTimeout(() => sendInputState(uri, playerName), inputUpdateDelay);
        });
}