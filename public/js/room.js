const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const dropDown = document.getElementById("drop-down");
const playersList = document.querySelector(".players-list");
const input = document.getElementById("msg");
const response = document.querySelector(".response");
const money = document.getElementById("money-value")

const socket = io();

// Join room
const [user, room] = [window.user, window.room];
socket.emit("joinRoom", { user, room });

// Get room and users
socket.on("roomUsers", ({ id, room, users }) => {
    outputRoomName(id, room);
    outputUsers(users);
})

// Message from server
socket.on("message", mssg => {
    outputMessage(mssg);
})

// Input message submit
input.addEventListener("change", e => {
    let mssg = e.target.value;
    // Send this message to server
    socket.emit("chatMessage", mssg);
    e.target.value = '';
})

// Adding results to DOM
function outputMessage(mssg) {
    const div = document.createElement('div');
    div.innerHTML = `
        <small class="mb-0"> ${mssg.username} <span><em>${mssg.time}</em></span> </small><br>
        <small>${mssg.text}</small><hr>
    `;
    response.appendChild(div);
}

// Add room name to DOM
function outputRoomName(id, room) {
    roomName.innerHTML = `
        <h4> <span><em> Room Name: </em></span> ${room} </h4>
        <p> <span><em> Room ID: </em></span> ${id} </p>
    `;
}

// Add users to DOM
function outputUsers(users) {
    userList.innerHTML = `
        ${users.map(user => `<li>${user.username}</li>`).join('')}
    `
}

function addPlayers(data) {
    window.series = data;
}

// Get the value of drop down
dropDown.addEventListener("change", event => {
    let value = event.target.value;
    if (value === "Select your series") {
        playersList.classList.remove("d-block")
        playersList.classList.add("d-none")
    } else if (value === "ipl") {
        addPlayers(ipl)
        playersList.classList.remove("d-none")
        playersList.classList.add("d-block")
    } else if (value === "t20") {
        playersList.classList.remove("d-none")
        playersList.classList.add("d-block")
    } else if (value === "odi") {
        playersList.classList.remove("d-none")
        playersList.classList.add("d-block")
    }
})

// selects player
money.addEventListener("submit", e => {
    e.preventDefault();

    let money = e.target.elements.mv.value;
    if (money < 0) {
        console.log("no -ve amounts");
    } else {
        socket.emit("bet", money)

        $("#money").modal('hide');
        e.target.elements.mv.value = 0;
    }
})
