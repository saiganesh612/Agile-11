const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Room = require("../models/room");
const { isLoggedIn } = require("../middleware/index");

router.get("/dashboard", isLoggedIn, (req, res) => {
    res.render("userInfo/dashboard", { style: 'dashboard' });
})

router.post("/createroom", isLoggedIn, async (req, res) => {
    try {
        const { roomname } = req.body;
        const { _id, username } = req.user;
        let admin = { id: _id, username }
        const user = await User.findOne({ username: { $eq: username } })
        if (!user) {
            console.log("U don't have permission to create room!!");
        } else {
            const newRoom = new Room({ roomName: roomname, admin });
            await newRoom.save();
            user.rooms.push(newRoom);
            await user.save();
            console.log("Room created successfully");
            res.redirect("/dashboard");
        }
    } catch (e) {
        console.log(e.message);
    }
})

router.post("/enterroom", (req, res) => {
    console.log(req.body.roomname);
})

router.get("/settings", isLoggedIn, (req, res) => {
    res.render("userInfo/settings", { style: 'settings' });
})

router.put("/settings", isLoggedIn, async (req, res) => {
    try {
        const { username, email } = req.body;
        const updatedUser = await User.findByIdAndUpdate(req.user._id, { username, email }, { new: true });
        req.flash("success", "Changes saved successfully");
        res.redirect("/settings");
    } catch (e) {
        req.flash("error", "Oho no, something went wrong!!");
        res.redirect("/settings");
    }
})

router.delete("/destroy", isLoggedIn, async (req, res) => {
    try {
        const id = req.user._id;
        await User.findByIdAndDelete(id);
        req.flash("success", "Awww, we would like to see you back!!");
        res.redirect("home");
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("back");
    }
})

module.exports = router;
