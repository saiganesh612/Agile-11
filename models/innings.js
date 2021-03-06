const mongoose = require("mongoose")

const inningSchema = new mongoose.Schema({
    id: {
        type: Number,
        // enum: [1, 2, 3, 4],
        // unique: true
    },
    batsmen: [
        {
            _id: false,
            name: String,
            runs: Number,
            balls: Number,
            fours: Number,
            sixes: Number,
            strikeRate: String,
            howOut: String
        }
    ],
    bowlers: [
        {
            _id: false,
            name: String,
            overs: Number,
            wickets: Number,
            runsConceded: Number,
            wides: Number,
            eco: Number
        }
    ],
    wicket: Number,
    run: Number,
    over: Number,
    runRate: Number
})

module.exports = mongoose.model("Innings", inningSchema)
