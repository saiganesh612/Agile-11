const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/index");
const room = require("../controllers/rooms");
const enter = require("../controllers/roomentry");
const account = require("../controllers/account");

// Display's player stats
router.get("/dashboard", isLoggedIn, enter.dashboard)

// Creates a new room and save it to database
router.post("/createroom", isLoggedIn, enter.createRoom)

// Search for the room and enters the room
router.post("/enterroom", isLoggedIn, enter.enterRoom)

// Core logic for creating the rooms and opens a socket
router.get("/room/:roomid", isLoggedIn, room.startPlaying)

// Account info
router.route("/settings")
    .get(isLoggedIn, account.renderForm)
    .put(isLoggedIn, account.updateDetails)
    .delete(isLoggedIn, account.deleteAccount)

module.exports = router;
