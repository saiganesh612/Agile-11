const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Room = require("../models/room");
const { isLoggedIn } = require("../middleware/index");
const formatMsg = require("../utils/message");
const { joinUser, getCurrentUser, userLeft, getRoomUsers } = require("../utils/users");

// Display's player stats
router.get("/dashboard", isLoggedIn, (req, res) => {
    res.render("userInfo/dashboard", { style: 'dashboard' });
})

// Creates a new room and save it to database
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
            res.redirect(`/room/${newRoom._id}`);
        }
    } catch (e) {
        console.log(e.message);
    }
})

// Search for the room and enters the room
router.post("/enterroom", async (req, res) => {
    try {
        const { roomname } = req.body;
        const { username } = req.user;
        const user = await User.findOne({ username: { $eq: username } });
        if (!user) {
            req.flash("error", "You don't have permission to play in rooms.");
            res.redirect("/dashboard");
        } else {
            const room = await Room.findOne({ roomName: { $eq: roomname } });
            //Check whether room was created or not
            if (room && room.admin.username !== username) {
                user.rooms.push(room);
                room.players.push(user);
                await user.save();
                await room.save();
                res.redirect(`/room/${room._id}`);
            } else {
                req.flash("error", "Room was not found or probably you created this room.");
                res.redirect("/dashboard");
            }
        }
    } catch (e) {
        console.log(e.message);
    }
})

// Core logic for creating the rooms and opens a socket
router.get("/room/:roomid", (req, res) => {
    const io = global.socketIO;
    io.once("connection", socket => {
        // Join in particular room
        let userid;
        socket.on("joinRoom", async ({ user, room }) => {
            // Retrive room and user details from database
            const userDetails = await User.findOne({ username: { $eq: user } })
            const roomDetails = await Room.findById(room);
            const { roomName } = roomDetails;
            const { _id } = userDetails;
            userid = _id;

            const puser = joinUser(_id, user, roomName);

            socket.join(puser.room);

            // Welcome current user
            socket.emit("message", formatMsg("Agile-11", `Welcome to ${puser.room} room`));

            //Broadcast when user joins
            socket.broadcast
                .to(puser.room)
                .emit("message", formatMsg("Agile-11", `${puser.username} joined in the room`));

            // Send users and room info
            io.to(puser.room).emit("roomUsers", {
                room: puser.room,
                users: getRoomUsers(puser.room)
            })

        })
        //Runs when clients disconnect
        socket.on("disconnect", () => {
            const user = userLeft(userid);

            if (user) {
                io.to(user.room)
                    .emit("message", formatMsg("Agile-11", `${user.username} left the room`));

                // Send users and room info
                io.to(user.room).emit("roomUsers", {
                    room: user.room,
                    users: getRoomUsers(user.room)
                })
            }
        })
    });
    res.render("rooms/room", { style: "settings", id: req.params.roomid })
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
