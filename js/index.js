const roomList = document.querySelector(".room-list");
const refreshButton = document.getElementById("refresh");
const createRoomButton = document.getElementById("create");
const createRoomDialog = document.getElementById("createRoom");
const joinRoomDialog = document.getElementById("joinRoom");
const roomNameInput = document.getElementById("roomName");
const createUsernameInput = document.getElementById("createUsername");
const joinUsernameInput = document.getElementById("joinUsername");

let joinRoomName;

function createRoomElement(roomName, user, isFull) {
	const roomElement = document.createElement("div");
	roomElement.classList.add("room");
	roomElement.innerHTML = `
		<div class="name">${roomName}</div>
		<div class="user">
			<img class="profile" src="/assets/user.png" />
			${user}
		</div>
		<div class="buttons">
			<button class="${isFull ? "spectate" : "join"}">${isFull ? "관전" : "참가"}</button>
		</div>
	`;
	roomElement.querySelector("button.join")?.addEventListener("click", () => {
		joinRoomName = roomName;
		joinRoomDialog.showModal();
	});
	roomElement
		.querySelector("button.spectate")
		?.addEventListener("click", () =>
			location.assign(
				`/game.html?room=${encodeURIComponent(roomName)}&user=SPECTATOR&spec=true`
			)
		);
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

			rooms.forEach((r) =>
				createRoomElement(r.name, r.users[0].username, r.users.length === 2)
			);
		})
		.catch((err) => alert(err))
		.finally(() => (fetching = false));
}

getRoomList();

refreshButton.addEventListener("click", getRoomList);
createRoomButton.addEventListener("click", () => createRoomDialog.showModal());

const closeButtons = document.querySelectorAll("button.close");
closeButtons.forEach((button) =>
	button.addEventListener("click", () => button.parentElement.parentElement.close())
);

createRoomDialog.querySelector("button.ok").addEventListener("click", (e) => {
	const roomName = roomNameInput.value.trim();
	const username = createUsernameInput.value.trim();

	let errorMessage;

	if (!roomName) errorMessage = "방 이름을 입력해 주세요.";
	else if (!username) errorMessage = "사용자명을 입력해 주세요.";

	if (errorMessage) {
		alert(errorMessage);
		return;
	}

	fetch("/create_room/" + roomName)
		.then((res) => {
			if (res.status === 409) {
				alert(`이름이 ${roomName}인 방이 이미 존재합니다.`);
				return;
			}

			location.assign(
				`/game.html?room=${encodeURIComponent(roomName)}&user=${encodeURIComponent(
					username
				)}`
			);
		})
		.catch((err) => alert(err))
		.finally(() => createRoomDialog.close());
});

joinRoomDialog.querySelector("button.ok").addEventListener("click", (e) => {
	const username = joinUsernameInput.value.trim();

	if (!username) {
		alert("사용자명을 입력해 주세요.");
		return;
	} else if (!joinRoomName) {
		joinRoomDialog.close();
		return;
	}

	location.assign(
		`/game.html?room=${encodeURIComponent(joinRoomName)}&user=${encodeURIComponent(username)}`
	);
});
