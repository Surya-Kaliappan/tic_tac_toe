// --- Core Application Logic ---

let peer;
let conn;
let myUsername = '';
let mySymbol = '';
let myTurn = false;
let boardState = ['', '', '', '', '', '', '', '', ''];
let iWantToPlayAgain = false;
let opponentWantsToPlayAgain = false;
let amIHost = false;
let opponentName = '';
let gameIsOver = false;
let connectionTimeout;

const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

document.getElementById('enter-lobby-btn').onclick = () => {
    myUsername = elements.usernameInput.value;
    if (myUsername) {
        elements.welcomeUsername.textContent = myUsername;
        showScreen('lobby');
    } else {
        alert('Please enter a name!');
    }
};

elements.startGameBtn.onclick = () => {
    // Immediate feedback when the button is clicked
    elements.startGameBtn.textContent = 'Connecting...';
    elements.startGameBtn.disabled = true;

    const roomCode = elements.roomCodeInput.value;
    if (roomCode) {
        joinGame(roomCode.toUpperCase());
    } else {
        createNewGame();
    }
};

elements.playAgainBtn.onclick = () => {
    iWantToPlayAgain = true;
    elements.playAgainBtn.textContent = "Waiting for Opponent...";
    elements.playAgainBtn.disabled = true;
    conn.send({ type: 'play-again' });
    if (opponentWantsToPlayAgain && amIHost) {
        startNewGame(amIHost);
    }
};

function quitGame() {
    if (conn && conn.open) {
        conn.send({ type: 'quit' });
    }
    setTimeout(() => {
        if (peer) peer.destroy();
        boardState = ['', '', '', '', '', '', '', '', ''];
        iWantToPlayAgain = false;
        opponentWantsToPlayAgain = false;
        amIHost = false;
        opponentName = '';
        mySymbol = '';
        myTurn = false;
        gameIsOver = false;
        resetUI();
        renderBoard(boardState, null);
        showScreen('lobby');
        elements.roomCodeInput.value = '';
        elements.roomCodeInput.readOnly = false;
        elements.startGameBtn.textContent = 'Start Game';
        elements.startGameBtn.disabled = false;
        elements.roomIdDisplay.textContent = '';
    }, 100);
}

elements.leaveGameBtn.onclick = () => {
    showConfirmationModal("Are you sure you want to leave?", quitGame);
};

elements.quitBtn.onclick = () => {
    showConfirmationModal("Are you sure you want to quit?", quitGame);
};

function createNewGame() {
    amIHost = true;
    const shortCode = generateId(6);
    peer = new Peer(shortCode);

    peer.on('open', (id) => {
        elements.roomCodeInput.value = id;
        elements.roomCodeInput.readOnly = true;
        elements.startGameBtn.textContent = 'Waiting for opponent...';
        elements.roomIdDisplay.textContent = `Room ID: ${id}`;
    });

    peer.on('connection', (newConn) => {
        conn = newConn;
        conn.on('open', () => {
            opponentName = conn.metadata.username;
            startNewGame(amIHost);
        });
        conn.on('data', handleData);
        conn.on('close', () => endGame("Opponent has disconnected.", [], true));
    });

    peer.on('error', (err) => {
        showError(`An error occurred: ${err.type}. Please try again.`);
    });
}

function joinGame(roomCode) {
    amIHost = false;
    peer = new Peer({ metadata: { username: myUsername } });

    peer.on('open', () => {
        conn = peer.connect(roomCode, { reliable: true, metadata: { username: myUsername } });
        elements.roomIdDisplay.textContent = `Room ID: ${roomCode}`;

        // Set a timeout for the connection
        connectionTimeout = setTimeout(() => {
            if (!conn.open) {
                showError("Could not connect to the host. Please check the Room ID and try again.");
                if (peer) peer.destroy(); // Clean up the peer object
            }
        }, 15000); // 15 seconds

        conn.on('open', () => {
            clearTimeout(connectionTimeout); // Connection successful, clear the timeout
            console.log("Connection open, waiting for host.");
        });
        conn.on('data', handleData);
        conn.on('close', () => endGame("Opponent has disconnected.", [], true));
    });

    peer.on('error', (err) => {
        clearTimeout(connectionTimeout);
        showError(`An error occurred: ${err.type}. This room may not exist or the host is unavailable.`);
    });
}

function initializeGame(symbol, turn, oppName) {
    mySymbol = symbol;
    myTurn = turn;
    opponentName = oppName;

    updatePlayerInfo(
        { name: myUsername, symbol: mySymbol },
        { name: opponentName, symbol: mySymbol === 'X' ? 'O' : 'X' }
    );
    
    renderBoard(boardState, handleCellClick);
    showScreen('game');
    updateStatus();
}

function handleCellClick(index) {
    if (!myTurn || boardState[index] !== '' || gameIsOver) return;
    boardState[index] = mySymbol;
    renderBoard(boardState, handleCellClick);
    conn.send({ type: 'move', index: index, symbol: mySymbol });
    myTurn = false;
    checkGameOver();
    if (!gameIsOver) {
        updateStatus();
    }
}

function handleData(data) {
    switch (data.type) {
        case 'start':
            if (!amIHost) { startNewGame(amIHost); }
            initializeGame(data.symbol, data.startTurn, data.opponentName);
            break;
        case 'move':
            boardState[data.index] = data.symbol;
            renderBoard(boardState, handleCellClick);
            myTurn = true;
            checkGameOver();
            if (!gameIsOver) { updateStatus(); }
            break;
        case 'play-again':
            opponentWantsToPlayAgain = true;
            if (iWantToPlayAgain) {
                if (amIHost) {
                    startNewGame(amIHost);
                    conn.send({ type: 'restart' });
                }
            } else { showOpponentReady(); }
            break;
        case 'restart':
            startNewGame(amIHost);
            break;
        case 'quit':
            forceEndGame("Opponent has left the game.");
            break;
    }
}

function updateStatus() {
    if (gameIsOver) return;
    updateTurnIndicator(myTurn);
}

function checkGameOver() {
    if (gameIsOver) return true;
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
            endGame(boardState[a] === mySymbol ? "You Win!" : "You Lose!", combination);
            return true;
        }
    }
    if (!boardState.includes('')) {
        endGame("It's a Draw!");
        return true;
    }
    return false;
}

function endGame(message, combination = [], isDisconnect = false) {
    if (gameIsOver) return;
    gameIsOver = true;
    myTurn = false;
    showEndGameModal(message, isDisconnect); 
    if (combination.length > 0) {
        highlightWinningCells(combination);
    }
    elements.playerMe.classList.remove('active-turn');
    elements.playerOpponent.classList.remove('active-turn');
    renderBoard(boardState, null);
}

function startNewGame(isHost) {
    gameIsOver = false;
    boardState = ['', '', '', '', '', '', '', '', ''];
    iWantToPlayAgain = false;
    opponentWantsToPlayAgain = false;
    resetUI();
    renderBoard(boardState, handleCellClick);
    if (isHost) {
        const hostStarts = Math.random() < 0.5;
        mySymbol = hostStarts ? 'X' : 'O';
        myTurn = hostStarts;
        initializeGame(mySymbol, myTurn, opponentName);
        conn.send({ 
            type: 'start', 
            opponentName: myUsername,
            symbol: hostStarts ? 'O' : 'X',
            startTurn: !hostStarts 
        });
    }
}

function generateId(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

showScreen('name');