// --- All functions that manipulate the DOM ---

const screens = {
    name: document.getElementById('name-screen'),
    lobby: document.getElementById('lobby-screen'),
    game: document.getElementById('game-screen'),
};

const elements = {
    usernameInput: document.getElementById('username-input'),
    welcomeUsername: document.getElementById('welcome-username'),
    roomCodeInput: document.getElementById('room-code-input'),
    startGameBtn: document.getElementById('start-game-btn'),
    gameBoard: document.getElementById('game-board'),
    playAgainBtn: document.getElementById('play-again-btn'),
    leaveGameBtn: document.getElementById('leave-game-btn'),
    myName: document.getElementById('my-name'),
    mySymbol: document.getElementById('my-symbol'),
    opponentName: document.getElementById('opponent-name'),
    opponentSymbol: document.getElementById('opponent-symbol'),
    playerMe: document.getElementById('player-me'),
    playerOpponent: document.getElementById('player-opponent'),
    endGameModalOverlay: document.getElementById('end-game-modal-overlay'),
    gameResultText: document.getElementById('game-result-text'),
    quitBtn: document.getElementById('quit-btn'),
    roomIdDisplay: document.getElementById('room-id-display'),
    confirmModalOverlay: document.getElementById('confirm-modal-overlay'),
    confirmModalText: document.getElementById('confirm-modal-text'),
    confirmYesBtn: document.getElementById('confirm-yes-btn'),
    confirmNoBtn: document.getElementById('confirm-no-btn'),
    finalBoardClone: document.getElementById('final-board-clone'),
};

function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function updatePlayerInfo(myData, opponentData) {
    elements.myName.textContent = myData.name;
    elements.mySymbol.textContent = myData.symbol;
    elements.opponentName.textContent = opponentData.name;
    elements.opponentSymbol.textContent = opponentData.symbol;
}

function updateTurnIndicator(isMyTurn) {
    elements.playerMe.classList.toggle('active-turn', isMyTurn);
    elements.playerOpponent.classList.toggle('active-turn', !isMyTurn);
}

function renderBoard(boardState, clickHandler) {
    elements.gameBoard.innerHTML = '';
    boardState.forEach((symbol, index) => {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = index;
        cell.textContent = symbol;
        if (!symbol && clickHandler) {
            cell.addEventListener('click', () => clickHandler(index));
        }
        elements.gameBoard.appendChild(cell);
    });
}

function showEndGameModal(message) {
    elements.gameResultText.textContent = message;
    elements.finalBoardClone.innerHTML = elements.gameBoard.innerHTML;
    elements.gameBoard.style.display = 'none';
    elements.endGameModalOverlay.classList.remove('hidden');
}

function hideEndGameModal() {
    elements.gameBoard.style.display = 'grid';
    elements.endGameModalOverlay.classList.add('hidden');
}

function showConfirmationModal(message, onConfirm) {
    elements.confirmModalText.textContent = message;
    elements.confirmModalOverlay.classList.remove('hidden');
    
    elements.confirmNoBtn.addEventListener('click', () => elements.confirmModalOverlay.classList.add('hidden'), { once: true });
    elements.confirmYesBtn.addEventListener('click', () => {
        elements.confirmModalOverlay.classList.add('hidden');
        onConfirm();
    }, { once: true });
}

function resetUI() {
    hideEndGameModal();
    elements.finalBoardClone.innerHTML = '';
    elements.playAgainBtn.disabled = false;
    elements.playAgainBtn.textContent = 'Play Again';
}

function highlightWinningCells(combination) {
    combination.forEach(index => {
        // Highlight the main board
        elements.gameBoard.children[index].classList.add('winning-cell');
        // Ensure the clone exists before trying to highlight it
        if (elements.finalBoardClone.children.length) {
            elements.finalBoardClone.children[index].classList.add('winning-cell');
        }
    });
}