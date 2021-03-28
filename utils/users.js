let users = [];
const betDetails = {};

// Join user to the room
function joinUser(id, username, room) {
    const user = { id, username, room };
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
function getDetails(id, m, name) {
    const user = users.find(user => user.id === id);
    const key = Object.keys(betDetails).filter(key => key === name);

    if (key.length === 0) {
        betDetails[name] = [];
        const state = { "username": user.username, "money": m };
        betDetails[name].push(state);
    } else {
        const state = { "username": user.username, "money": m };
        betDetails[name].push(state);
    }
    return { betDetails, users };
}

module.exports = { joinUser, getCurrentUser, userLeft, getRoomUsers, getDetails }
