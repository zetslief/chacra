window.onload = main;

const PLAYERS = "players";
const PLAYER_TEMPLATE = "playerTemplate";

const CHAT = "chat";
const MESSAGE_TEMPLATE = "messageTemplate";

async function main() {
    const playersUpdate = createPlayerUpdate();
    const chatUpdate = createChatUpdate();
    const mainUpdate = async () => {
        const lobbyData = await getLobbyData(); 
        await playersUpdate(lobbyData);
        await chatUpdate(lobbyData);
    };
    await mainUpdate();
    setInterval(mainUpdate, 1000);
}

function createPlayerUpdate() {
    const playerTemplate = document.getElementById(PLAYER_TEMPLATE);
    const playersElement = document.getElementById(PLAYERS);
    return async (lobbyData) => {
        renderPlayers(playersElement, lobbyData.players, playerTemplate);
    };
}

function createChatUpdate() {
    const messageTemplate = document.getElementById(MESSAGE_TEMPLATE);
    const chat = document.getElementById(CHAT);
    return async (lobbyData) => {
        console.log("Chat Update", chat, messageTemplate);
        console.log("Chat data:", lobbyData);
    };
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

