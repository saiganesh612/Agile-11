const mongoose = require("mongoose");
const moment = require("moment");

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
    ],
    timeStamp: {
        type: String,
        default: () => moment().format('MMMM Do YYYY, h:mm a')
    },
    teams: [
        {
            _id: false,
            name: String,
            players: [String]
        }
    ]
})

module.exports = mongoose.model("Room", roomSchema);
