// --- Funciones de Lógica del Juego y Renderizado (UI) ---

function showGameScreen() {
     console.log("showGameScreen: Function called.");
     authSection.classList.add('hidden');
     networkSection.classList.add('hidden');
     gameSection.classList.remove('hidden');

     // Initialize cells array if not already done (e.g. first time game screen is shown)
     if (cells.length === 0 && boardElement) {
         cells = Array.from(boardElement.querySelectorAll('.cell'));
         cells.forEach(cell => {
             cell.addEventListener('click', handleCellClick);
         });
     }
     // Render based on current gameState (which should be up-to-date via processGameStateUpdate)
     renderBoard();
     updatePlayerInfo();
     updatePlayerTurnDisplay();
     updateGameStatus();
}

function updatePlayerInfo() {
    // Check if gameState.players is defined and is an array
    if (!gameState.players || !Array.isArray(gameState.players)) {
        console.warn("updatePlayerInfo: gameState.players is not valid.", gameState.players);
        // Set to default display if player data is missing
        playerNameElements.forEach((el, idx) => el.textContent = `Jugador ${idx + 1}`);
        playerImageElements.forEach(el => el.src = DEFAULT_IMAGE_URL);
        playerInfoElements.forEach(el => el.classList.remove('active'));
        return;
    }

    gameState.players.forEach((player, index) => {
        const nameToShow = player ? (player.name.split('@')[0] || `Jugador ${index + 1}`) : `Jugador ${index + 1}`;
        playerNameElements[index].textContent = nameToShow;
        playerImageElements[index].src = player?.imageUrl || DEFAULT_IMAGE_URL;
        playerImageElements[index].alt = nameToShow;

        // Highlight active player if game is ongoing and both players are present
        playerInfoElements[index].classList.toggle('active',
            gameState.players[0] && gameState.players[1] && // Both players must be in the game
            index === gameState.currentPlayerIndex &&
            !gameState.isGameOver);
    });
}

function renderBoard() {
    if (!cells || cells.length === 0) {
        console.warn("renderBoard: cells array is not initialized or boardElement not found.");
        return; // Exit if cells are not ready
    }

    gameState.board.forEach((value, index) => {
        if (!cells[index]) return; // Defensive check for each cell

        cells[index].textContent = value;
        cells[index].classList.remove('winning-cell'); // Clear previous winning state

        // Determine if the cell should be disabled
        const gameReadyForMoves = !gameState.isGameOver &&
                                   gameState.players[0] && gameState.players[1] && // Both players connected
                                   localPlayerIndex !== -1 && // Current client is a player
                                   localPlayerIndex === gameState.currentPlayerIndex; // It's this client's turn

        if (value === '' && gameReadyForMoves) {
            cells[index].classList.remove('disabled');
        } else {
            cells[index].classList.add('disabled');
        }

        // Highlight winning cells if game is over and there's a winning combination
        if (gameState.isGameOver && gameState.winningCombination && gameState.winningCombination.includes(index)) {
            cells[index].classList.add('winning-cell');
        }
    });
}


function handleCellClick(event) {
    if (!currentUser || localPlayerIndex === -1) {
        console.warn("handleCellClick: No hay usuario o jugador local no definido.");
        return;
    }
    const index = parseInt(event.target.dataset.index);

    // Double check conditions directly, even if 'disabled' class is used
    if (event.target.classList.contains('disabled')) {
        console.log("handleCellClick: Clic en celda deshabilitada (clase).");
        return;
    }

    // Explicitly check game state for validity of move
    if (gameState.board[index] === '' &&               // Cell is empty
        !gameState.isGameOver &&                       // Game is not over
        gameState.players[0] && gameState.players[1] && // Both players are connected
        gameState.currentPlayerIndex === localPlayerIndex) { // It's this player's turn
        sendMove(index);
    } else {
        console.warn("handleCellClick: Intento de movimiento no válido (condiciones lógicas no cumplidas).", {
            cellValue: gameState.board[index],
            isGameOver: gameState.isGameOver,
            playersExist: gameState.players[0] && gameState.players[1],
            isMyTurn: gameState.currentPlayerIndex === localPlayerIndex
        });
    }
}

