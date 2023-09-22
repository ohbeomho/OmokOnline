const roomList = document.querySelector(".room-list");
const refreshButton = document.getElementById("refresh");

function createRoomElement(roomName, user) {
	const roomElement = document.createElement("div");
	roomElement.classList.add("room");
	roomElement.innerHTML = `
		<div class="name">${roomName}</div>
		<div class="user">
			<img class="profile" src="/assets/user.png" />
			${user}
		</div>
	`;
	roomElement.addEventListener("click", () => {
		// TODO: confirm join
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

			rooms.forEach((r) => createRoomElement(r.name, r.users[0]));
		})
		.catch((err) => alert(err))
		.finally(() => (fetching = false));
}

getRoomList();
refreshButton.addEventListener("click", getRoomList);
