import { InputState } from './lib/types';

const root = "http://localhost:5000";

const connectUri = root + "/lobbies/connect";
const statusUri = root + "/lobbies/status";
const inputUpdateUri = root + "/game/input";

const inputUpdateDelay = 50;

Promise.all(Array.from({length: 2}, (k, v) => runBot("Player" + v)))

async function runBot(playerName: string) {
    console.log("Connecting...", playerName);
    await sendConnect(connectUri, playerName);
    console.log("connected!. Waiting for start...");
    await waitForStart(statusUri);
    console.log("Start!");
    sendInputState(inputUpdateUri, playerName);
}

async function sendConnect(uri: string, playerName: string) {
    await fetch(uri, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            playerName
        }),
    });
}

interface LobbyStatus {
    started: boolean;
}
async function getLobbyStatus(uri: string): Promise<LobbyStatus> {
    const result = await fetch(uri);
    return await result.json() as LobbyStatus; 
}

async function waitForStart(uri: string) {
    const status = await getLobbyStatus(uri);
    if (!status.started) {
        await new Promise(resolve => setTimeout(resolve, 10));
        await waitForStart(uri);
    }
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