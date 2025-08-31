// --- Global Variables ---
let peer;
let conn;
let myUsername = '';
let mySymbol = '';
let myTurn = false;
let boardState = ['', '', '', '', '', '', '', '', ''];
let iWantToPlayAgain = false;
let opponentWantsToPlayAgain = false;
let amIHost = false; // New variable to reliably track the host

const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// --- HTML Elements ---
const nameScreen = document.getElementById('name-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
const usernameInput = document.getElementById('username-input');
const enterLobbyBtn = document.getElementById('enter-lobby-btn');
const welcomeUsername = document.getElementById('welcome-username');
const roomCodeInput = document.getElementById('room-code-input');
const startGameBtn = document.getElementById('start-game-btn');
const gameStatus = document.getElementById('game-status');
const cells = document.querySelectorAll('.cell');
const playAgainBtn = document.getElementById('play-again-btn');


// --- Helper Function ---
function generateId(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// --- Event Listeners ---
enterLobbyBtn.onclick = () => {
    myUsername = usernameInput.value;
    if (myUsername) {
        welcomeUsername.innerText = myUsername;
        nameScreen.classList.remove('active');
        lobbyScreen.classList.add('active');
    } else {
        alert('Please enter a name!');
    }
};

startGameBtn.onclick = () => {
    const roomCode = roomCodeInput.value;
    if (roomCode) {
        joinGame(roomCode.toUpperCase());
    } else {
        createNewGame();
    }
};

cells.forEach((cell, index) => {
    cell.addEventListener('click', () => {
        handleCellClick(index);
    });
});

playAgainBtn.onclick = () => {
    iWantToPlayAgain = true;
    playAgainBtn.textContent = "Waiting for Opponent...";
    playAgainBtn.disabled = true;

    // Inform the other player that we want to play again
    conn.send({ type: 'play-again' });

    // The host will manage the restart if both players are ready
    if (opponentWantsToPlayAgain && amIHost) {
        startNewGame(amIHost, conn.metadata.username);
        conn.send({ type: 'restart' });
    }
};

// --- Core Functions ---
function createNewGame() {
    amIHost = true; // This player is the host
    const shortCode = generateId(6);
    peer = new Peer(shortCode);

    peer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
        roomCodeInput.value = id;
        roomCodeInput.readOnly = true;
        startGameBtn.textContent = 'Waiting for opponent...';
        startGameBtn.disabled = true;
    });

    peer.on('connection', (newConn) => {
        conn = newConn;
        conn.on('open', () => {
            startNewGame(amIHost, conn.metadata.username); 
        });
        conn.on('data', handleData);
        conn.on('close', () => endGame("Opponent has disconnected."));
    });
}

function joinGame(roomCode) {
    amIHost = false; // This player is the joiner
    peer = new Peer({ metadata: { username: myUsername } });

    peer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
        conn = peer.connect(roomCode, { reliable: true, metadata: { username: myUsername } });

        conn.on('open', () => {
            console.log("Connection open, waiting for host to start the game.");
        });
        conn.on('data', handleData);
        conn.on('close', () => endGame("Opponent has disconnected."));
    });
}

function initializeGame(symbol, turn, opponentName = '') {
    mySymbol = symbol;
    myTurn = turn;
    
    lobbyScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    gameStatus.innerText = opponentName ? `Playing against ${opponentName}` : "Waiting for opponent...";
    updateStatus();
}

// --- Game Logic Functions ---
function handleCellClick(index) {
    if (!myTurn || boardState[index] !== '') {
        return;
    }

    updateBoard(mySymbol, index);
    conn.send({ type: 'move', index: index });
    myTurn = false;
    
    if (!checkGameOver()) {
        updateStatus();
    }
}

function handleData(data) {
    switch (data.type) {
        case 'start':
            initializeGame(data.symbol, data.startTurn, data.opponentName);
            break;
        case 'move':
            updateBoard(mySymbol === 'X' ? 'O' : 'X', data.index);
            if (!checkGameOver()) {
                myTurn = true;
                updateStatus();
            }
            break;
        case 'play-again':
            opponentWantsToPlayAgain = true;
            if (iWantToPlayAgain) {
                // If we also want to play again, the host is responsible for restarting
                if (amIHost) {
                    startNewGame(amIHost, conn.metadata.username);
                    conn.send({ type: 'restart' });
                }
            } else {
                gameStatus.innerText = "Opponent wants to play again!";
            }
            break;
        case 'restart':
            // The host has told us to restart the game
            startNewGame(amIHost, conn.peer);
            break;
    }
}

function updateBoard(symbol, index) {
    boardState[index] = symbol;
    cells[index].innerText = symbol;
    cells[index].style.pointerEvents = 'none';
}

function updateStatus() {
    if (myTurn) {
        gameStatus.innerText = "Your Turn (" + mySymbol + ")";
    } else {
        gameStatus.innerText = `Opponent's Turn (${mySymbol === 'X' ? 'O' : 'X'})`;
    }
}

function checkGameOver() {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
            endGame(boardState[a] === mySymbol ? "You Win!" : "You Lose!");
            return true;
        }
    }

    if (!boardState.includes('')) {
        endGame("It's a Draw!");
        return true;
    }

    return false;
}

function endGame(message) {
    myTurn = false;
    gameStatus.innerText = message;
    playAgainBtn.style.display = 'block';
    cells.forEach(cell => cell.style.pointerEvents = 'none');
}

function resetGame() {
    boardState = ['', '', '', '', '', '', '', '', ''];
    cells.forEach(cell => {
        cell.innerText = '';
        cell.style.pointerEvents = 'auto';
    });
    playAgainBtn.style.display = 'none';
    playAgainBtn.disabled = false;
    playAgainBtn.textContent = "Play Again";
    iWantToPlayAgain = false;
    opponentWantsToPlayAgain = false;
}

function startNewGame(isHost, opponentName = '') {
    resetGame();
    if (isHost) {
        // Host determines roles and starts the game
        const hostStarts = Math.random() < 0.5;
        const hostSymbol = hostStarts ? 'X' : 'O';
        const joinerSymbol = hostStarts ? 'O' : 'X';

        initializeGame(hostSymbol, hostStarts, opponentName);
        
        conn.send({ 
            type: 'start', 
            opponentName: myUsername,
            symbol: joinerSymbol,
            startTurn: !hostStarts 
        });
    }
}