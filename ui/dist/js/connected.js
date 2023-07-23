async function getRoomData() {
    var response = await fetch("http://localhost:5000/connected/data");
    return response.json();
} 

async function startGame() {
    console.log("start...");
    const response = await fetch(
        "http://localhost:5000/game/start", 
        { method: "POST", redirect: "follow" }
    );
    if (response.redirected) {
        window.location = response.url;
    }
}

window.onload = async () => {
    const data = await getRoomData();

    const storage = document.getElementById("storage");
    const template = document.getElementById("storageItemTemplate");

    for (const item of data) {
        const itemElement = template.cloneNode(true);
        itemElement.removeAttribute("id");
        itemElement.lastChild.textContent = item.toString();
        storage.appendChild(itemElement);
    }
};