const surrenderModal = document.getElementById('surrenderConfirmModal');
const drawOfferModal = document.getElementById('drawOfferModal');
const drawAcceptOfferModal = document.getElementById('drawAcceptOfferModal');
const surrenderBtn = document.getElementById('surrender-btn');
const confirmSurrenderBtn = document.getElementById('confirm-surrender');
const cancelSurrenderBtn = document.getElementById('cancel-surrender');
const drawOfferBtn = document.getElementById('draw-offer-btn');
const acceptDrawBtn = document.getElementById('accept-draw');
const declineDrawBtn = document.getElementById('decline-draw');
const acceptDrawBtn2 = document.getElementById('accept-draw2');
const declineDrawBtn2 = document.getElementById('decline-draw2');
const waitingModal = document.getElementById('waitingForPlayerModal');
const drawModal = document.getElementById('drawModal');
const winResignModal = document.getElementById('winResignModal');
const loseResignModal = document.getElementById('loseResignModal');

// function displayStatus(message) {
//     const statusElement = document.getElementById('status');
//     statusElement.innerHTML += `<p>${message}</p>`; 
// }

surrenderBtn.addEventListener('click', function () {
    // displayStatus('Surrender button clicked');
    surrenderModal.classList.remove('hidden');

});

drawOfferBtn.addEventListener('click', function () {
    // displayStatus('Draw offer button clicked');
    drawOfferModal.classList.remove('hidden');
});

confirmSurrenderBtn.addEventListener('click', function() {
    // displayStatus('Surrender confirmed');
    sendCommand(`resign ${matchId}`);
    surrenderModal.classList.add('hidden');
});

cancelSurrenderBtn.addEventListener('click', function() {
    // displayStatus('Surrender canceled');
    surrenderModal.classList.add('hidden');
});

acceptDrawBtn.addEventListener('click', function() {
    // displayStatus('Draw offered');
    sendCommand(`draw ${matchId}`);
    drawOfferModal.classList.add('hidden');
});

declineDrawBtn.addEventListener('click', function() {
    // displayStatus('Draw canceled');
    drawOfferModal.classList.add('hidden');
});

acceptDrawBtn2.addEventListener('click', function() {
    // displayStatus('Draw accepted');
    sendCommand(`draw-accepted ${matchId}`);
    drawAcceptOfferModal.classList.add('hidden');
});

declineDrawBtn2.addEventListener('click', function() {
    // displayStatus('Draw killed');
    drawAcceptOfferModal.classList.add('hidden');
});

function updateCapturedPieces(capturedPieces) {
    const capturedWhiteContainer = document.getElementById('captured-white-pieces');
    const capturedBlackContainer = document.getElementById('captured-black-pieces');

    capturedWhiteContainer.innerHTML = '';
    capturedBlackContainer.innerHTML = '';

    capturedPieces.split('').forEach(piece => {
        const color = piece === piece.toLowerCase() ? 'black' : 'white';

        const img = document.createElement('img');
        img.src = `reqs/${color}_${piece.toLowerCase()}.svg`;
        img.classList.add('captured-piece');

        if (color === 'white') {
            capturedWhiteContainer.appendChild(img);
        } else {
            capturedBlackContainer.appendChild(img);
        }
    });
}

let commandQueue = [];

