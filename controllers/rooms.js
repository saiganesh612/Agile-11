const User = require("../models/user");
const Room = require("../models/room");
const formatMsg = require("../utils/message");
const { joinUser, getCurrentUser, userLeft, getRoomUsers, getDetails } = require("../utils/users");
const iplSeries = require("../public/seriesdata/ipl");
const cric = require("../apis/cric");
const ipl = iplSeries();

module.exports.startPlaying = async (req, res) => {
    const io = global.socketIO;
    const roomData = await Room.findById(req.params.roomid);
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

            // Get overall points of a paticular player
            const op = rd.teams.map(team => {
                let score = 0
                team.points.forEach(m => score += m.fantasyPoints)
                return { name: team.name, score }
            })

            // emit points to client
            socket.emit("scores", { op })
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
                            rd.teams[index].players.push({ playerName: name, apiName: check[0].Aname });
                            await rd.save();

                            // Updates user balance amount
                            if (user.username === winner.username) {
                                socket.emit("balance", { balance: rd.teams[index].balanceAmount });
                            } else {
                                const index = rd.teams.findIndex(p => p.name === user.username);
                                socket.emit("balance", { balance: rd.teams[index].balanceAmount });
                            }

                            // Emits transaction history on particular player
                            io.to(user.room)
                                .emit("transaction", { tdetails: details, name, winner })

                            // Updates the teams list for every user in the room
                            io.to(user.room)
                                .emit("lop", { currentTeamData: rd.teams })

                            io.to(user.room)
                                .emit("message", formatMsg("Agile-11", `${winner.username} has won ${name} and kept ${winner.money}Cr/-`))
                        } else {

                            // Emits transaction history on particular player
                            io.to(user.room)
                                .emit("transaction", { tdetails: details, name, winner })

                            io.to(user.room)
                                .emit("message", formatMsg("Agile-11", `None of your team mates selected ${name} and kept unsold.`))
                        }
                    }
                }
            }
        })

        // Logic to start game
        socket.on("gameStarted", async () => {
            try {
                const matches = await cric.newMatches();

                if (!matches) throw "Problem occured in api"

                const matchSummary = matches.map(async match => {
                    const summary = await cric.fantasySummary(match.unique_id);
                    return summary
                })
                const data = await Promise.all(matchSummary);
                console.log("Signal received");
                // Receive current match points
                const listOfPoints = cric.computeData(data);
                // Returns the union of the given point sets
                const newSetOfPoints = listOfPoints.map(point => {
                    return { id: point.id, data: [...point.points.fieldingPoints, ...point.points.bowlingPoints, ...point.points.battingPoints] }
                })

                newSetOfPoints.forEach(matchPoints => {
                    const { id, data } = matchPoints

                    // Get the intersection players between current match dataset and team players dataset
                    const teamPoints = rd.teams.map(team => {
                        let intersection = data.filter(player => {
                            let pname = player.name.replace('(c)', '').trim();
                            return team.players.some(p => pname === p.playerName || pname === p.apiName)
                        })
                        const name = team.name
                        const points = intersection
                        return { name, points }
                    })

                    // Get the calculated points in real time
                    teamPoints.forEach(team => {
                        score = team.points.reduce((pre, curr) => pre + curr.points, 0)

                        const i = rd.teams.findIndex(p => p.name === team.name)
                        const player = rd.teams[i]
                        const index = player.points.findIndex(match => match.matchId === id)
                        if (index === -1) {
                            const newMatch = { matchId: id, fantasyPoints: score }
                            rd.teams[i].points.push(newMatch)
                        } else rd.teams[i].points[index].fantasyPoints = score
                    })
                })
                await rd.save()
                console.log("Saved successfully");

                // Get overall points of a paticular player
                const op = rd.teams.map(team => {
                    let score = 0
                    team.points.forEach(m => score += m.fantasyPoints)
                    return { name: team.name, score }
                })

                // emit points to client
                socket.emit("scores", { op })
            } catch (err) {
                console.log("error", err);
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
    res.render("rooms/room", { style: "room", id: req.params.roomid, ipl, admin: roomData.admin });
}
