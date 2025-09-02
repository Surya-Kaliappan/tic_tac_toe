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
let gameStarted = false; 

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
        alert('Please enter a Name!');
    }
};

elements.startGameBtn.onclick = () => {
    elements.startGameBtn.textContent = 'Connecting...';
    elements.startGameBtn.disabled = true;

    const roomCode = elements.roomCodeInput.value;
    if (roomCode) {
        joinGame(roomCode.toUpperCase());
    } else {
        createNewGame();
    }
};

elements.terminateSearchBtn.onclick = () => {
    quitGame();
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

// quitting the connection
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
        gameStarted = false; 
        resetUI();
        renderBoard(boardState, null);
        showScreen('lobby');
        elements.roomCodeInput.value = '';
        elements.roomCodeInput.readOnly = false;
        elements.startGameBtn.textContent = 'Start Game';
        elements.startGameBtn.disabled = false;
        elements.roomIdDisplay.textContent = '';
        elements.terminateSearchBtn.style.display = 'none';
    }, 200);  // set 0.2s for setup to maintain delay
}

elements.leaveGameBtn.onclick = () => {
    showConfirmationModal("Are you sure you want to leave?");
};

elements.quitBtn.onclick = () => {
    showConfirmationModal("Are you sure you want to quit?");
};

// Setting Parameter in Peer connection
function createNewGame() {
    amIHost = true;
    const shortCode = generateId(6);
    peer = new Peer(shortCode);

    // Set time for getting Room ID
    connectionTimeout = setTimeout(() => {
        if (!peer.open) {
            showError("Could not connect to the server. Please check your internet connection and try again.");
            if (peer) peer.destroy();
        }
    }, 10000);  // wait 10s for getting the response from Peerjs

    peer.on('open', (id) => {
        clearTimeout(connectionTimeout);
        elements.roomCodeInput.value = id;
        elements.roomCodeInput.readOnly = true;
        elements.startGameBtn.textContent = 'Waiting for opponent...';
        elements.terminateSearchBtn.style.display = 'inline-block';
        elements.roomIdDisplay.textContent = `Room ID: ${id}`;
    });

    peer.on('connection', (newConn) => {
        if (conn && conn.open) {
            newConn.on('open', () => {
                newConn.send({ type: 'room-full' });
                setTimeout(() => newConn.close(), 500);
            });
            return;
        }
        conn = newConn;
        conn.on('open', () => {
            opponentName = conn.metadata.username;
            startNewGame(amIHost);
        });
        conn.on('data', handleData);
    });

    peer.on('error', (err) => {
        clearTimeout(connectionTimeout);
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
            if (!conn || !conn.open) {
                showError("Could not connect to the host. Please check the Room ID and try again.");
                if (peer) peer.destroy(); // Clean up the peer object
            }
        }, 10000); // wait for 10 seconds to connection success

        conn.on('open', () => {
            clearTimeout(connectionTimeout); // Connection successful, clear the timeout
        });

        conn.on('data', handleData);
    });

    peer.on('error', (err) => {
        clearTimeout(connectionTimeout);
        showError(`An error occurred: ${err.type}. This room may not exist or the host is unavailable.`);
    });
}

// Game Initialize procedure
function initializeGame(symbol, turn, oppName) {
    gameStarted = true; // Set the flag that the game is now active
    mySymbol = symbol;
    myTurn = turn;
    opponentName = oppName;

    updatePlayerInfo(
        { name: 'You', symbol: mySymbol },
        { name: opponentName, symbol: mySymbol === 'X' ? 'O' : 'X' }
    );
    
    renderBoard(boardState, handleCellClick);
    showScreen('game');
    updateStatus();
}

// Cell control
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

// Game Events
function handleData(data) {
    switch (data.type) {
        case 'start':  // Start the game
            if (!amIHost) { startNewGame(amIHost); }
            initializeGame(data.symbol, data.startTurn, data.opponentName);
            break;
        case 'room-full':
            showError("This room is already full.");
            quitGame();
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
            forceEndGame(`${opponentName} has left the game.`);
            break;
    }
}

// updating player turn
function updateStatus() {
    if (gameIsOver) return;
    updateTurnIndicator(myTurn);
}

// check the cell combinations
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
        endGame("It's a Tie!");
        return true;
    }
    return false;
}

// End Game Procedure
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

// New Game Procedures
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

// Six Character Code
function generateId(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

showScreen('name');