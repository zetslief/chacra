const input = document.getElementById("playerName");

async function connect() {
    sessionStorage.setItem("playerName", input.value);
    const result = await fetch(
        "http://localhost:5000/lobby/connect",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerName: input.value }),
        }
    );
    if (result.ok) {
        console.log(input.value, "is connected!");
        if (result.redirected && result.url) {
            location.assign(result.url);
        } else {
            console.error("Result is ok, but where should I go? No redirection :(");
            console.error(result);
        }
    } else {
        console.error("Failed to connect", input.value);
        console.error(result);
    }
}

window.onload = () => {
    input.value = "Player " + Math.floor(Math.random() * 100);
}