function createWebSocket() {
    let socket = new WebSocket('wss://chess.k6z.ru:8181');

    socket.onopen = function () {
        // displayStatus('Соединение установлено');
        while (commandQueue.length > 0) {
            let command = commandQueue.shift();
            socket.send(command);
        }
    };

    socket.onerror = function (error) {
        // displayStatus(`Ошибка WebSocket: ${matchId}`);
    };

    socket.onclose = function (event) {
        // displayStatus('WebSocket закрыт. Повторная попытка подключения через 1 секунду...');
        setTimeout(() => {
            socket = createWebSocket();
        }, 1000);
    };

    socket.onmessage = function (event) {
        const data = event.data;

        if (data.includes("FEN:")) {
            const parts = data.slice(4).split(":");
            const newFEN = parts[0];
            const playerColor = parts[1];
            const capturedPieces = parts[2];
            createChessboardFromFEN(newFEN, playerColor);
            updateCapturedPieces(capturedPieces); 
            switchTurn(); 
        } else if (data.includes("LOGS:")) {
            const logs = data.slice(5);
            logsField.innerHTML = logs.replace(/\n/g, '<br>');
        } else if (data.includes("DRAW-OFFER")) {
            drawAcceptOfferModal.classList.remove('hidden');
        } else if (data.includes("RESIGN")) {
            parts = data.split(':');
            const result = parts[1];
            if (result === "W"){
                winResignModal.classList.remove('hidden');
                document.getElementById('surrender-btn').classList.add('disabled');
                document.getElementById('draw-offer-btn').classList.add('disabled');
            } else {
                loseResignModal.classList.remove('hidden');
                document.getElementById('surrender-btn').classList.add('disabled');
                document.getElementById('draw-offer-btn').classList.add('disabled');
            }
        } else if (data.includes("DRAW-ACCEPTED")) {
            drawModal.classList.remove('hidden');
            document.getElementById('surrender-btn').classList.add('disabled');
            document.getElementById('draw-offer-btn').classList.add('disabled');
        } else if (data.includes("GAMESTARTED")) {
            var parts = data.split(':');
            waitingModal.classList.add('hidden');
            const nick = parts[1];
            const fen = parts[2];
            const color = parts[3];
            createChessboardFromFEN(fen,color);

            // displayStatus(`получил ник ${nick}`);
            const playerInfoUsername = document.querySelector('#opponent-info .username');
            playerInfoUsername.textContent = '@' + nick;
            const playerInfoImage = document.querySelector('#opponent-info .user-image');
            playerInfoImage.src = `https://t.me/i/userpic/320/${nick}.jpg`;
            playerInfoImage.onerror = function () {
                playerInfoImage.src = 'reqs/ava.jpg';
            };
        }
    };

    return socket;
}

let socket = createWebSocket();

function sendCommand(command) {
    // displayStatus(`Попытка отправить команду: ${command}`);
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(command);
        // displayStatus(`Команда отправлена: ${command}`);
    } else {
        // displayStatus('WebSocket не открыт. Команда добавлена в очередь.');
        commandQueue.push(command);
    }
}

const chessboard = document.getElementById('chessboard');
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranksWhite = [8, 7, 6, 5, 4, 3, 2, 1];
const ranksBlack = [1, 2, 3, 4, 5, 6, 7, 8];
let selectedSquare = null;
let highlightedSquare = null; 

let whiteTime = 600; 
let blackTime = 600; 
let isWhiteTurn = true;
let timerInterval = null;

function startTimer() {
    if (timerInterval) return;

    timerInterval = setInterval(() => {
        if (isWhiteTurn) {
            whiteTime--;
            updateTimerDisplay('white', whiteTime);
        } else {
            blackTime--;
            updateTimerDisplay('black', blackTime);
        }

        if (whiteTime <= 0 || blackTime <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            alert('Время вышло!');
        }
    }, 1000);
}

function switchTurn() {
    isWhiteTurn = !isWhiteTurn;
    if (!timerInterval) startTimer(); 
}

function updateTimerDisplay(player, time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    document.querySelector(`.${player}-time`).textContent = timeString;
}

