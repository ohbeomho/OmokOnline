const socket = io();
const roomName = decodeURIComponent(new URLSearchParams(location.search).get("room"));
const message = document.querySelector(".message");
const black = document.querySelector("div.black");
const white = document.querySelector("div.white");
const clickTable = document.querySelector("table.click");
const viewTable = document.querySelector("table.view");
let myTurn,
	opponent,
	placed = false;

function makeTable() {
	for (let y = 0; y < 14; y++) {
		const row = document.createElement("tr");

		for (let x = 0; x < 14; x++) {
			row.appendChild(document.createElement("td"));
		}

		viewTable.appendChild(row);
	}

	for (let y = 0; y < 15; y++) {
		const row = document.createElement("tr");

		for (let x = 0; x < 15; x++) {
			const column = document.createElement("td");
			column.addEventListener("click", () => {
				if (placed || !opponent) return;

				socket.emit("game", x, y);
				placed = true;
			});
			column.classList.add(myTurn === 0 ? "black" : "white");
			row.appendChild(column);
		}

		clickTable.appendChild(row);
	}
}

function startGame() {
	message.innerText = "";
	const arr = [black, white];
	arr[myTurn].classList.add("me");

	const idArr = arr.map((e) => e.querySelector(".id"));
	if (myTurn === 0) {
		idArr[0].innerText = socket.id;
		idArr[1].innerText = opponent;
	} else {
		idArr[1].innerText = socket.id;
		idArr[0].innerText = opponent;
	}

	socket.on("game", (data) => {
		console.log(data);

		switch (data.type) {
			case "win":
				win(data.winner);
				break;
			case "place":
				const { x, y, turn } = data;
				place(x, y, turn);
			default:
		}
	});

	makeTable();
	document.querySelector(".container").style.display = "flex";
}

function win(winner) {
	if (winner === socket.id) alert("승리!");
	else if (winner === undefined) alert("무승부!");
	else alert("패배..");

	location.assign("/");
}

function place(x, y, turn) {
	if (turn !== myTurn) placed = false;

	const target = Array.from(
		Array.from(clickTable.querySelectorAll("tr"))[y].querySelectorAll("td")
	)[x];
	const clone = target.cloneNode(true);
	clone.className = "";
	clone.classList.add("placed", turn === 0 ? "black" : "white");
	target.replaceWith(clone);
}

socket.on("room", (data) => {
	switch (data.type) {
		case "error":
			alert(data.message);
			location.assign("/");
			break;
		case "success":
			message.innerText = "상대 접속 대기중...";
			break;
		case "start":
			({ turn: myTurn, opponent } = data);
			socket.emit("start");
			socket.removeAllListeners("room");
			startGame();
		default:
	}
});
socket.emit("room", roomName);
