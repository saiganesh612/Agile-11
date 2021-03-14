const mongoose = require("mongoose");

const scorecardSchema = new mongoose.Schema({
    matchName: String,
    innings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Innings"
        }
    ]
})

module.exports = mongoose.model("Scorecard", scorecardSchema)
