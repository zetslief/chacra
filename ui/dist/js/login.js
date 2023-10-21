const PLAYER_NAME = "playerName";

const ROOT = "http://localhost:5000";
const JOIN_ENDPOINT = ROOT + "/lobby/join";
const CREATE_NEW_LOBBY_ENDPOINT = ROOT +"/lobby/create";

const input = document.getElementById(PLAYER_NAME);

window.onload = () => {
    const playerName = sessionStorage.getItem(PLAYER_NAME);
    if (playerName) {
        input.value = playerName;
    }
}

async function join() {
    const playerName = input.value;
    if (!playerName) {
        console.error("Player name is not specified!");
        return;
    }
    sessionStorage.setItem(PLAYER_NAME, playerName);
    const result = await fetch(
        JOIN_ENDPOINT,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerName }),
        }
    );
    if (result.ok) {
        console.log(input.value, "is connected!");
        if (result.redirected && result.url) {
            location.assign(result.url);
        } else {
            errorNoRedirection(result);
        }
    } else {
        errorFailedRequest();
    }
}

async function createLobby() {
    const playerName = input.value;
    if (!playerName) {
        console.error("Player name is not specified!");
        return;
    }
    sessionStorage.setItem("playerName", playerName);
    const result = await fetch(CREATE_NEW_LOBBY_ENDPOINT,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lobbyName: playerName, playerName })
        }
    );
    if (result.ok) {
        if (result.redirected && result.url) {
            location.assign(result.url);
        } else {
            errorNoRedirection(result);
        }
    } else {
        errorFailedRequest(result);
    }
}

function errorNoRedirection(result) {
    console.error("Request is successful, but no redirection.");
    console.error(result);
}

function errorFailedRequest(result) {
    console.error("Request failed");
    console.error(result);
}