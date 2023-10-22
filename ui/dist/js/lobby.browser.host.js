const ROOT = "http://localhost:5000";
const LOBBY_START = ROOT + "/lobby/start";
const LOBBY_STOP = ROOT + "/lobby/leave";
const LOBBY_LOBBY_NAME = ROOT + "/lobby/name";
const LOBBY_DATA = ROOT + "/lobby/data";

const chat = document.getElementById("chat");
const chatMessageTemplate = document.getElementById("chatMessageTemplate");

const messageInput = document.getElementById("messageInput");

window.onload = async () => {
    const labelName = document.getElementById("lobbyName");
    const players = document.getElementById("players");
    const template = document.getElementById("playerTemplate");

    const gameName = document.getElementById("gameName");
    const numberOfPlayers = document.getElementById("numberOfPlayers");

    const lobbyData = await requestLobbyData();
    console.log(lobbyData);
    writeMessage("host", "lobby created");
    renderLobbyName(lobbyData.name, labelName);
    renderGameInformation(lobbyData.game, gameName, numberOfPlayers);
    renderLobbyPlayers(lobbyData.players, template, players);
    setInterval(async () => {
        const data = await requestLobbyData();
        writeMessage("host", "data updated for lobby " + data.name);
        renderLobbyPlayers(data.players, template, players);
    }, 1000)
};

async function saveLobbyName() {
    writeMessage("host", "lobby name changed");
    const response = await fetch(LOBBY_LOBBY_NAME,
        { method: "POST" });
    if (!response.ok) {
        console.error("Failed to save lobby name", response);
    }
}

async function startGame() {
    writeMessage("host", "starting game...");
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
    writeMessage("host", "leaving lobby...");
    console.error("Leave Lobby: not implemented!");
}

function sendMessage() {
    if (messageInput.value) {
        writeMessage("host", messageInput.value);
        messageInput.value = "";
    }
}

async function requestLobbyData() {
    var response = await fetch(LOBBY_DATA);
    return response.json();
} 

function renderLobbyName(labelName, labelNameElement) {
    labelNameElement.value = labelName;
}

function renderGameInformation(game, gameNameElement, numberOfPlayersElement) {
    gameNameElement.textContent = game.name;
    numberOfPlayersElement.textContent = game.numberOfPlayers;
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

function spam() {
    for (let index = 0; index < 100; ++index) {
        writeMessage("debug", index);
    }
}

function writeMessage(sender, content) {
    appendChatMessage(sender + ": " + content);
}

function appendChatMessage(message) {
    const chatMessageElement = chatMessageTemplate.cloneNode(true);
    chatMessageElement.removeAttribute("id");
    chatMessageElement.lastChild.textContent = message;
    chat.prepend(chatMessageElement);
}