const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Room = require("../models/room");
const { isLoggedIn } = require("../middleware/index");
const formatMsg = require("../utils/message");
const { joinUser, getCurrentUser, userLeft, getRoomUsers, getDetails } = require("../utils/users");
const ipl = require("../public/seriesdata/ipl");

// Display's player stats
router.get("/dashboard", isLoggedIn, async (req, res) => {
    const { _id, username } = req.user;
    const listOfRooms = await Room.find({ $or: [{ players: { $in: [_id] } }, { "admin.username": { $eq: username } }] });
    res.render("userInfo/dashboard", { style: 'dashboard', rooms: listOfRooms.reverse() });
})

// Creates a new room and save it to database
router.post("/createroom", isLoggedIn, async (req, res) => {
    try {
        const { roomname } = req.body;
        const { _id, username } = req.user;
        let admin = { id: _id, username }
        const user = await User.findOne({ username: { $eq: username } })
        if (!user) {
            req.flash("error", "U don't have permission to create room!!");
            res.redirect("/account/login");
        } else {
            const newRoom = new Room({ roomName: roomname, admin });
            await newRoom.save();
            user.rooms.unshift(newRoom);
            await user.save();
            req.flash("success", "Share your room details with your friends and start playing.")
            res.redirect(`/room/${newRoom._id}`);
        }
    } catch (e) {
        req.flash("error", "Oh no! Something went wrong.");
        res.redirect("/dashboard");
    }
})

// Search for the room and enters the room
router.post("/enterroom", isLoggedIn, async (req, res) => {
    try {
        const { roomname, roomid } = req.body;
        const { username, _id } = req.user;
        const user = await User.findOne({ username: { $eq: username } });
        if (!user) throw "You don't have permission to play in rooms.";
        const room = await Room.findOne({ _id: { $eq: roomid }, roomName: { $eq: roomname } });

        //Check whether room was created or not
        if (!room) throw "Room was not found!";

        // Checks ownership of the room with current user
        if (room.admin.username === username) throw "You created this room entering room will duplicates player in the room."

        // Check whether the room is filled or not
        if (room.players.length >= 7) throw "The room is filled!"

        // Check whether current user was already in room or not
        const dp = room.players.find(pid => pid.equals(_id));
        if (dp) throw "You already there in this room"

        // If there is no exception this code will be executed
        user.rooms.unshift(room);
        room.players.unshift(user);
        await user.save();
        await room.save();
        res.redirect(`/room/${room._id}`);
    } catch (e) {
        req.flash("error", e);
        res.redirect("/dashboard");
    }
})

// Core logic for creating the rooms and opens a socket
router.get("/room/:roomid", isLoggedIn, (req, res) => {
    const io = global.socketIO;
    io.once("connection", socket => {
        // Join in particular room
        let userid;
        socket.on("joinRoom", async ({ user, room }) => {
            // Retrive room and user details from database
            const userDetails = await User.findOne({ username: { $eq: user } })
            const roomDetails = await Room.findById(room);
            const { roomName, _id } = roomDetails;
            userid = userDetails._id;

            const puser = joinUser(userid, user, roomName);

            socket.join(puser.room);

            // Welcome current user
            socket.emit("message", formatMsg("Agile-11", `Welcome to ${puser.room} room`));

            //Broadcast when user joins
            socket.broadcast
                .to(puser.room)
                .emit("message", formatMsg("Agile-11", `${puser.username} joined in the room`));

            // Send users and room info
            io.to(puser.room).emit("roomUsers", {
                id: _id,
                room: puser.room,
                users: getRoomUsers(puser.room)
            })

        })
        // Listen for chat message
        socket.on("chatMessage", mssg => {
            let user = getCurrentUser(userid);

            io.to(user.room).emit("message", formatMsg(user.username, mssg))
        })

        // Listen for user amounts
        socket.on("bet", m => {
            let { betDetails, users } = getDetails(userid, m);
            const room = users[0].room;

            if (betDetails.length !== users.length) {

                const remainingPlayers = users.filter(user => {
                    return !betDetails.some(u => {
                        return user.username === u.username.username
                    })
                })

                io.to(room)
                    .emit("message", formatMsg("Agile-11", `${remainingPlayers.length} players doesn't make any decision`))

            } else {
                // Get list of players with bet details
                const compareCapital = betDetails.map(user => {
                    return {
                        "name": user.username.username,
                        "money": user.money
                    }
                });
                // Get the winner in the room
                const winner = compareCapital.reduce(function (prev, current) {
                    return (prev.money > current.money) ? prev : current
                })
                io.to(room)
                    .emit("message", formatMsg("Agile-11", `${winner.name} has won and kept ${winner.money}rs/-`))
            }

        })

        //Runs when clients disconnect
        socket.on("disconnect", () => {
            const user = userLeft(userid);

            if (user) {
                io.to(user.room)
                    .emit("message", formatMsg("Agile-11", `${user.username} left the room`));

                // Send users and room info
                io.to(user.room).emit("roomUsers", {
                    id: user.id,
                    room: user.room,
                    users: getRoomUsers(user.room)
                })
            }
        })
    });
    res.render("rooms/room", { style: "room", id: req.params.roomid, ipl: ipl() });
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
