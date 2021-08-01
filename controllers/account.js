const User = require("../models/user");
const Room = require("../models/room")

module.exports.renderForm = (req, res) => {
    res.render("userInfo/settings", { style: 'settings' });
}

module.exports.updateDetails = async (req, res) => {
    try {
        const { username, email } = req.body;
        const updatedUser = await User.findOneAndUpdate({ _id: { $eq: req.user._id } }, { username, email }, { new: true });
        if (updatedUser.username !== req.user.username) {
            console.log("in if")
            const rooms = await Room.find({ "admin.id": { $eq: req.user._id } })
            rooms.map(async room => {
                room.admin.username = updatedUser.username
                await room.save()
            })
        }
        req.flash("success", "Changes saved successfully");
        res.redirect("/settings");
    } catch (e) {
        req.flash("error", "Oho no, something went wrong!!");
        res.redirect("/settings");
    }
}

module.exports.deleteAccount = async (req, res) => {
    try {
        const id = req.user._id;
        await User.findOneAndRemove({ _id: { $eq: id } });
        req.flash("success", "Awww, we would like to see you back!!");
        res.redirect("home");
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("back");
    }
}
