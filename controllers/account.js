const User = require("../models/user");

module.exports.renderForm = (req, res) => {
    res.render("userInfo/settings", { style: 'settings' });
}

module.exports.updateDetails = async (req, res) => {
    try {
        const { username, email } = req.body;
        const updatedUser = await User.findByIdAndUpdate({ $eq: req.user._id }, { username, email }, { new: true });
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
        await User.findByIdAndDelete(id);
        req.flash("success", "Awww, we would like to see you back!!");
        res.redirect("home");
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("back");
    }
}
