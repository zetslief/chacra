const BASE = new URL("http://localhost:5000/");

const lobbies = document.getElementById("lobbies");

let data = null;
let requestedLobbyId = null;

let templates = (() => ({
    default: document.getElementById("lobbyItemTemplate"),
    disabled: document.getElementById("disabledLobbyItemTemplate"),
}))();

window.onload = async () => {
    templates = (() => ({
        default: document.getElementById("lobbyItemTemplate"),
        disabled: document.getElementById("disabledLobbyItemTemplate"),
    }))();

    await main();
    data.forEach(async (lobby) => {
        const rejected = await handleLobbyJoinRequest(lobby.id);
        if (!rejected) {
            requestedLobbyId = lobby.id;
            renderLobbyData(data, templates, lobbies);
        }
    });
    setInterval(main, 1000);
};

async function main() {
    if (requestedLobbyId) {
        const rejected = await handleLobbyJoinRequest(requestedLobbyId);
        if (rejected) {
            console.info("Player join reqest was rejected!");
            requestedLobbyId = null;
        }
    }
    data = await requestLobbies(location);
    renderLobbyData(data, templates, lobbies);
}

async function handleLobbyJoinRequest(lobbyId) {
    const playerName = sessionStorage.getItem("playerName");
    const requestInformation = await getJoinRequestStatus(lobbyId, playerName);
    if (requestInformation) {
        if (requestInformation.isAccepted) {
            transitionToLobby(lobbyId, requestInformation.playerName);
        }
        return false;
    } else {
        return true;
    }
}

function transitionToLobby(lobbyId, playerName) {
    location.assign(new URL(`/lobbies/${lobbyId}/${playerName}/view`, BASE));
}

async function getJoinRequestStatus(lobbyId, playerName) {
    const url = new URL(`/lobbies/${lobbyId}/join/players/${playerName}`, BASE);
    const response = await fetch(url);
    return response.ok ? await response.json() : undefined;
}

async function requestLobbies(baseUrl) {
    const url = new URL("./", baseUrl);
    var response = await fetch(url);
    return response.json();
} 

async function joinLobby(event) {
    if (requestedLobbyId) {
        console.warn("Joining lobby but request join request url already exists!", requestedLobbyId);
    }
    const parent = event.target.parentNode;
    const idAttribute = parent.getAttribute("id");
    if (idAttribute) {
        const playerName = sessionStorage.getItem("playerName");
        console.log(playerName);
        const url = new URL(`/lobbies/${idAttribute}/join/players/${playerName}`, BASE);
        const response = await fetch(url, { method: "POST" });
        if (response.status == 201) {
            requestedLobbyId = idAttribute;
            console.log("Successfully sent the join request", requestedLobbyId);
        } else {
            console.error("Failed to send the join request!", response);
        }
    } else {
        console.error("Failed to find id attribute on this element.", parent);
    }
}

function renderLobbyData(data, templates, storage) {
    function getChildElementByClassName(element, className) {
        const selected = element.querySelector(`.${className}`);
        if (selected && !Array.isArray(selected)) {
            return selected;
        } else {
            return undefined;
        }
    }

    while (storage.firstChild) {
        storage.removeChild(storage.firstChild);
    }
    for (const item of data) {
        const template = requestedLobbyId ? templates.disabled : templates.default;
        const itemElement = template.cloneNode(true);
        itemElement.setAttribute("id", item.id);
        const lobbyNameElement = getChildElementByClassName(itemElement, "lobbyName");
        lobbyNameElement.textContent = item.name;
        const gameName = getChildElementByClassName(itemElement, "gameName");
        gameName.textContent = item.game.name;
        const numberOfPlayers = getChildElementByClassName(itemElement, "numberOfPlayers");
        numberOfPlayers.textContent = item.game.numberOfPlayers;
        storage.appendChild(itemElement);
    }
}
