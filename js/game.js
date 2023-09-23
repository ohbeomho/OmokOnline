const socket = io();
const roomName = decodeURIComponent(new URLSearchParams(location.search).get("room"));

socket.on("room", (data) => {
	// TODO: Make it
});
socket.emit("room", roomName);
