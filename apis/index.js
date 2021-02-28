const unirest = require("unirest");
let data = {};

data.getListOfMatches = () => {
    return new Promise((resolve, reject) => {
        unirest
            .get("https://dev132-cricket-live-scores-v1.p.rapidapi.com/matches.php")
            .query({
                "completedlimit": "5",
                "inprogresslimit": "5",
                "upcomingLimit": "5"
            })
            .headers({
                "x-rapidapi-key": process.env.API_KEY,
                "x-rapidapi-host": process.env.API_HOST,
                "useQueryString": true
            })
            .end(function (response) {
                if (response.error) {
                    return reject(response.error)
                }
                return resolve(response.body);
            })
    })
}

module.exports = data;
