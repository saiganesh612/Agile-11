const users = [];

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
    return users.filter(user => user.room === room)
}

module.exports = { joinUser, getCurrentUser, userLeft, getRoomUsers }
