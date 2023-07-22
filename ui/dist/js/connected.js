async function getRoomData() {
    var response = await fetch("http://localhost:5000/connected/data");
    return response.json();
} 

window.onload = async () => {
    const data = await getRoomData();

    const storage = document.getElementById("storage");
    const template = document.getElementById("storageItem");

    for (const item of data) {
        const itemElement = template.cloneNode(true);
        itemElement.removeAttribute("id");
        itemElement.lastChild.textContent = item.toString();
        storage.appendChild(itemElement);
    }
};