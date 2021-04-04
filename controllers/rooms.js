const User = require("../models/user");
const Room = require("../models/room");
const formatMsg = require("../utils/message");
const { joinUser, getCurrentUser, userLeft, getRoomUsers, getDetails } = require("../utils/users");
const iplSeries = require("../public/seriesdata/ipl");
const ipl = iplSeries();

module.exports.startPlaying = (req, res) => {
    const io = global.socketIO;
    io.once("connection", socket => {
        // Join in particular room
        let userid, rd;
        socket.on("joinRoom", async ({ user, room }) => {
            // Retrive room and user details from database
            const userDetails = await User.findOne({ username: { $eq: user } })
            const roomDetails = await Room.findById(room);
            const { roomName, _id } = roomDetails;
            userid = userDetails._id;
            rd = roomDetails;

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

            // Updates user balance amount
            const index = rd.teams.findIndex(p => p.name === puser.username);
            socket.emit("balance", { balance: rd.teams[index].balanceAmount });

            // Send the teams list to the user
            socket.emit("lop", { currentTeamData: rd.teams })
        })

        // Listen for chat message
        socket.on("chatMessage", mssg => {
            let user = getCurrentUser(userid);

            io.to(user.room).emit("message", formatMsg(user.username, mssg))
        })

        // Core logic for team selection
        socket.on("bet", async ({ money, name }) => {
            let user = getCurrentUser(userid);
            let check;

            // Checks whether the given player name was there in the given list 
            for (let p in ipl) {
                check = ipl[p].filter(obj => obj.name === name)
                if (check.length > 0) break;
            }

            if (check.length === 0) {
                io.to(user.room)
                    .emit("message", formatMsg("Agile-11", `${user.username} your selected player was not there in the list. We recommend you to check the player name in the list or copy and paste that player`))
            } else {

                // Get details of current user  
                let info = getDetails(userid, money, name, rd);

                if (typeof info === 'string') {
                    socket.emit("message", formatMsg("Agile-11", info))
                } else {

                    const { details, lou } = info;
                    // Checks whether any one left with the betting process
                    if (details.length !== lou.length) {

                        const remainingPlayers = lou.filter(user => {
                            return !details.some(u => {
                                return user.username === u.username
                            })
                        })
                        socket.emit("bul", { users: remainingPlayers })

                    } else {
                        // Get the winner in the room
                        const winner = details.reduce((prev, current) => {
                            return (prev.money === current.money) ? prev : (prev.money > current.money) ? prev : current
                        })
                        if (winner.money !== 0) {
                            // Save these winner data in database and assign player to the winner
                            const index = rd.teams.findIndex(p => p.name === winner.username);
                            let cb = rd.teams[index].balanceAmount;

                            // Round the balance to 1 decimal value
                            rd.teams[index].balanceAmount = Math.round((cb - winner.money) * 10) / 10;
                            rd.teams[index].players.push(name);
                            await rd.save();

                            // Updates user balance amount
                            if (user.username === winner.username) {
                                socket.emit("balance", { balance: rd.teams[index].balanceAmount });
                            } else {
                                const index = rd.teams.findIndex(p => p.name === user.username);
                                socket.emit("balance", { balance: rd.teams[index].balanceAmount });
                            }

                            // Updates the teams list for every user in the room
                            io.to(user.room)
                                .emit("lop", { currentTeamData: rd.teams })

                            io.to(user.room)
                                .emit("message", formatMsg("Agile-11", `${winner.username} has won ${name} and kept ${winner.money}Cr/-`))
                        } else {
                            io.to(user.room)
                                .emit("message", formatMsg("Agile-11", `None of your team mates selected ${name} and kept unsold.`))
                        }
                    }
                }
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
    res.render("rooms/room", { style: "room", id: req.params.roomid, ipl });
}
