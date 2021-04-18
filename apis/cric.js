const axios = require("axios");
const iplTeams = [
    'Mumbai Indians', 'Royal Challengers Bangalore', 'Chennai Super Kings', 'Delhi Capitals', 'Sunrisers Hyderabad',
    'Kolkata Knight Riders', 'Rajasthan Royals', 'Punjab Kings'
]
const { calculateFieldingPoints, calculateBowlingPoints, calculateBatingPoints } = require("../utils/points");
const cric = {};

cric.newMatches = async () => {
    try {
        const response = await axios.get(`https://cricapi.com/api/matches?apikey=${process.env.CRIC_API_KEY}`);
        // Compute today's date
        let day = new Date();
        let date = day.getDate();
        let month = day.getMonth();
        let year = day.getFullYear();
        let today = `${year}-${month + 1 > 9 ? month + 1 : '0' + (month + 1)}-${date > 9 ? date : '0' + date}`

        if (!response.data.matches) throw "[Error] Api reached max limit count"

        // Get relevant data by filtering
        const matches = response.data.matches.filter(match => {
            let day = match.date.slice(0, 10);
            if (day === today && iplTeams.includes(match['team-1'])) return match;
        })
        return matches
    } catch (err) {
        console.log(err);
    }
}

cric.fantasySummary = async id => {
    try {
        const res = await axios.get(`https://cricapi.com/api/fantasySummary?apikey=${process.env.CRIC_API_KEY}&unique_id=${id}`)
        return { id: id, data: res.data.data }
    } catch (err) {
        console.log(err.message);
    }
}

// Compute and return the points from fielding scores
cric.computeFieldingPoints = match => {
    const fstats = []
    match.forEach(team => {
        team.scores.forEach(player => {
            const { name, runout, stumped, bowled, lbw } = player;
            const c = player.catch;
            const p = {};
            const fpoints = calculateFieldingPoints(c, stumped, lbw, bowled, runout);
            p['name'] = name
            p['points'] = fpoints
            fstats.push(p);
        })
    })
    return fstats;
}

// Compute and return the points from bowling scores
cric.computeBowlingPoints = match => {
    const bstats = []
    match.forEach(team => {
        team.scores.forEach(player => {
            const { NB, WD, Econ, W, M, bowler } = player;
            const zeros = player['0s'];
            const p = {};
            const bpoints = calculateBowlingPoints(W, M, NB, WD, zeros, Econ)
            p['name'] = bowler
            p['points'] = bpoints
            bstats.push(p);
        })
    })
    return bstats;
}

// Compute and return the points from batting scores
cric.computeBattingPoints = match => {
    const bstats = []
    match.forEach(team => {
        team.scores.forEach(player => {
            const { dismissal, SR, B, R, batsman } = player;
            const fours = player['4s'];
            const sixes = player['6s'];
            const p = {};
            const bpoints = calculateBatingPoints(R, fours, sixes, dismissal, SR, B);
            p['name'] = batsman
            p['points'] = bpoints
            bstats.push(p);
        })
    })
    return bstats;
}

// Main computation block that collects all points
cric.computeData = data => {
    const points = data.map(match => {
        const fieldingPoints = cric.computeFieldingPoints(match.data.fielding);
        const bowlingPoints = cric.computeBowlingPoints(match.data.bowling);
        const battingPoints = cric.computeBattingPoints(match.data.batting);
        return { id: match.id, points: { fieldingPoints, bowlingPoints, battingPoints } }
    })
    return points
}

module.exports = cric;
