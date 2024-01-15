window.onload = main;

const PLAYERS = "players";
const PLAYER_TEMPLATE = "playerTemplate";

async function main() {
    const playerTemplate = document.getElementById(PLAYER_TEMPLATE);
    const playersElement = document.getElementById(PLAYERS);
    console.log("Hello, Guest page!.");
    const update = async () => {
        const lobbyData = await getLobbyData();
        renderPlayers(playersElement, lobbyData.players, playerTemplate);
    };
    await update();
    setInterval(update, 1000);
}

async function getLobbyData()
{
    const url = new URL("./", window.location);
    const response = await fetch(url);
    return response.json();
}

function renderPlayers(storage, players, playerTemplate) {
    while (storage.firstChild) {
        storage.removeChild(storage.firstChild);
    }
    players.forEach(player => {
        const playerElement = playerTemplate.cloneNode(true);
        playerElement.removeAttribute("id");
        playerElement.querySelector("p").textContent = player.name;
        storage.appendChild(playerElement);
    });
}

