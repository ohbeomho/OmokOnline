import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { config } from "dotenv";

config();

const app = express();
const server = http.createServer(app);
const wsServer = new Server(server);

class Room {
	constructor(name) {
		this.name = name;
		this.users = [];
		this.turn = 0;
	}

	place(x, y) {
		// TODO: Place

		this.checkWin();
	}

	checkWin() {
		// TODO: Check

		// If someone wins
		let winner = "Change Here!!";
		wsServer.to(this.name).emit("win", winner);
		rooms.splice(rooms.indexOf(this), 1);
	}
}

const rooms = [];

wsServer.on("connection", (socket) => {
	let room;

	socket.once("room", (roomName) => {
		const targetRoom = rooms.find((r) => r.name === roomName);
		if (!targetRoom) {
			socket.disconnect();
			return;
		}

		room = targetRoom;
		room.users.push(this.socket.id);
		socket.join(roomName);
	});
	socket.on("place", (x, y) => {});
});

app.use("/", express.static(path.join(__dirname, "pages")));
app.use("/styles", express.static(path.join(__dirname, "styles")));

app.get("/room_list", (req, res) => res.json(rooms));
app.get("/create_room/:roomName", (req, res) => {
	const { roomName } = req.params;
	rooms.push(new Room(roomName));
	res.redirect("/game.html?" + roomName);
});

app.listen(process.env.PORT, () => console.log("Server is running on port " + process.env.PORT));
