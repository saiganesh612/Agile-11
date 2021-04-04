const User = require("../models/user");
const Room = require("../models/room");

module.exports.dashboard = async (req, res) => {
    const { _id, username } = req.user;
    const listOfRooms = await Room.find({ $or: [{ players: { $in: [_id] } }, { "admin.username": { $eq: username } }] });
    res.render("userInfo/dashboard", { style: 'dashboard', rooms: listOfRooms.reverse() });
}

module.exports.createRoom = async (req, res) => {
    try {
        const { roomname } = req.body;
        const { _id, username } = req.user;
        let admin = { id: _id, username };
        let ba = { balanceAmount: 100, name: username }
        const user = await User.findOne({ username: { $eq: username } })
        if (!user) {
            req.flash("error", "U don't have permission to create room!!");
            res.redirect("/account/login");
        } else {
            const newRoom = new Room({ roomName: roomname, admin });
            newRoom.teams.push(ba)
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
}

module.exports.enterRoom = async (req, res) => {
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
        let ba = { balanceAmount: 100, name: username }
        user.rooms.unshift(room);
        room.players.unshift(user);
        room.teams.push(ba);
        await user.save();
        await room.save();
        res.redirect(`/room/${room._id}`);
    } catch (e) {
        req.flash("error", e);
        res.redirect("/dashboard");
    }
}
