const BASE = new URL("http://localhost:5000/");

const storage = document.getElementById("storage");
const template = document.getElementById("storageItemTemplate");

window.onload = async () => {
    const data = await requestLobbies(location);
    console.log(data);
    renderLobbyData(data, template, storage);

    setInterval(async () => {
        const data = await requestLobbies(location);
        renderLobbyData(data, template, storage);
    }, 1000)
};

async function requestLobbies(baseUrl) {
    const url = new URL("./", baseUrl);
    console.log(url);
    var response = await fetch(url);
    return response.json();
} 

function renderLobbyData(data, template, storage) {
    while (storage.firstChild) {
        storage.removeChild(storage.firstChild);
    }
    for (const item of data) {
        const itemElement = template.cloneNode(true);
        itemElement.removeAttribute("id");
        const valueElement = itemElement.lastElementChild;
        valueElement.textContent = item.toString();
        storage.appendChild(itemElement);
    }
}
