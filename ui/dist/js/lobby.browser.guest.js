const BASE = new URL("http://localhost:5000/");

const lobbies = document.getElementById("lobbies");

window.onload = async () => {
    const templates = (() => ({
        default: document.getElementById("lobbyItemTemplate"),
        requested: document.getElementById("requestedLobbyItemTemplate"),
        disabled: document.getElementById("disabledLobbyItemTemplate"),
    }))();
    const data = await requestLobbies(location);
    console.log(data);
    renderLobbyData(data, templates, lobbies);

    setInterval(async () => {
        const data = await requestLobbies(location);
        renderLobbyData(data, templates, lobbies);
    }, 1000)
};

async function requestLobbies(baseUrl) {
    const url = new URL("./", baseUrl);
    var response = await fetch(url);
    return response.json();
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
        itemElement.removeAttribute("id");
        const lobbyNameElement = getChildElementByClassName(itemElement, "lobbyName");
        lobbyNameElement.textContent = item.name;
        const gameName = getChildElementByClassName(itemElement, "gameName");
        gameName.textContent = item.game.name;
        const numberOfPlayers = getChildElementByClassName(itemElement, "numberOfPlayers");
        numberOfPlayers.textContent = item.game.numberOfPlayers;
        storage.appendChild(itemElement);
    }
}
