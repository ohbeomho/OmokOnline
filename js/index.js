const roomList = document.querySelector(".room-list");
const refreshButton = document.getElementById("refresh");
const createRoomButton = document.getElementById("create");
const createRoomDialog = document.getElementById("createRoom");
const joinRoomDialog = document.getElementById("joinRoom");
const roomNameInput = document.getElementById("roomName");
const createUsernameInput = document.getElementById("createUsername");
const joinUsernameInput = document.getElementById("joinUsername");

let joinRoomName;

function createRoomElement(roomName, user) {
	const roomElement = document.createElement("div");
	roomElement.classList.add("room");
	roomElement.innerHTML = `
		<div class="name">${roomName}</div>
		<div class="user">
			<img class="profile" src="/assets/user.png" />
			${user}
		</div>
		<div class="buttons">
			<button class="join">참가</button>
		</div>
	`;
	roomElement.querySelector("button").addEventListener("click", () => {
		joinRoomName = roomName;
		joinRoomDialog.showModal();
	});
	roomList.appendChild(roomElement);
}

let fetching = false;

function getRoomList() {
	if (fetching) {
		return;
	}

	fetching = true;
	roomList.innerHTML = "";

	fetch("/room_list")
		.then((res) => res.json())
		.then((rooms) => {
			if (!rooms.length) {
				roomList.innerHTML = "<div>참가 가능한 방이 없습니다.</div>";
				return;
			}

			rooms.forEach((r) => createRoomElement(r.name, r.users[0].username));
		})
		.catch((err) => alert(err))
		.finally(() => (fetching = false));
}

function mobileMessage() {
	document.body.innerHTML = `
		<h1>모바일 기기는 지원하지 않습니다.</h1>
	`;
}

getRoomList();

refreshButton.addEventListener("click", getRoomList);
createRoomButton.addEventListener("click", () => createRoomDialog.showModal());

const closeButtons = document.querySelectorAll("button.close");
closeButtons.forEach((button) =>
	button.addEventListener("click", () => button.parentElement.close())
);

createRoomDialog.addEventListener("close", (e) => {
	const roomName = roomNameInput.value.trim();
	const username = createUsernameInput.value.trim();

	let errorMessage;

	if (!roomName) errorMessage = "방 이름을 입력해 주세요.";
	else if (!username) errorMessage = "사용자명을 입력해 주세요.";

	if (errorMessage) {
		e.preventDefault();
		alert(errorMessage);
		return;
	}

	fetch("/create_room/" + roomName)
		.then(() =>
			location.assign(
				`/game.html?room=${encodeURIComponent(roomName)}&user=${encodeURIComponent(
					username
				)}`
			)
		)
		.catch((err) => alert(err));
});

joinRoomDialog.addEventListener("close", (e) => {
	const username = joinUsernameInput.value.trim();

	if (!username) {
		e.preventDefault();
		alert("사용자명을 입력해 주세요.");
		return;
	} else if (!joinRoomName) return;

	location.assign(
		`/game.html?room=${encodeURIComponent(joinRoomName)}&user=${encodeURIComponent(username)}`
	);
});
