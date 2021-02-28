const express = require('express');
const router = express.Router();
const api = require("../apis/index");

router.get("/home", async (req, res) => {
    let matchList = await api.getListOfMatches();
    res.render("home", { style: 'home', matchList });
    console.log("data sent successfully");
})

router.get("/score", async (req, res) => {
    const data = await api.getListOfMatches();
    res.send(data);
})

module.exports = router;

