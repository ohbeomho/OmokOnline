require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const wsServer = new Server(server);

class Room {
	constructor(name) {
		this.name = name;
		this.users = [];
		this.board = new Array(15);
		this.turn = 0;

		// 15x15
		for (let i = 0; i < 15; i++) this.board[i] = new Array(15).fill(undefined);
	}

	place(x, y, id) {
		if (this.users.indexOf(id) !== this.turn) return;

		this.board[y][x] = this.turn;
		wsServer.to(this.users).emit("game", { type: "place", x, y, turn: this.turn });
		this.turn = this.turn === 1 ? 0 : 1;
		this.checkWin();
	}

	checkWin() {
		const win = (winner) => {
			wsServer.to(this.name).emit("game", { type: "win", winner });
			rooms.splice(rooms.indexOf(this), 1);
		};

		for (let y = 0; y < 15; y++) {
			const line = this.board[y];

			for (let x = 0; x <= 10; x++) {
				const five = line.slice(x, x + 5);
				if (five.every((v) => typeof v === "number" && v === five[0])) win(users[five[0]]);
			}
		}

		for (let x = 0; x < 15; x++) {
			const line = [];
			for (let y = 0; y < 15; y++) line.push(this.board[y][x]);
			for (let y = 0; y <= 10; y++) {
				const five = line.slice(y, y + 5);
				if (five.every((v) => typeof v === "number" && v === five[0])) win(users[five[0]]);
			}
		}

		for (let y = 0; y <= 10; y++) {
			for (let x = 0; x <= 10; x++) {
				const five = [];
				for (let i = 0; i < 5; i++) five.push(this.board[y + i][x + i]);
				if (five.every((v) => typeof v === "number" && v === five[0])) win(users[five[0]]);
			}
		}

		if (!this.board.find((v) => typeof v !== "number")) win(undefined);
	}
}

const rooms = [];

wsServer.on("connection", (socket) => {
	let room;

	socket.once("room", (roomName) => {
		const targetRoom = rooms.find((r) => r.name === roomName);
		if (!targetRoom) {
			socket.emit("room", {
				type: "error",
				message: "참가하려는 방은 존재하지 않는 방입니다."
			});
		} else if (targetRoom.users.length === 2) {
			socket.emit("room", {
				type: "error",
				message: "참가하려는 방은 이미 게임이 진행중입니다."
			});
		} else {
			room = targetRoom;
			room.users.push(socket.id);
			socket.join(roomName);

			if (room.users.length === 2) {
				room.users.forEach((u, i) =>
					wsServer
						.to(u)
						.emit("room", {
							type: "start",
							turn: i,
							opponent: room.users[i === 0 ? 1 : 0]
						})
				);
			} else {
				socket.emit("room", { type: "success" });
			}

			return;
		}

		socket.disconnect();
	});
	socket.on("start", () => {
		if (!room || room.users.length < 2) {
			return;
		}

		startGame();
		socket.removeAllListeners("start");
	});

	const startGame = () => {
		socket.on("game", (x, y) => room.place(x, y, socket.id));
		socket.on("disconnect", () => {
			socket.emit("game", {
				type: "win",
				winner: room.users.find((v) => v !== socket.id)
			});
			rooms.splice(rooms.indexOf(this), 1);
		});
	};
});

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

app.listen(process.env.PORT, () => console.log("Server is running on port " + process.env.PORT));
