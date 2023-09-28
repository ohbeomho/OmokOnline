const socket = io();
const params = new URLSearchParams(location.search);
const roomName = decodeURIComponent(params.get("room"));
const username = decodeURIComponent(params.get("user"));
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

				message.innerText = "상대의 차례입니다.";
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

	const usernameArr = arr.map((e) => e.querySelector(".username"));
	if (myTurn === 0) {
		usernameArr[0].innerText = username;
		usernameArr[1].innerText = opponent.username;
		message.innerText = "당신의 차례입니다.";
	} else {
		usernameArr[1].innerText = username;
		usernameArr[0].innerText = opponent.username;
		message.innerText = "상대의 차례입니다.";
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
	const returnButton = document.createElement("button");
	returnButton.innerText = "메인 화면으로";
	returnButton.addEventListener("click", () => location.assign("/"));

	if (winner === undefined) message.innerHTML = "<h3>무승부입니다</h3>";
	else {
		message.innerHTML = `
			<h2>${winner.username}의 승리!</h2>
			<p>당신이 ${
				winner.id === socket.id
					? "<span style='color: rgb(50, 200, 50)'>승리</span>하였습니다."
					: "<span style='color: rgb(200, 0, 0)'>패배</span>하였습니다."
			}</p>
		`;
	}

	message.appendChild(returnButton);
}

function place(x, y, turn) {
	if (turn !== myTurn) {
		placed = false;
		message.innerText = "당신의 차례입니다.";
	}

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
			message.innerHTML = "<h2>상대 접속 대기중...</h2>";
			break;
		case "start":
			({ turn: myTurn, opponent } = data);
			socket.emit("start");
			socket.removeAllListeners("room");
			startGame();
		default:
	}
});
socket.emit("room", roomName, username);
