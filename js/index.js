const roomList = document.querySelector(".room-list");
const refreshButton = document.getElementById("refresh");
const createRoomButton = document.getElementById("create");
const createRoomDialog = document.getElementById("createRoom");
const joinRoomDialog = document.getElementById("joinRoom");
const roomNameInput = document.getElementById("roomName");
const createUsernameInput = document.getElementById("createUsername");
const joinUsernameInput = document.getElementById("joinUsername");

let joinRoomName;

function isTouchDevice() {
  return "ontouchstart" in window;
}

function createRoomElement(roomName, users) {
  const isFull = users.length === 2;

  const roomElement = document.createElement("div");
  roomElement.classList.add("room");
  roomElement.innerHTML = `
		<div class="name">
			<span>${roomName}</span>
			${isFull ? "<span class='playing'>게임 진행 중</span>" : ""}
		</div>
		<div class="user">
			${users.map((user) => `<span><img class="profile" src="/assets/user.png" />${user}</span>`).join("")}
		</div>
    ${
      !isTouchDevice()
        ? `
        <div class="buttons">
          <button class="${isFull ? "spectate" : "join"}">${isFull ? "관전" : "참가"}</button>
        </div>
      `
        : ""
    }
	`;

  if (!isTouchDevice()) {
    const button = roomElement.querySelector("button");
    button.addEventListener("click", () => {
      if (button.classList.contains("join")) {
        joinRoomName = roomName;
        joinRoomDialog.showModal();
      } else location.assign(`/game.html?room=${encodeURIComponent(roomName)}&user=SPECTATOR&spec=true`);
    });
  } else {
    roomElement.addEventListener("click", () => {
      if (isFull && confirm("관전하시겠습니까?"))
        location.assign(`/game.html?room=${encodeURIComponent(roomName)}&user=SPECTATOR&spec=true`);
      else if (!isFull && confirm("참여하시겠습니까?")) {
        joinRoomName = roomName;
        joinRoomDialog.showModal();
      }
    });
  }

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

      rooms
        .sort((a, b) => {
          const u = a.users.length - b.users.length;
          const n = a.name.localeCompare(b.name);

          if (u === 0) return n;
          return u;
        })
        .forEach((r) =>
          createRoomElement(
            r.name,
            r.users.map((user) => user.username)
          )
        );
    })
    .catch((err) => alert(err))
    .finally(() => (fetching = false));
}

getRoomList();

refreshButton.addEventListener("click", getRoomList);
createRoomButton.addEventListener("click", () => createRoomDialog.showModal());

const closeButtons = document.querySelectorAll("button.close");
closeButtons.forEach((button) => button.addEventListener("click", () => button.parentElement.parentElement.close()));

createRoomDialog.querySelector("button.ok").addEventListener("click", (e) => {
  const roomName = roomNameInput.value.trim();
  const username = createUsernameInput.value.trim();

  let errorMessage;

  if (!roomName) errorMessage = "방 이름을 입력해 주세요.";
  else if (!username) errorMessage = "사용자명을 입력해 주세요.";
  else if (username.length > 15) errorMessage = "사용자명은 15자보다 짧아야 합니다.";

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

      location.assign(`/game.html?room=${encodeURIComponent(roomName)}&user=${encodeURIComponent(username)}`);
    })
    .catch((err) => alert(err))
    .finally(() => createRoomDialog.close());
});

joinRoomDialog.querySelector("button.ok").addEventListener("click", (e) => {
  const username = joinUsernameInput.value.trim();

  if (!joinRoomName) {
    joinRoomDialog.close();
    return;
  }

  let errorMessage;
  if (!username) errorMessage = "사용자명을 입력해 주세요.";
  else if (username.length > 15) errorMessage = "사용자명은 15자보다 짧아야 합니다.";

  if (errorMessage) {
    alert(errorMessage);
    return;
  }

  location.assign(`/game.html?room=${encodeURIComponent(joinRoomName)}&user=${encodeURIComponent(username)}`);
});
