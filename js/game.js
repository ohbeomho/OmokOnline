const socket = io()
const params = new URLSearchParams(location.search)
const roomName = decodeURIComponent(params.get('room'))
const username = decodeURIComponent(params.get('user'))
const spectate = params.get('spec') === 'true'
const container = document.querySelector('.container')
const message = document.querySelector('.message')
const black = document.querySelector('div.black')
const white = document.querySelector('div.white')
const clickTable = document.querySelector('table.click')
const viewTable = document.querySelector('table.view')
const spectators = document.querySelector('.spectators')
const clickElements = []
let myTurn,
  myElement,
  opponent,
  opponentElement,
  room,
  spectatorCount = 0,
  placed = false

function makeTable() {
  for (let y = 0; y < 14; y++) {
    const row = document.createElement('tr')

    for (let x = 0; x < 14; x++) {
      row.appendChild(document.createElement('td'))
    }

    viewTable.appendChild(row)
  }

  for (let y = 0; y < 15; y++) {
    const tableRow = document.createElement('tr')
    const row = []

    for (let x = 0; x < 15; x++) {
      const column = document.createElement('td')
      if (!spectate)
        column.addEventListener('click', () => {
          if (placed || !opponent) return

          socket.emit('game', x, y)
          placed = true

          message.innerText = '상대의 차례입니다.'
        })

      column.classList.add(myTurn === 0 ? 'black' : 'white')
      if (spectate) column.classList.add('end')

      tableRow.appendChild(column)
      row.push(column)
    }

    clickTable.appendChild(tableRow)
    clickElements.push(row)
  }
}

function setSpectatorCount() {
  spectators.querySelector('.count').innerText = spectatorCount
}

function startGame() {
  message.innerText = ''
  const arr = [black, white]

  if (!spectate) {
    myElement = arr[myTurn]
    opponentElement = myElement === black ? white : black
    myElement.classList.add('me')
  }

  const usernameArr = arr.map((e) => e.querySelector('.username'))
  if (!spectate) {
    if (myTurn === 0) {
      usernameArr[0].innerText = username
      usernameArr[1].innerText = opponent.username
      message.innerText = '당신의 차례입니다.'
    } else {
      usernameArr[1].innerText = username
      usernameArr[0].innerText = opponent.username
      message.innerText = '상대의 차례입니다.'
    }
  } else {
    usernameArr[0].innerText = room.users[0].username
    usernameArr[1].innerText = room.users[1].username
  }

  socket.on('game', (data) => {
    switch (data.type) {
      case 'win':
        const { winner, highlight } = data
        win(winner, highlight)
        break
      case 'place':
        const { x, y, turn } = data
        place(x, y, turn)
        break
      case 'disconnect':
        disconnected(data.user)
        break
      case 'join-spec':
        spectatorCount++
        setSpectatorCount()
        break
      case 'leave-spec':
        spectatorCount--
        setSpectatorCount()
        break
      default:
    }
  })

  makeTable()

  if (spectate) {
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) if (typeof room.board[y][x] === 'number') place(x, y, room.board[y][x])
    }
  }

  document.querySelector('.container').style.display = 'flex'
}

const returnButton = document.createElement('button')
returnButton.innerText = '메인 화면으로'
returnButton.addEventListener('click', () => location.assign('/'))

function win(winner, highlight) {
  removeClickEvents()

  if (winner === undefined) message.innerHTML = '<h3>무승부입니다</h3>'
  else {
    message.innerHTML = `
			<h2>${winner.username}의 승리!</h2>
			<p>당신이 ${
        winner.id === socket.id
          ? "<span style='color: rgb(50, 200, 50)'>승리</span>하였습니다."
          : "<span style='color: rgb(200, 0, 0)'>패배</span>하였습니다."
      }</p>
		`

    if (!spectate) (winner.id === socket.id ? myElement : opponentElement).classList.add('win')
    else [black, white][room.users.indexOf(room.users.find((user) => user.id === winner.id))].classList.add('win')

    const { x: hx, y: hy, type } = highlight
    let highlightElements = []

    switch (type) {
      case 'h':
        highlightElements = clickElements[hy].slice(hx, hx + 5)
        break
      case 'v':
        for (let y = hy; y <= hy + 4; y++) highlightElements.push(clickElements[y][hx])
        break
      case 'd':
        for (let i = 0; i < 5; i++) highlightElements.push(clickElements[hy + i][hx + i])
        break
      case 'rd':
        for (let i = 0; i < 5; i++) highlightElements.push(clickElements[hy + i][hx - i])
      default:
    }

    for (let row of clickElements) {
      row.forEach((e) => {
        e.classList.add('end')

        if (!highlightElements.includes(e) && e.classList.contains('placed')) e.style.opacity = 0.5
      })
    }
  }

  if (!spectate) message.appendChild(returnButton)
  socket.disconnect()
}

function disconnected(user) {
  message.innerHTML = `<h2>${user.username}의 접속이 끊겼습니다.</h2>`
  if (spectate) document.body.prepend(message)
  else message.appendChild(returnButton)
  socket.disconnect()
  removeClickEvents()
}

function removeClickEvents() {
  clickTable.querySelectorAll('tr').forEach((row, y) =>
    row.querySelectorAll('td').forEach((column, x) => {
      const newNode = document.createElement('td')
      newNode.className = column.className
      column.replaceWith(newNode)
      clickElements[y][x] = newNode
    })
  )
}

function place(x, y, turn) {
  if (turn !== myTurn) {
    placed = false
    message.innerText = '당신의 차례입니다.'
  }

  const target = clickElements[y][x]
  const clone = target.cloneNode(true)
  clone.className = ''
  clone.classList.add('placed', turn === 0 ? 'black' : 'white')
  target.replaceWith(clone)
  clickElements[y][x] = clone
}

socket.on('room', (data) => {
  switch (data.type) {
    case 'error':
      alert(data.message)
      location.assign('/')
      break
    case 'success':
      message.innerHTML = '<h2>상대 접속 대기중...</h2>'
      message.appendChild(returnButton)
      break
    case 'start':
      ;({ turn: myTurn, opponent } = data)
      socket.emit('start')
      socket.removeAllListeners('room')
      startGame()
      break
    case 'room-info':
      room = data.room
      startGame()
    default:
  }
})
socket.emit('room', roomName, username, spectate)

if (spectate) {
  message.replaceWith(returnButton)
  spectators.remove()
}

window.addEventListener('resize', () => {})
