if (process.env.NODE_ENV !== "production") {
    require("dotenv").config()
}

const mongoose = require("mongoose");
const api = require("./apis/index");
const Scorecard = require("./models/scorecard");
const Innings = require("./models/innings");

dbURL = process.env.DB_URL || "mongodb://localhost:27017/Agile11";
mongoose.connect(dbURL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error!!!"));
db.once("open", () => {
    console.log("Connection opened!!!");
})

//Saving match data to our database in every paticular time period
const init = async () => {
    let ids = await getListOfCompletedMatchIds();
    getInningsdataAndCommitChanges(ids);
}

const getListOfCompletedMatchIds = async () => {
    try {
        let matchids = [];
        let mList = await api.getListOfMatches();
        let { matches } = mList.matchList;
        for (let match of matches) {
            // Level 1 Checking
            if (match.status === 'COMPLETED') {
                let mid = match.id;
                let sid = match.series.id;
                let matchdetails = { matchid: mid, seriesid: sid };
                matchids.push(matchdetails)
            } else if (match.status === 'UPCOMING') break;
        }
        return matchids;
    } catch (err) {
        console.log(err.message);
    }
}

const generateInningsDocument = (inning) => {
    let id = inning.id, wicket = inning.wicket, run = inning.run, over = inning.over, runRate = inning.runRate

    let batters = [], bowlers = [];
    inning.batsmen.forEach(batter => {
        let name = batter.name, runs = batter.runs, balls = batter.balls, fours = batter.fours,
            sixes = batter.sixes, strikeRate = batter.strikeRate, howOut = batter.howOut

        let newBatter = { name, runs, balls, fours, sixes, strikeRate, howOut };
        batters.push(newBatter);
    })
    inning.bowlers.forEach(bowler => {
        let name = bowler.name, overs = bowler.overs, wickets = bowler.wickets, runsConceded = bowler.runsConceded,
            wides = bowler.wides, eco = bowler.economy

        let newBowler = { name, overs, wickets, runsConceded, wides, eco };
        bowlers.push(newBowler);
    })

    let newInning = { id, batsmen: batters, bowlers, wicket, run, over, runRate };
    return newInning;
}

const getInningsdataAndCommitChanges = async (ids) => {
    try {
        for (let id of ids) {
            let { matchid, seriesid } = id;
            let data = await api.getScoreCard(matchid, seriesid);
            let { name } = data.meta.series;
            let sc = await Scorecard.findOne({ matchName: name })
            if (!sc) {
                // Create new scorecard
                let newMatch = new Scorecard({ matchName: name });
                // create innings instance
                let { innings } = data.fullScorecard;
                let i = innings.map(inning => {
                    let inn = generateInningsDocument(inning);
                    let newInning = new Innings(inn);
                    return newInning.save();
                })
                let inning = await Promise.all(i);
                // add innings to scorecard and commit the scorecard to make changes
                newMatch.innings.push(...inning);
                await newMatch.save();
                console.log("scorecard created successfully");

            } else {
                let { innings } = data.fullScorecard;
                let newInnings = [];
                // checks whether current innings present in database
                if (sc.innings.length < innings.length) {
                    let len = innings.length - sc.innings.length;
                    for (let i = 0; i < len; i++) {
                        let inn = generateInningsDocument(innings[i]);
                        let newInning = new Innings(inn);
                        newInnings.push(newInning.save());
                    }
                    let i = await Promise.all(newInnings);
                    sc.innings.push(...i);
                    await sc.save();
                    console.log("New innings added successfully");
                } else {
                    console.log("Their is no new inning to add");
                }
            }
        }

    } catch (err) {
        console.log(err.message);
    }
}

init();
