const input = document.getElementById("playerName");

function savePlayer() {
    sessionStorage.setItem("playerName", input.value);
}

window.onload = () => {
    input.value = "Player " + Math.floor(Math.random() * 100);
}