
window.onload = async () => {
    const labelName = document.getElementById("lobbyName");
    const players = document.getElementById("players");
    const template = document.getElementById("playerTemplate");

    const lobbyData = await requestLobbyData();
    renderLobbyName(lobbyData.Name, labelName);
    renderLobbyPlayers(lobbyData.players, template, players);
    setInterval(async () => {
        const data = await requestLobbyData();
        renderLobbyPlayers(data.players, template, players);
    }, 1000)
};

async function startGame() {
    const response = await fetch(
        "http://localhost:5000/lobby/start", 
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
    var response = await fetch("http://localhost:5000/lobby/data");
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