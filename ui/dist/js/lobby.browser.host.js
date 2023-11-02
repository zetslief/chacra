const BASE = new URL("http://localhost:5000");
const LOBBY = new URL("./lobbies", BASE);
const LOBBY_START = new URL("./lobbies/start", BASE); // Consider something like /game-session
const LOBBY_STOP = new URL("./lobbies/leave", BASE); // Replate with DELETE method.
const LOBBY_LOBBY_NAME = new URL("./lobbies/name", BASE);
const LOBBY_BOT = new URL("./lobbies/bot", BASE);
const LOBBY_PLAYER = new URL("./lobbies/player", BASE);

let lobbyData = null;

const lobbyName = document.getElementById("lobbyName");

const gameName = document.getElementById("gameName");
const numberOfPlayers = document.getElementById("numberOfPlayers");

const chat = document.getElementById("chat");
const chatMessageTemplate = document.getElementById("chatMessageTemplate");

const players = document.getElementById("players");
const playerTemplate = document.getElementById("playerTemplate");
const botTemplate = document.getElementById("botTemplate");
const playerJoinRequestTemplate = document.getElementById("playerJoinRequestTemplate");
const botJoinRequestTemplate = document.getElementById("botJoinRequestTemplate");

const messageInput = document.getElementById("messageInput");

window.onload = async () => {
    lobbyData = await requestLobbyData();
    console.log(lobbyData, sessionStorage.getItem("playerName"));
    writeInfoMessage("lobby created!");
    renderLobbyName(lobbyData.name, lobbyName);
    renderGameInformation(lobbyData.game, gameName, numberOfPlayers);
    clearPlayers(players);
    renderPlayers(lobbyData.players, playerTemplate, players);
    renderPlayers(lobbyData.bots, botTemplate, players);
    renderPlayers(lobbyData.playerJoinRequests, playerJoinRequestTemplate, players);
    renderPlayers(lobbyData.botJoinRequests, botJoinRequestTemplate, players);
    setInterval(async () => {
        lobbyData = await requestLobbyData();
        clearPlayers(players);
        renderPlayers(lobbyData.players, playerTemplate, players);
        renderPlayers(lobbyData.bots, botTemplate, players);
        renderPlayers(lobbyData.playerJoinRequests, playerJoinRequestTemplate, players);
        renderPlayers(lobbyData.botJoinRequests, botJoinRequestTemplate, players);
    }, 1000)
};

async function saveLobbyName() {
    const newName = lobbyName.value;
    const url = new URL(`/lobbies/${lobbyData.id}/${lobbyData.host.name}`, BASE);
    const response = await fetch(url, {
        method: "PUT",
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
        botName: "Bot " + lobbyData.bots.length
    };
    const requestBotJoinUrl = new URL(`/lobbies/${lobbyData.id}/join/bots`, BASE);
    const response = await fetch(requestBotJoinUrl, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(bot),
    });
    if (response.status == 201) {
        writeInfoMessage(`${bot.botName} has requested to join the lobby.`);
        const addBotUrl = new URL(`/lobbies/${lobbyData.id}/bots`, BASE);
        const addBot = { playerName: lobbyData.host.name, botName: bot.botName};
        const addResponse = await fetch(addBotUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(addBot),
        });
        if (addResponse.ok) {
            writeInfoMessage(`${bot.botName} is added to the lobby`);
        } else {
            writeErrorMessage("Failed to approve bot join request", addResponse);
        }
    } else {
        writeErrorMessage("Failed to send request to add a bot.", response);
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

async function requestLobbyData() {
    const url = new URL(".", window.location);
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

function clearPlayers(storage) {
    while (storage.firstChild) {
        storage.removeChild(storage.firstChild);
    }
}

function renderPlayers(players, playerTemplate, storage) {
    for (const player of players) {
        const playerElement = playerTemplate.cloneNode(true);
        playerElement.removeAttribute("id");
        playerElement.querySelector("p").textContent = player.name.toString();
        storage.appendChild(playerElement);
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
    if (debugContent.json) {
        debugContent.json().then((d) => console.error(d));
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