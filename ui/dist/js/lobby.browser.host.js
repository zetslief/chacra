const ROOT = "http://localhost:5000";
const LOBBY_START = ROOT + "/lobby/start";
const LOBBY_STOP = ROOT + "/lobby/leave";
const LOBBY_LOBBY_NAME = ROOT + "/lobby/name";
const LOBBY_DATA = ROOT + "/lobby/data";

window.onload = async () => {
    const labelName = document.getElementById("lobbyName");
    const players = document.getElementById("players");
    const template = document.getElementById("playerTemplate");

    const lobbyData = await requestLobbyData();
    renderLobbyName(lobbyData.name, labelName);
    renderLobbyPlayers(lobbyData.players, template, players);
    setInterval(async () => {
        const data = await requestLobbyData();
        renderLobbyPlayers(data.players, template, players);
    }, 1000)
};

async function saveLobbyName() {
    const response = await fetch(LOBBY_LOBBY_NAME,
        { method: "POST" });
    if (!response.ok) {
        console.error("Failed to save lobby name", response);
    }
}

async function startGame() {
    const response = await fetch(LOBBY_START, 
        { method: "POST", redirect: "follow" }
    );
    if (response.ok && response.redirected) {
        window.location = response.url;
    } else {
        console.error("Failed to start the lobby!");
        console.error(response);
    }
}

async function leaveLobby() {
    console.error("Leave Lobby: not implemented!");
}

async function requestLobbyData() {
    var response = await fetch(LOBBY_DATA);
    return response.json();
} 

function renderLobbyName(labelName, labelNameElement) {
    labelNameElement.value = labelName;
}

function renderLobbyPlayers(data, template, players) {
    while (players.firstChild) {
        players.removeChild(players.firstChild);
    }
    for (const item of data) {
        const playerElement = template.cloneNode(true);
        playerElement.removeAttribute("id");
        playerElement.lastChild.textContent = item.name.toString();
        players.appendChild(playerElement);
    }
}