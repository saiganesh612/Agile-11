module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()){
        req.flash("error", "You need to be LoggedIn");
        return res.redirect("/account/login");
    }
    next();
}
