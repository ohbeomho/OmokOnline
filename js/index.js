const roomList = document.querySelector(".room-list");
const refreshButton = document.getElementById("refresh");
const createRoomButton = document.getElementById("create");

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
	roomElement
		.querySelector("button")
		.addEventListener("click", () =>
			location.assign("/game.html?room=" + encodeURIComponent(roomName))
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

			rooms.forEach((r) => createRoomElement(r.name, r.users[0]));
		})
		.catch((err) => alert(err))
		.finally(() => (fetching = false));
}

function createRoom() {
	const roomName = prompt("방 이름을 입력해주세요.").trim();
	if (!roomName) {
		return;
	}

	fetch("/create_room/" + roomName)
		.then(() => location.assign("/game.html?room=" + roomName))
		.catch((err) => alert(err));
}

getRoomList();
refreshButton.addEventListener("click", getRoomList);
createRoomButton.addEventListener("click", createRoom);
