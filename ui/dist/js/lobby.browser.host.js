const ROOT = "http://localhost:5000";
const LOBBY_START = ROOT + "/lobby/start";
const LOBBY_STOP = ROOT + "/lobby/leave";
const LOBBY_LOBBY_NAME = ROOT + "/lobby/name";
const LOBBY_DATA = ROOT + "/lobby/data";
const LOBBY_ADD_BOT = ROOT + "/lobby/bot/add";
const LOBBY_DELETE_BOT = ROOT + "/lobby/bot";
const LOBBY_DELETE_PLAYER = ROOT + "/lobby/player";

let lobbyData = null;
let bots = [];
let savedLobbyName = "";

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
    lobbyData = await requestLobbyData();
    writeInfoMessage("lobby created!");
    renderLobbyName(lobbyData.name, lobbyName);
    renderGameInformation(lobbyData.game, gameName, numberOfPlayers);
    renderPlayers(lobbyData.players, playerTemplate, players);
    setInterval(async () => {
        lobbyData = await requestLobbyData();
        bots = data.bots;
        renderPlayers(data.players, playerTemplate, players);
    }, 1000)
};

async function saveLobbyName() {
    const newName = lobbyName.value;
    const response = await fetch(LOBBY_LOBBY_NAME, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({currentName: saveLobbyName, newName}),
    });
    if (response.ok) {
        writeErrorMessage("Failed to save lobby name!", response);
        console.error("Failed to save lobby name", response);
    } else {
        writeInfoMessage("lobby name updated");
        saveLobbyName = newName;
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
        name: "Bot " + bots.length
    };
    const response = await fetch(LOBBY_ADD_BOT, {
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
    if (playerName == lobbyData.host) {
        writeErrorMessage("I cannot kick myself! Just leave the lobby :)", event);
        return;
    }
    const player = {lobbyName: saveLobbyName, name: playerName};
    const response = await fetch(LOBBY_DELETE_PLAYER, {
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
    const bot = {lobbyName: saveLobbyName, name: botName};
    const response = await fetch(LOBBY_DELETE_BOT, {
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

function renderPlayers(data, playerTemplate, players) {
    while (players.firstChild) {
        players.removeChild(players.firstChild);
    }
    for (const player of data) {
        const playerElement = playerTemplate.cloneNode(true);
        playerElement.removeAttribute("id");
        playerElement.querySelector("p").textContent = player.name.toString();
        players.appendChild(playerElement);
    }
    for (const bot of bots) {
        const botElement = botTemplate.cloneNode(true);
        botElement.removeAttribute("id");
        botElement.querySelector("p").textContent = bot.name.toString();
        players.appendChild(botElement);
    }
}

function spam() {
    for (let index = 0; index < 100; ++index) {
        writeMessage("debug", index);
    }
}

function writeInfoMessage(content) {
    console.log(content);
    writeMessage(host, content);
}

function writeErrorMessage(content, debugContent) {
    console.error(content);
    console.error(debugContent);
    writeMessage(host, content);
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