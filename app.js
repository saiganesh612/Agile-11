if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const passport = require("passport");
const localStrategy = require("passport-local");
const flash = require("connect-flash");
const methodOverride = require("method-override");

const User = require("./models/user");

const userRoutes = require("./routes/Auth");
const scoreRoutes = require("./routes/livescores");
const infoRoutes = require("./routes/userInfo");

//Connecting to database
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/Agile11";
mongoose.connect(dbUrl, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
})

//configuring the various file paths
app.set('views', path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(flash());

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Mongoose connection denied"));
db.once("open", () => {
    console.log("Mongoose connection established!!");
})

//Passport Configuration
app.use(require("express-session")({
    secret: "my name is ganesh",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// This route is used to provide user data through all the routes 
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
})

//Defining routes
app.get("/", (req, res) => {
    res.render("landingpage");
})

app.use("/account", userRoutes);
app.use(scoreRoutes);
app.use(infoRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})
