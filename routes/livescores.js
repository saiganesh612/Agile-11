const express = require('express');
const router = express.Router();
const api = require("../apis/index");

router.get("/home", async (req, res) => {
    let matchList = await api.getListOfMatches();
    res.render("matchdata/home", { style: 'home', matchList });
    console.log("data sent successfully");
})

router.get("/score/:matchid/:seriesid", async (req, res) => {
    const { matchid, seriesid } = req.params;
    const data = await api.getScoreCard(matchid, seriesid);
    res.render("matchdata/scorecard", { style: 'scorecard', data })
})

module.exports = router;
