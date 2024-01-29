window.onload = main;

const BASE = new URL("http://localhost:5000/");

const GAME_NAME = "gameNameValue";
const NUMBER_OF_PLAYERS = "numberOfPlayersValue";

const PLAYERS = "players";
const PLAYER_TEMPLATE = "playerTemplate";

const CHAT_MESSAGES = "chatMessages";
const MESSAGE_TEMPLATE = "messageTemplate";
const CHAT_INPUT = "chatInput";

let chatInput = null;

let postMessages = [];

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
    await updateLobbyInformation();
    setInterval(mainUpdate, 1000);
}

async function updateLobbyInformation() {
    const playerName = sessionStorage.getItem("playerName");
    const url = new URL(`/lobbies/${playerName}`, BASE);
    const response = await fetch(url);
    const information = (await response.json())[0];
    const gameNameElement = document.getElementById(GAME_NAME);
    const numberOfPlayersElement = document.getElementById(NUMBER_OF_PLAYERS);
    gameNameElement.textContent = information.game.name;
    numberOfPlayersElement.textContent = information.game.numberOfPlayers;
}

function createPlayerUpdate() {
    const playerTemplate = document.getElementById(PLAYER_TEMPLATE);
    const playersElement = document.getElementById(PLAYERS);
    return async (lobbyData) => {
        renderPlayers(playersElement, lobbyData.players, playerTemplate);
    };
}

function createChatUpdate() {
    const playerName = sessionStorage.getItem("playerName");
    const messageTemplate = document.getElementById(MESSAGE_TEMPLATE);
    const chatMessages = document.getElementById(CHAT_MESSAGES);
    return async (lobbyData) => {
        for (const message of postMessages) {
            await postMessage(lobbyData.id, playerName, message);
        }
        postMessages = [];
        const messages = await requestMessages(lobbyData.Id, playerName);
        while (messages.length > 0) {
            const message = messages.pop();
            const content = `${message.sender}: ${message.content}`;
            const messageElement = messageTemplate.cloneNode(true);
            messageElement.removeAttribute("id");
            messageElement.querySelector("p").textContent = content;
            chatMessages.prepend(messageElement);
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
    postMessages.push(message);
}

function log(content) {
    postMessages.push(content);
}

async function requestMessages(lobbyId, playerName) {
    const url = new URL(`lobbies/${lobbyId}/messages/${playerName}`, BASE);
    const response = await fetch(url);
    return response.json();
}

async function postMessage(lobbyId, playerName, content) {
    const url = new URL(`lobbies/${lobbyId}/messages/${playerName}`, BASE);
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type' : 'application/json'},
        body: JSON.stringify({content})
    });
}
