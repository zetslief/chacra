const PLAYER_NAME = "playerName";
const LOBBY_NAME = "lobbyName";

const BASE = new URL("http://localhost:5000");
const JOIN_ENDPOINT = new URL("/lobbies/join", BASE);
const CREATE_NEW_LOBBY_ENDPOINT = new URL("/lobbies", BASE);

const playerInput = document.getElementById(PLAYER_NAME);
const lobbyInput = document.getElementById(LOBBY_NAME);

window.onload = () => {
    const playerName = sessionStorage.getItem(PLAYER_NAME);
    if (playerName) {
        playerInput.value = playerName;
    }
}

async function join() {
    const playerName = playerInput.value;
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
        console.log(playerInput.value, "is connected!");
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
    const playerName = playerInput.value;
    const lobbyName = lobbyInput.value;
    if (!(playerName && lobbyName)) {
        console.error("Player or Lobby name is not specified! (or both)");
        return;
    }
    sessionStorage.setItem(PLAYER_NAME, playerName);
    const result = await fetch(CREATE_NEW_LOBBY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyName: playerName, playerName })
    });
    if (result.status == 201) {
        location.assign(result.headers.get("location"));
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