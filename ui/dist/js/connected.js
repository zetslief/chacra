async function getRoomData() {
    var response = await fetch("http://localhost:5000/connected/data");
    return response.json();
} 

window.onload = async () => {
    const data = await getRoomData();
    console.log(data);
};