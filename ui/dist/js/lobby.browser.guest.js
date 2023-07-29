const storage = document.getElementById("storage");
const template = document.getElementById("storageItemTemplate");

window.onload = async () => {
    const data = await requestLobbyData();
    renderLobbyData(data);
};

async function requestLobbyData() {
    var response = await fetch("http://localhost:5000/connected/data");
    return response.json();
} 

function renderLobbyData(data) {
    for (const item of data) {
        const itemElement = template.cloneNode(true);
        itemElement.removeAttribute("id");
        itemElement.lastChild.textContent = item.toString();
        storage.appendChild(itemElement);
    }
}