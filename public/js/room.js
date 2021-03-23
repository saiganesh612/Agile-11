const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

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

// Adding results to DOM
function outputMessage(mssg) {
    const div = document.createElement('div');
    div.innerHTML = `
        <p> ${mssg.username} <span><em>${mssg.time}</em></span> </p>
        <h6>${mssg.text}</h6><hr>
    `;
    document.querySelector(".response").appendChild(div);
}

// Add room name to DOM
function outputRoomName(id, room) {
    roomName.innerHTML = `
        <h3> <span><em> Roomname: </em></span> ${room} </h3>
        <p> <span><em> Roomid: </em></span> ${id} </p>
    `;
}

// Add users to DOM
function outputUsers(users) {
    userList.innerHTML = `
        ${users.map(user => `<li>${user.username}</li>`).join('')}
    `
}
