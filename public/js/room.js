const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const dropDown = document.getElementById("drop-down");
const selectPlayer = document.getElementById("select-player");
const playersList = document.querySelector(".players-list");
const input = document.getElementById("msg");
const response = document.querySelector(".response");
const money = document.getElementById("money-value");
const bul = document.getElementById("bul");
const busl = document.querySelector("#busl");
const teamsList = document.getElementById("teams-list");
const balanceAmount = document.getElementById("balance");
const startGame = document.getElementById("start-game");
const scores = document.getElementsByClassName("score");

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

// Show balanced users list to room mates
socket.on("bul", ({ users }) => {
    busl.innerHTML = `
        ${users.map(user => `<h6>${user.username}</h6>`).join('')}
    `
    $("#bul").modal("show")
})

// Shows remaining amount of the user
socket.on("balance", ({ balance }) => {
    balanceAmount.innerHTML = `
        <h2>Balance: ${balance}Cr</h2>
    `
})

// Runs when game started
startGame.addEventListener("click", () => {
    startGame.innerHTML = "<i class='bx bx-stop-circle'></i>&nbsp;<em>Stop playing</em>"
    socket.emit("gameStarted")
    console.log("Signal send");
    setInterval(() => {
        socket.emit("gameStarted")
        console.log("Signal send");
    }, 1000 * 60 * 20);
})

// Receive scores from server
socket.on("scores", ({ op }) => {
    Array.from(scores).forEach(score => {
        let name = score.innerText.replace(/team\s*(\([0-9]*\))*/, "").trim()
        const player = op.filter(p => p.name === name)[0]
        score.innerText = `${name} team (${player.score})`
    })
})

// Display current teams 
socket.on("lop", ({ currentTeamData }) => {

    if (currentTeamData.length === 0) {
        teamsList.previousElementSibling.textContent = '';
    } else {

        teamsList.innerHTML = `
        ${currentTeamData.map(team => {
            return (
                `
                <div class="card team" style="width: 15rem;">
                    <div class="card-body">
                        <h5 class="card-title score">${team.name} team</h5>
                        <hr>
                        ${team.players.map(p => `<p class="card-text">${p.playerName}</p>`).join('')}
                    </div>
                </div>
            `
            )
        }).join('')}`

    }
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
        <div class="chatContainer row">
            <div class="avatar-circle col-2">
                <span class="initials"> ${mssg.username[0]} </span>
            </div>
            <div class="col">
                <span class="time-left"><b style="color: black;">${mssg.username}</b></span><br>
                <p style="font-weight: 450; text-transform: none;" align=left><em> ${mssg.text} </em></p>
            <div>
        </div>       
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
        ${users.map(user => `
            <div class="row" style="margin: 5px;"> 
                <div class="avatar-circle col-2">
                    <span class="initials"> ${user.username[0]} </span>
                </div> 
                <div class="col"> ${user.username} </div>
            </div>`
    ).join('')}
    `
}

// Add players to window object
function addPlayers(data) {
    window.series = data;
}

// Show functionality
function showMenu() {
    selectPlayer.disabled = false;
    selectPlayer.offsetParent.style.cursor = ""
    playersList.classList.remove("d-none")
    playersList.classList.add("d-block")
}

// Hide functionality
function hideMenu() {
    selectPlayer.disabled = true;
    selectPlayer.offsetParent.style.cursor = "not-allowed"
    playersList.classList.remove("d-block")
    playersList.classList.add("d-none")
}

// Get the value of drop down
dropDown.addEventListener("change", event => {
    let value = event.target.value;
    if (value === "Select your series") hideMenu();
    else if (value === "ipl") {
        addPlayers(ipl);
        showMenu();
    }
    else if (value === "t20") hideMenu();
    else if (value === "odi") hideMenu();
})

// selects player
money.addEventListener("submit", e => {
    e.preventDefault();

    let money = e.target.elements.mv.value;
    let name = e.target.elements.pname.value;

    // Checks whether all fields are filled with valid conditions
    if (name && money && money >= 0 && money <= 100) {
        socket.emit("bet", { money, name })

        $("#money").modal('hide');
        e.target.elements.pname.value = "";
        e.target.elements.mv.value = 0;
    } else {
        console.log("Enter all fields with correct validations!!");
    }
})
