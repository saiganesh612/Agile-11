const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    roomName: String,
    admin: {
        id: {
            type: mongoose.Schema.Types.ObjectID,
            ref: "User"
        },
        username: String
    },
    players: [
        {
            type: mongoose.Schema.Types.ObjectID,
            ref: "User"
        }
    ]
})

module.exports = mongoose.model("Room", roomSchema);