function createChessboardFromFEN(fen, playerColor) {

    chessboard.innerHTML = ''; 
    const ranks = playerColor === 'w' ? ranksWhite : ranksBlack;
    const files = playerColor === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
    let position = fen.split(' ')[0];
    let rows = position.split('/');

    for (let i = 0; i < 64; i++) {
        const square = document.createElement('div');
        square.classList.add('square');
        chessboard.appendChild(square);

        const row = Math.floor(i / 8);
        const col = i % 8;

        if ((row + col) % 2 === 0) {
            square.classList.add('light');
        } else {
            square.classList.add('dark');
        }

        if (col === 0) {
            const rankLabel = document.createElement('span');
            rankLabel.textContent = ranks[row];
            rankLabel.classList.add('rank-label');
            square.appendChild(rankLabel);
        }

        if (row === 7) {
            const fileLabel = document.createElement('span');
            fileLabel.textContent = files[col];
            fileLabel.classList.add('file-label');
            square.appendChild(fileLabel);
        }

        addPieceFromFEN(square, row, col, rows);
        square.addEventListener('click', () => handleSquareClick(row, col, files, ranks, playerColor));
    }
}

function addPieceFromFEN(square, row, col, rows) {
    const fenRow = rows[row];
    let colIndex = 0;

    for (let char of fenRow) {
        if (!isNaN(char)) {
            colIndex += parseInt(char); 
        } else {
            const color = char === char.toUpperCase() ? 'white' : 'black';
            const piece = char.toLowerCase();
            if (colIndex === col) {
                const img = document.createElement('img');
                img.src = `reqs/${color}_${piece}.svg`; 
                img.classList.add('chess-piece');
                square.appendChild(img);
            }
            colIndex++;
        }
    }
}

function handleSquareClick(row, col, files, ranks, playerColor) {
    const clickedSquare = files[col] + ranks[row]; 

    if (highlightedSquare) {
        if (highlightedSquare.classList.contains('light')) {
            highlightedSquare.style.backgroundColor = '#efe6d5';
        } else if (highlightedSquare.classList.contains('dark')) {
            highlightedSquare.style.backgroundColor = 'rgba(60, 111, 111, 0.8)';
        }
        highlightedSquare.classList.remove('highlight');
    }
    
    const square = chessboard.querySelector(`.square:nth-child(${(row * 8) + col + 1})`);

    if (selectedSquare === null) {
        selectedSquare = clickedSquare;
        highlightedSquare = square;

        if (square.classList.contains('light')) {
            square.style.backgroundColor = '#d4c7b4';
        } else if (square.classList.contains('dark')) {
            square.style.backgroundColor = 'rgba(100, 151, 151, 1)';
        }

        square.classList.add('highlight');
        console.log('Selected square: ' + selectedSquare);
    } else {
        let move = `${selectedSquare}${clickedSquare}`; 
        console.log('Move: ' + move);

        sendCommand(`${matchId}:${move}`);

        selectedSquare = null;
        highlightedSquare = null;
    }
}

// const gameIdField = document.getElementById('gameId_field');
// const commandInput = document.getElementById('commandInput');
// const sendCommandButton = document.getElementById('sendCommand');
// const logsField = document.getElementById('server_logs_field');

// sendCommandButton.addEventListener('click', () => {
//     const command = commandInput.value;
//     if (command) {
//         sendCommand(command);
//         commandInput.value = '';
//     }
// });

// displayStatus(JSON.stringify(Telegram.WebApp.initDataUnsafe));

const matchId = Telegram.WebApp.initDataUnsafe.start_param;
const user = Telegram.WebApp.initDataUnsafe.user;
// displayStatus(`Извлеченный matchId and user: ${matchId} ${user}`);  

const playerInfoUsername = document.querySelector('#player-info .username');
playerInfoUsername.textContent = '@' + user.username;
const playerInfoImage = document.querySelector('#player-info .user-image');
playerInfoImage.src = `https://t.me/i/userpic/320/${user.username}.jpg`;
playerInfoImage.onerror = function () {
    playerInfoImage.src = 'reqs/ava.jpg';
};
// displayStatus(`Отправка команды challenge для game_id: ${matchId}`);
try {
    sendCommand(`challenge ${matchId} ${user.username}`);
} catch (error) {
    // displayStatus(`Ошибка при отправке команды: ${error}`);
}

const whiteFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"; 
createChessboardFromFEN(whiteFEN, 'w');