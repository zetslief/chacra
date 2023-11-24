const BASE = new URL("http://localhost:5000/");

const lobbies = document.getElementById("lobbies");

let data = null;
let joinRequestUrl = null;

window.onload = async () => {
    const templates = (() => ({
        default: document.getElementById("lobbyItemTemplate"),
        requested: document.getElementById("requestedLobbyItemTemplate"),
        disabled: document.getElementById("disabledLobbyItemTemplate"),
    }))();
    data = await requestLobbies(location);
    renderLobbyData(data, templates, lobbies);

    setInterval(async () => {
        if (joinRequestUrl) {
            const requestStatus = await getJoinRequestStatus(joinRequestUrl);
            console.error("TODO: request staus analysis is not implemented", requestStatus);
        }
        data = await requestLobbies(location);
        renderLobbyData(data, templates, lobbies);
    }, 1000)
};

async function requestLobbies(baseUrl) {
    const url = new URL("./", baseUrl);
    var response = await fetch(url);
    return response.json();
} 

async function getJoinRequestStatus(joinRequestUrl) {
    console.error("TODO: getJoinRequestStatus is not implemented", joinRequestUrl);
}

async function joinLobby(event) {
    if (joinRequestUrl) {
        console.warn("Joining lobby but request join request url already exists!", joinRequestUrl);
    }
    const parent = event.target.parentNode;
    const idAttribute = parent.getAttribute("id");
    if (idAttribute) {
        const url = new URL(`/lobbies/${idAttribute}/join/players`, BASE);
        const playerName = sessionStorage.getItem("playerName");
        const response = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({playerName}),
        });
        if (response.status == 201) {
            joinRequestUrl = new URL(response.headers.get("location"));
            console.log("Successfully sent the join request", joinRequestUrl);
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
        const itemElement = templates.default.cloneNode(true);
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
