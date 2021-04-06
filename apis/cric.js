const axios = require("axios");
const iplTeams = [
    'Mumbai Indians', 'Royal Challengers Bangalore', 'Chennai Super Kings', 'Delhi Capitals', 'Sunrisers Hyderabad',
    'Kolkata Knight Riders', 'Rajasthan Royals', 'Punjab Kings'
]
const cric = {};

cric.newMatches = async () => {
    const response = await axios.get(`https://cricapi.com/api/matches?apikey=${process.env.CRIC_API_KEY}`);
    // Compute today's date
    let day = new Date();
    let date = day.getDate();
    let month = day.getMonth();
    let year = day.getFullYear();
    let today = `${year}-${month + 1 > 9 ? month + 1 : '0' + (month + 1)}-${date > 9 ? date : '0' + date}`
    // Get relevant data by filtering
    const matches = response.data.matches.filter(match => {
        let day = match.date.slice(0, 10);
        if (day === today && iplTeams.includes(match['team-1'])) return match;
    })
    return matches
}

cric.fantasySummary = async id => {
    const res = await axios.get(`https://cricapi.com/api/fantasySummary?apikey=${process.env.CRIC_API_KEY}&unique_id=${id}`)
    return res.data.data
}

module.exports = cric;
