
window.onload = async () => {
    const storage = document.getElementById("storage");
    const template = document.getElementById("storageItemTemplate");

    const data = await requestLobbyData();
    renderLobbyData(data, template, storage);
    setInterval(async () => {
        const data = await requestLobbyData();
        renderLobbyData(data, template, storage);
    }, 1000)
};

async function startGame() {
    const response = await fetch(
        "http://localhost:5000/lobby/start", 
        { method: "POST", redirect: "follow" }
    );
    if (response.ok && response.redirected) {
        window.location = response.url;
    } else {
        console.error("Failed to start the lobby!");
        console.error(response);
    }
}

async function requestLobbyData() {
    var response = await fetch("http://localhost:5000/lobby/data");
    return response.json();
} 

function renderLobbyData(data, template, storage) {
    while (storage.firstChild) {
        storage.removeChild(storage.firstChild);
    }
    for (const item of data) {
        const itemElement = template.cloneNode(true);
        itemElement.removeAttribute("id");
        itemElement.lastChild.textContent = item.toString();
        storage.appendChild(itemElement);
    }
}