const express = require('express');
const router = express.Router();
const api = require("../apis/index");

router.get("/home", async (req, res) => {
    try {
        let matchList = await api.getListOfMatches();
        res.render("matchdata/home", { style: 'home', matchList });
        console.log("data sent successfully");
    } catch (e) {
        console.log(e.message);
        res.redirect("/error");
    }
})

router.get("/score/:matchid/:seriesid", (req, res) => {
    const { matchid, seriesid } = req.params;
    Promise.allSettled([
        api.getScoreCard(matchid, seriesid),
        api.getPlayersList(matchid, seriesid),
        api.getLiveData(matchid, seriesid)
    ]).then((response) => {
        res.render("matchdata/scorecard", {
            style: 'scorecard',
            data: response[0].value,
            playersList: response[1].value,
            liveData: response[2].value
        });
    }).catch((e) => {
        console.log(e.message);
        res.redirect("/error")
    })
})

module.exports = router;