function updatePlayerTurnDisplay() {
    // Hide turn indicator if game is over, or not all players are present, or current player data is missing
    if (gameState.isGameOver || !gameState.players[0] || !gameState.players[1] || !gameState.players[gameState.currentPlayerIndex]) {
        turnIndicator.classList.add('hidden');
        return;
    }

    turnIndicator.classList.remove('hidden');
    const currentTurnPlayer = gameState.players[gameState.currentPlayerIndex];
    // Display name (first part of email) or generic player symbol if name not available
    currentPlayerName.textContent = currentTurnPlayer?.name.split('@')[0] || (gameState.currentPlayerIndex === 0 ? 'X' : 'O');
}

function updateGameStatus() {
    statusMessage.innerHTML = ''; // Clear previous message content
    statusMessageContainer.classList.remove('hidden'); // Ensure container is visible

    if (gameState.isGameOver) {
        turnIndicator.classList.add('hidden'); // Hide turn indicator when game is over
        let winnerProfile = (gameState.winnerIndex !== -1 && gameState.players[gameState.winnerIndex]) ? gameState.players[gameState.winnerIndex] : null;

        if (winnerProfile) {
            const winnerImg = document.createElement('img');
            winnerImg.src = winnerProfile.imageUrl || DEFAULT_IMAGE_URL;
            winnerImg.alt = winnerProfile.name;
            winnerImg.classList.add('winner-image');
            statusMessage.appendChild(winnerImg);
            statusMessage.appendChild(document.createTextNode(`¡${winnerProfile.name.split('@')[0]} ha ganado!`));
        } else if (gameState.winnerIndex === -1 && !gameState.board.includes('')) { // Draw condition
            statusMessage.textContent = "¡Es un empate!";
        } else if (gameState.winnerIndex === -1 && gameState.isGameOver) { // Game over but no winner (e.g. someone left, handled by leaveGame potentially)
            statusMessage.textContent = "Partida terminada."; // Or specific message if one player left
        } else {
             statusMessage.textContent = "Partida terminada."; // Generic end message
        }
        // Re-enable network buttons if user is logged in
        if (currentUser) {
            createGameButton.disabled = false;
            joinGameWithIdButton.disabled = false;
            refreshGamesButton.disabled = false;
        }
    } else { // Game is not over
        if (!gameState.players[0] || !gameState.players[1]) {
            statusMessage.textContent = "Esperando jugadores...";
        } else {
            // Game is ongoing, clear status message or show whose turn it is (handled by turnIndicator)
            statusMessage.textContent = ""; // Or keep it empty if turnIndicator is primary
        }
    }
}

function resetLocalGameState() {
    console.log("resetLocalGameState: Resetting local game state.");
    currentGameId = null;
    localPlayerIndex = -1;
    gameState = { // Reset to initial state
        board: Array(9).fill(''),
        currentPlayerIndex: 0,
        players: [null, null],
        isGameOver: false,
        winnerIndex: -1,
        winningCombination: null
    };
    // Reset UI elements
    if (cells && cells.length > 0) {
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('winning-cell', 'disabled');
        });
    }
    playerImageElements.forEach(img => img.src = DEFAULT_IMAGE_URL);
    playerNameElements.forEach(nameEl => nameEl.textContent = 'Jugador ?'); // Or more generic
    playerInfoElements.forEach(infoEl => infoEl.classList.remove('active'));
    turnIndicator.classList.add('hidden');
    statusMessage.textContent = ''; // Clear status message
    // gameIdDisplay.textContent = ''; // This might be cleared in leaveGame specifically
}