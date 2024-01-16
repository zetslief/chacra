window.onload = main;

const PLAYERS = "players";
const PLAYER_TEMPLATE = "playerTemplate";

const CHAT_MESSAGES = "chatMessages";
const MESSAGE_TEMPLATE = "messageTemplate";
const CHAT_INPUT = "chatInput";

let chatInput = null;

const messages = [];

async function main() {
    chatInput = document.getElementById(CHAT_INPUT);
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
    const chatMessages = document.getElementById(CHAT_MESSAGES);
    return async (lobbyData) => {
        if (messages.length > 0) {
            log(`${lobbyData.name} received a message!`);
        }
        while (messages.length > 0) {
            const message = messages.pop();
            const messageElement = messageTemplate.cloneNode(true);
            messageElement.removeAttribute("id");
            messageElement.querySelector("p").textContent = message;
            chatMessages.appendChild(messageElement);
        }
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

function sendMessage() {
    if (!chatInput) {
        console.error("Cannot send message: chat input is missing.");
        return;
    }
    const message = chatInput.value;
    messages.push(message);
}

function log(content) {
    messages.push(content);
}
