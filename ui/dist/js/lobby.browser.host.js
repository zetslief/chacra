const BASE = new URL("http://localhost:5000");
const LOBBY = new URL("./lobby", BASE);
const LOBBY_START = new URL("./lobby/start", BASE); // Consider something like /game-session
const LOBBY_STOP = new URL("./lobby/leave", BASE); // Replate with DELETE method.
const LOBBY_LOBBY_NAME = new URL("./lobby/name", BASE);
const LOBBY_BOT = new URL("./lobby/bot", BASE);
const LOBBY_PLAYER = new URL("./lobby/player", BASE);

let lobbyData = null;

const lobbyName = document.getElementById("lobbyName");

const gameName = document.getElementById("gameName");
const numberOfPlayers = document.getElementById("numberOfPlayers");

const chat = document.getElementById("chat");
const chatMessageTemplate = document.getElementById("chatMessageTemplate");

const players = document.getElementById("players");
const playerTemplate = document.getElementById("playerTemplate");
const botTemplate = document.getElementById("botTemplate");

const messageInput = document.getElementById("messageInput");

window.onload = async () => {
    lobbyData = await requestLobbyData(sessionStorage.getItem("playerName"));
    console.log(lobbyData, sessionStorage.getItem("playerName"));
    writeInfoMessage("lobby created!");
    renderLobbyName(lobbyData.name, lobbyName);
    renderGameInformation(lobbyData.game, gameName, numberOfPlayers);
    renderPlayers(lobbyData.players, lobbyData.bots, playerTemplate, botTemplate, players);
    setInterval(async () => {
        lobbyData = await requestLobbyData(lobbyData.name);
        renderPlayers(lobbyData.players, lobbyData.bots, playerTemplate, botTemplate, players);
    }, 1000)
};

async function saveLobbyName() {
    const newName = lobbyName.value;
    const url = new URL(`/lobby/${lobbyData.name}`, BASE);
    const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({newName}),
    });
    if (response.ok) {
        lobbyData.name = newName;
        writeInfoMessage(`lobby name updated to ${newName}`);
    } else {
        writeErrorMessage("Failed to save lobby name!", response);
        console.error("Failed to save lobby name", response);
    }
}

async function startGame() {
    writeInfoMessage("Starting game...");
    const response = await fetch(LOBBY_START, {
        method: "POST",
        redirect: "follow",
    });
    if (response.ok && response.redirected) {
        window.location = response.url;
    } else {
        writeErrorMessage("Failed to start the lobby!", response);
    }
}

async function addBot() {
    const bot = { 
        lobbyName: lobbyName.value,
        name: "Bot " + lobbyData.bots.length
    };
    const response = await fetch(LOBBY_BOT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bot),
    });
    if (response.ok) {
        writeInfoMessage("But is added to the lobby: " + bot.name);
    } else {
        writeErrorMessage("Failed to add bot.", response);
    }
}

async function kickPlayer(event) {
    const playerElement = event.target.parentNode.querySelector("p");
    const playerName = playerElement.textContent;
    if (playerName == lobbyData.host.name) {
        writeErrorMessage("I cannot kick myself! Just leave the lobby :)", event);
        return;
    }
    const player = {lobbyName: lobbyData.name, name: playerName};
    const response = await fetch(LOBBY_PLAYER, {
        method: "DELETE",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(player),
    });
    if (response.ok) {
        writeInfoMessage(playerName + " was removed from the lobby.");
    } else {
        writeErrorMessage("Failed to remove " + playerName + " from the lobby!", response);
    }
}

async function kickBot(event) {
    const botElement = event.target.parentNode.querySelector("p");
    const botName = botElement.textContent;
    const bot = {lobbyName: lobbyData.name, name: botName};
    const response = await fetch(LOBBY_BOT, {
        method: "DELETE",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(bot),
    });
    if (response.ok) {
        writeInfoMessage(botName + " was removed from the lobby.");
    } else {
        writeErrorMessage("Failed to remove " + botName + " from the lobby!", response);
    }
}

async function leaveLobby() {
    writeErrorMessage("leaving lobby... :(");
    console.error("Leave Lobby: not implemented!");
}

function sendMessage() {
    if (messageInput.value) {
        writeInfoMessage(messageInput.value);
        messageInput.value = "";
    }
}

async function requestLobbyData(lobbyName) {
    const url = new URL(`/lobby/${lobbyName}`, BASE);
    const response = await fetch(url);
    return response.json();
} 

function renderLobbyName(labelName, labelNameElement) {
    labelNameElement.value = labelName;
}

function renderGameInformation(game, gameNameElement, numberOfPlayersElement) {
    gameNameElement.textContent = game.name;
    numberOfPlayersElement.textContent = game.numberOfPlayers;
}

function renderPlayers(players, bots, playerTemplate, botTemplate, storage) {
    while (storage.firstChild) {
        storage.removeChild(storage.firstChild);
    }
    for (const player of players) {
        const playerElement = playerTemplate.cloneNode(true);
        playerElement.removeAttribute("id");
        playerElement.querySelector("p").textContent = player.name.toString();
        storage.appendChild(playerElement);
    }
    for (const bot of bots) {
        const botElement = botTemplate.cloneNode(true);
        botElement.removeAttribute("id");
        botElement.querySelector("p").textContent = bot.name.toString();
        storage.appendChild(botElement);
    }
}

function spam() {
    for (let index = 0; index < 100; ++index) {
        writeMessage("debug", index);
    }
}

function writeInfoMessage(content) {
    console.log(content);
    writeMessage(lobbyData.host.name, content);
}

function writeErrorMessage(content, debugContent) {
    console.error(content);
    console.error(debugContent);
    writeMessage(lobbyData.host.name, content);
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