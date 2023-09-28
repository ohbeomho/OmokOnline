const socket = io();
const roomName = decodeURIComponent(new URLSearchParams(location.search).get("room"));
const message = document.querySelector(".message");
const black = document.querySelector(".black");
const white = document.querySelector(".white");
let myTurn, opponent;

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
		switch (data.type) {
			case "win":
				win(data.winner);
			case "place":
				const { x, y, turn } = data;
				place(x, y, turn);
			default:
		}
	});
}

function win(winner) {
	if (winner === socket.id) alert("승리!");
	else if (winner === undefined) alert("무승부!");
	else alert("패배..");

	location.assign("/");
}

function place(x, y, turn) {
	// TODO: table 의 x, y 위치에 표시
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
			({ myTurn, opponent } = data);
			startGame();
		default:
	}
});
socket.emit("room", roomName);
