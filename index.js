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
		this.board = [];
		this.turn = 0;

		// 15x15
		for (let i = 0; i < 15; i++) {
			this.board.push(new Array(15));
		}
	}

	place(x, y) {
		this.board[y][x] = this.turn;
		this.turn = this.turn === 1 ? 0 : 1;
		wsServer.to(this.users[this.turn]).emit("place", x, y);
		this.checkWin();
	}

	checkWin() {
		let winner;
		for (let y = 0; y < 15; y++) {
			const line = this.board[y];

			if (line.filter((v) => typeof v === "number").length >= 5) {
				for (let x = 0; x < 10; x++) {
					if (line.slice(x, x + 5).every((v) => v)) {
						winner = users[line[x]];
					}
				}
			}
		}

		// TODO: 세로, 대각선 확인

		if (winner) {
			wsServer.to(this.name).emit("win", winner);
			rooms.splice(rooms.indexOf(this), 1);
		} else if (!winner && !this.board.find((v) => typeof v !== "number")) {
			wsServer.to(this.name).emit("win", -1);
		}
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
				socket.emit("room", { type: "start" });
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
		socket.on("place", room.place);
		socket.on("disconnect", () => {
			socket.emit(
				"win",
				room.users.find((v) => v !== socket.id)
			);
			rooms.splice(rooms.indexOf(this), 1);
		});
	};
});

app.use("/", express.static(path.join(__dirname, "pages")));
app.use("/styles", express.static(path.join(__dirname, "css")));
app.use("/scripts", express.static(path.join(__dirname, "js")));

app.get("/room_list", (req, res) => res.json(rooms));
app.get("/create_room/:roomName", (req, res) => {
	const { roomName } = req.params;
	rooms.push(new Room(roomName));
	res.redirect("/game.html?" + roomName);
});

app.listen(process.env.PORT, () => console.log("Server is running on port " + process.env.PORT));
