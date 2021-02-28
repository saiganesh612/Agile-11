const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { isLoggedIn } = require("../middleware/index");

router.get("/dashboard", isLoggedIn, (req, res) => {
    res.render("userInfo/dashboard", {style: 'dashboard'});
})

router.get("/settings", isLoggedIn, (req, res) => {
    res.render("userInfo/settings", {style: 'settings'});
})

router.put("/settings", isLoggedIn, async (req, res) => {
    try{
        const { username, email } = req.body;
        const updatedUser = await User.findByIdAndUpdate(req.user._id, { username, email }, { new: true });
        req.flash("success", "Changes saved successfully");
        res.redirect("/settings");
    } catch(e) {
        req.flash("error", "Oho no, something went wrong!!");
        res.redirect("/settings");
    }
})

router.delete("/destroy", isLoggedIn, async (req, res) => {
    try{
        const id = req.user._id;
        await User.findByIdAndDelete(id);
        req.flash("success", "Awww, we would like to see you back!!");
        res.redirect("home");
    } catch(e) {
        req.flash("error", e.message);
        res.redirect("back");
    }
})

module.exports = router;
