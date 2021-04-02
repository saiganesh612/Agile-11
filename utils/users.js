let users = [];
const rusers = {};
const betDetails = {};

// Join user to the room
function joinUser(id, username, room) {
    const user = { id, username, room };

    const key = Object.keys(rusers).filter(r => r === room);
    if (key.length === 0) {
        rusers[room] = [];
        rusers[room].push(user)
    } else {

        const verify = rusers[room].filter(u => u.username === username);
        if (verify.length === 0) rusers[room].push(user);

    }
    users.push(user)
    return user;
}

function getCurrentUser(id) {
    return users.find(user => user.id === id);
}

// User leaves room
function userLeft(id) {
    const index = users.findIndex(user => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

// Get list of users in room
function getRoomUsers(room) {
    users = users.filter(user => user.room === room);
    return users;
}

// Combine respective bet details
function getDetails(id, m, name, room) {
    const user = users.find(user => user.id === id);
    const tlist = room.teams;
    const rname = room.roomName

    // Checks whether all users are present in the room
    if (rusers[rname].length !== room.players.length + 1) return "Your room-mates are missing so wait until they join the room."

    // Checks whether the given player is already selected or not
    let t;
    tlist.forEach(team => {
        const check = team.players.filter(p => p === name);
        if (check.length !== 0) t = team;
    })
    if (t) return `${name} was already selected by ${t.name} better choose another player`;

    // Checks for the room that current user wants to access
    const roomkey = Object.keys(betDetails).filter(r => r === rname);
    if (roomkey.length === 0) {
        betDetails[rname] = {};
        betDetails[rname][name] = [];
        const state = { "username": user.username, "money": parseFloat(m) };
        betDetails[rname][name].push(state);
        const details = betDetails[rname][name];
        const lou = rusers[rname];
        return { details, lou };
    }

    // If room exists then checks whether the player was detected or not
    const pkey = Object.keys(betDetails[rname]).filter(p => p === name);
    if (pkey.length === 0) {
        betDetails[rname][name] = [];
        const state = { "username": user.username, "money": parseFloat(m) };
        betDetails[rname][name].push(state);
        const details = betDetails[rname][name];
        const lou = rusers[rname];
        return { details, lou };
    }

    // Checks whether the user was cheating on his/her team-mates
    const check = betDetails[rname][name].filter(u => u.username === user.username);
    if (check.length > 0) return `You already selected this player with an amount of ${check[0].money}`;

    // If everything works fine then this snippet will run
    const state = { "username": user.username, "money": parseFloat(m) };
    betDetails[rname][name].push(state);
    const details = betDetails[rname][name];
    const lou = rusers[rname];
    return { details, lou };
}

module.exports = { joinUser, getCurrentUser, userLeft, getRoomUsers, getDetails }
