const BASE = new URL("http://localhost:5000");

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
    await writeInfoMessage("lobby created!");
    renderLobbyName(lobbyData.name, lobbyName);
    renderGameInformation(lobbyData.game, gameName, numberOfPlayers);
    clearPlayers(players);
    renderPlayers(lobbyData.players, getNameFromPlayer, playerTemplate, players);
    renderPlayers(lobbyData.bots, getNameFromPlayer, botTemplate, players);
    renderPlayers(lobbyData.playerJoinRequests, getNameFromJoinRequest, playerJoinRequestTemplate, players);
    renderPlayers(lobbyData.botJoinRequests, getNameFromJoinRequest, botJoinRequestTemplate, players);
    setInterval(async () => {
        lobbyData = await requestLobbyData();
        const messages = await requestMessages(lobbyData.host.name);
        for (const message of messages) {
            appendChatMessage(`${message.sender}: ${message.content}`);
        }
        clearPlayers(players);
        renderPlayers(lobbyData.players, getNameFromPlayer, playerTemplate, players);
        renderPlayers(lobbyData.bots, getNameFromPlayer, botTemplate, players);
        renderPlayers(lobbyData.playerJoinRequests, getNameFromJoinRequest, playerJoinRequestTemplate, players);
        renderPlayers(lobbyData.botJoinRequests, getNameFromJoinRequest, botJoinRequestTemplate, players);
    }, 1000)
};

function getNameFromPlayer(player) {
    return player.name;
}
function getNameFromJoinRequest(request) {
    return request.playerName;
}

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
        await writeInfoMessage(`lobby name updated to ${newName}`);
    } else {
        await writeErrorMessage("Failed to save lobby name!", response);
        console.error("Failed to save lobby name", response);
    }
}

async function startGame() {
    await writeInfoMessage("Starting game...");
    const playerName = lobbyData.host.name;
    const url = new URL(`/lobbies/start/${playerName}`, BASE);
    const response = await fetch(url, {
        method: "POST",
        redirect: "follow",
    });
    if (response.ok && response.redirected) {
        window.location = response.url;
    } else {
        await writeErrorMessage("Failed to start the lobby!", response);
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
        await writeInfoMessage(`${bot.botName} has requested to join the lobby.`);
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
            await writeErrorMessage("Failed to approve bot join request", addResponse);
        }
    } else {
        await writeErrorMessage("Failed to send request to add a bot.", response);
    }
}

async function acceptPlayer(event) {
    const playerElement = event.target.parentNode.querySelector("p");
    const playerName = playerElement.textContent;
    const addPlayer = {playerName: lobbyData.host.name, newPlayer:playerName};
    console.log(addPlayer);
    const addPlayerUrl = new URL(`/lobbies/${lobbyData.id}/players`, BASE);
    const addPlayerResponse = await fetch(addPlayerUrl, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(addPlayer),
    });
    if (addPlayerResponse.ok) {
        writeInfoMessage(`Player join request is accepted: ${playerName}`);
    } else {
        await writeErrorMessage(`Failed to accept player join request: ${playerName}`, addPlayerResponse);
    }
}

async function kickPlayer(event) {
    const playerElement = event.target.parentNode.querySelector("p");
    const playerName = playerElement.textContent;
    if (playerName == lobbyData.host.name) {
        await writeErrorMessage("I cannot kick myself! Just leave the lobby :)", event);
        return;
    }
    const kickPlayerUrl = new URL(`/lobbies/${lobbyData.id}/players/${playerName}`, BASE);
    const response = await fetch(kickPlayerUrl, {
        method: "DELETE",
    });
    if (response.ok) {
        writeInfoMessage(playerName + " was removed from the lobby.");
    } else {
        await writeErrorMessage("Failed to remove " + playerName + " from the lobby!", response);
    }
}

async function kickBot(event) {
    const botElement = event.target.parentNode.querySelector("p");
    const botName = botElement.textContent;
    if (!botName) {
        await writeErrorMessage("Bot name cannot be empty", botElement);
    }
    const url = new URL(`/lobbies/${lobbyData.id}/bots/${botName}`, BASE);
    const response = await fetch(url, { method: "DELETE" });
    if (response.ok) {
        await writeInfoMessage(botName + " was removed from the lobby.");
    } else {
        await writeErrorMessage("Failed to remove " + botName + " from the lobby!", response);
    }
}

async function leaveLobby() {
    await writeErrorMessage("leaving lobby... :(");
    console.error("Leave Lobby: not implemented!");
}

async function sendMessage() {
    if (messageInput.value) {
        await writeInfoMessage(messageInput.value);
        messageInput.value = "";
    }
}

async function requestLobbyData() {
    const url = new URL(".", window.location);
    const response = await fetch(url);
    return response.json();
} 

async function requestMessages(player) {
    const url = new URL(`/lobbies/${lobbyData.id}/messages/${player}`, BASE);
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

function renderPlayers(players, playerParser, template, storage) {
    for (const player of players) {
        const playerElement = template.cloneNode(true);
        playerElement.removeAttribute("id");
        let playerName = playerParser(player);
        playerElement.querySelector("p").textContent = playerName.toString();
        storage.appendChild(playerElement);
    }
}

function spam() {
    for (let index = 0; index < 100; ++index) {
        writeMessage("debug", index);
    }
}

async function writeInfoMessage(content) {
    console.log(content);
    await writeMessage(lobbyData.host.name, content);
}

async function writeErrorMessage(content, debugContent) {
    console.error(content);
    console.error(debugContent);
    writeMessage(lobbyData.host.name, content);
    if (debugContent.json) {
        debugContent.json().then((d) => console.error(d));
    }
}

async function writeMessage(sender, content) {
    const url = new URL(`./lobbies/${lobbyData.id}/messages/${sender}`, BASE);
    await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ content })
    });
}

function appendChatMessage(message) {
    const chatMessageElement = chatMessageTemplate.cloneNode(true);
    chatMessageElement.removeAttribute("id");
    chatMessageElement.querySelector("p").textContent = message;
    chat.prepend(chatMessageElement);
}
