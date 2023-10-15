
window.onload = async () => {
    const players = document.getElementById("players");
    const template = document.getElementById("playerTemplate");

    const data = await requestLobbyData();
    renderLobbyData(data, template, players);
    setInterval(async () => {
        const data = await requestLobbyData();
        renderLobbyData(data, template, players);
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

function renderLobbyData(data, template, players) {
    while (players.firstChild) {
        players.removeChild(players.firstChild);
    }
    for (const item of data) {
        const playerElement = template.cloneNode(true);
        playerElement.removeAttribute("id");
        playerElement.lastChild.textContent = item.toString();
        players.appendChild(playerElement);
    }
}