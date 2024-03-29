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
            balanceAmount: {
                type: Number,
                min: 0
            },
            name: String,
            players: [
                {
                    _id: false,
                    playerName: String,
                    apiName: String
                }
            ],
            points: [
                {
                    _id: false,
                    matchId: Number,
                    fantasyPoints: Number
                }
            ]
        }
    ]
})

module.exports = mongoose.model("Room", roomSchema);
