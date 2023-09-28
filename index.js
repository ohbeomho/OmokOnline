require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

class Room {
	constructor(name) {
		this.name = name;
		this.users = [];
		this.board = new Array(15);
		this.turn = 0;

		// 15x15
		for (let i = 0; i < 15; i++) this.board[i] = new Array(15).fill(undefined);
	}

	place(x, y, user) {
		if (this.users.indexOf(user) !== this.turn || x > 14 || y > 14 || x < 0 || y < 0) return;

		this.board[y][x] = this.turn;
		io.to(this.users.map((user) => user.id)).emit("game", {
			type: "place",
			x,
			y,
			turn: this.turn
		});
		this.turn = this.turn === 1 ? 0 : 1;
		this.checkWin();
	}

	checkWin() {
		const win = (winner, highlight) => {
			io.to(this.name).emit("game", { type: "win", winner, highlight });
			rooms.splice(rooms.indexOf(this), 1);
		};

		for (let y = 0; y < 15; y++) {
			const line = this.board[y];

			for (let x = 0; x <= 10; x++) {
				const five = line.slice(x, x + 5);
				if (five.every((v) => typeof v === "number" && v === five[0]))
					win(this.users[five[0]], { type: "h", x, y });
			}
		}

		for (let x = 0; x < 15; x++) {
			const line = [];
			for (let y = 0; y < 15; y++) line.push(this.board[y][x]);
			for (let y = 0; y <= 10; y++) {
				const five = line.slice(y, y + 5);
				if (five.every((v) => typeof v === "number" && v === five[0]))
					win(this.users[five[0]], { type: "v", x, y });
			}
		}

		for (let y = 0; y <= 10; y++) {
			for (let x = 0; x <= 10; x++) {
				const five = [];
				for (let i = 0; i < 5; i++) five.push(this.board[y + i][x + i]);
				if (five.every((v) => typeof v === "number" && v === five[0]))
					win(this.users[five[0]], { type: "d", x, y });
			}
		}

		if (!this.board.find((v) => typeof v !== "number")) win(undefined, undefined);
	}
}

const rooms = [];

app.use("/", express.static(path.join(__dirname, "pages")));
app.use("/styles", express.static(path.join(__dirname, "css")));
app.use("/scripts", express.static(path.join(__dirname, "js")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/room_list", (req, res) => res.json(rooms.filter((r) => r.users.length < 2)));
app.get("/create_room/:roomName", (req, res) => {
	const { roomName } = req.params;
	rooms.push(new Room(roomName));
	res.sendStatus(200);
});

io.on("connection", (socket) => {
	let room, user;

	socket.once("room", (roomName, username) => {
		const targetRoom = rooms.find((r) => r.name === roomName);
		if (!targetRoom)
			socket.emit("room", {
				type: "error",
				message: "참가하려는 방은 존재하지 않는 방입니다."
			});
		else if (targetRoom.users.length === 2)
			socket.emit("room", {
				type: "error",
				message: "참가하려는 방은 이미 게임이 진행중입니다."
			});
		else {
			room = targetRoom;
			user = { id: socket.id, username };
			room.users.push(user);
			socket.join(roomName);

			if (room.users.length === 2)
				room.users.forEach((u, i) =>
					io.to(u.id).emit("room", {
						type: "start",
						turn: i,
						opponent: room.users[i === 0 ? 1 : 0]
					})
				);
			else socket.emit("room", { type: "success" });

			return;
		}

		socket.disconnect();
	});
	socket.on("start", () => {
		if (!room || room.users.length < 2) return;

		startGame();
		socket.removeAllListeners("start");
	});

	const startGame = () => socket.on("game", (x, y) => room.place(x, y, user));

	socket.on("disconnect", () => {
		if (room && room.users.length > 1) {
			const other = room.users.find((v) => v.id !== socket.id);
			socket.to(other.id).emit("game", { type: "disconnect" });
		}
		rooms.splice(rooms.indexOf(this), 1);
	});
});

server.listen(Number(process.env.PORT), () =>
	console.log("Server is running on port " + process.env.PORT)
);
