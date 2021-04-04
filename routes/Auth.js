const express = require("express");
const router = express.Router();
const passport = require("passport");
const control = require("../controllers/auth");

//Login route
router.get("/login", (req, res) => {
    res.render("Auth/login", { style: 'auth' });
})

router.post("/login", passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: "/account/login"
}), (req, res) => {
    req.flash("success", `Welcome back ${req.user.username}!!`);
    res.redirect("/dashboard");
})

//Signup routes
router.route("/signup")
    .get(control.signupForm)
    .post(control.signup)

//Logout routes
router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "You logged out");
    res.redirect("/home");
})

// ===========================Forgot Password Settings=====================================
// Forgot password routes
router.route("/forgotPass")
    .get(control.forgotPasswordForm)
    .post(control.forgotPassword);

// ========================Reset Password Settings==========================
// Reset routes
router.route("/reset/:token")
    .get(control.resetPasswordForm)
    .post(control.resetPassword);

module.exports = router;
