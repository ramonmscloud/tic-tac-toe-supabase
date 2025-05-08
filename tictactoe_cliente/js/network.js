// --- Funciones de Red (Crear/Unirse a Partida, Escuchar Cambios, Mover) ---

async function fetchAndDisplayOpenGames() {
    console.log("fetchAndDisplayOpenGames: Function called.");
    if (!supabase) {
        console.error("fetchAndDisplayOpenGames: Supabase client is not initialized.");
        noOpenGamesMessageP.textContent = "Error: Supabase no conectado.";
        openGamesListDiv.innerHTML = ''; openGamesListDiv.appendChild(noOpenGamesMessageP);
        return;
    }
    if (!localPlayerProfile || !localPlayerProfile.id) {
        console.warn("fetchAndDisplayOpenGames: localPlayerProfile or localPlayerProfile.id is not available.");
        noOpenGamesMessageP.textContent = "Error: Perfil de jugador no disponible.";
        openGamesListDiv.innerHTML = ''; openGamesListDiv.appendChild(noOpenGamesMessageP);
        return;
    }

    console.log("fetchAndDisplayOpenGames: Attempting to fetch with localPlayerProfile.id:", localPlayerProfile.id);
    noOpenGamesMessageP.textContent = "Buscando partidas...";
    openGamesListDiv.innerHTML = '';
    openGamesListDiv.appendChild(noOpenGamesMessageP);
    refreshGamesButton.disabled = true;

    try {
        // Query for games that are not over, have only one player (players[1] is null),
        // and where the existing player (players[0]) is not the current user.
        const { data: openGames, error } = await supabase
            .from(SUPABASE_TABLE_NAME)
console.log("Tipo de localPlayerProfile.id:", typeof localPlayerProfile.id); // Validar si localPlayerProfile.id es una cadena JSON válida

        const { data: openGamesResult, error: queryError } = await supabase
            .from(SUPABASE_TABLE_NAME)
            .select('id, players, created_at, is_game_over')
console.log("Valor de localPlayerProfile.id:", localPlayerProfile.id); // Log para verificar el valor de localPlayerProfile.id

        const { data: openGamesData, error: supabaseError } = await supabase
            .from(SUPABASE_TABLE_NAME)
            .select('id, players, created_at, is_game_over')
            .eq('is_game_over', false) // Game is not over
            .is('players[1]', null)    // Second player slot is empty (Supabase filters for array element null)
            .neq('players[0]->>id', localPlayerProfile.id) // Creator is not the current user
            .order('created_at', { ascending: false });

        console.log("fetchAndDisplayOpenGames: Supabase query result:", { openGames: openGamesData, error: supabaseError });

        if (error) {
            console.error("fetchAndDisplayOpenGames: Error al obtener partidas:", error);
            noOpenGamesMessageP.textContent = `Error al cargar partidas: ${error.message}`;
        } else {
            openGamesListDiv.innerHTML = '';
            if (openGames && openGames.length > 0) {
                console.log(`fetchAndDisplayOpenGames: ${openGames.length} partidas encontradas.`);
                openGames.forEach(game => {
                    console.log("fetchAndDisplayOpenGames: Processing game:", game);
                    if (!game.players || !game.players[0]) {
                        console.warn("fetchAndDisplayOpenGames: Game object missing players[0] data:", game);
                        return;
                    }

                    const gameItem = document.createElement('div');
                    gameItem.classList.add('game-list-item');

                    const gameInfo = document.createElement('div');
                    const creatorNameP = document.createElement('p');
                    creatorNameP.classList.add('creator-name');
                    const creatorName = game.players[0]?.name ? game.players[0].name.split('@')[0] : 'Desconocido';
                    creatorNameP.textContent = `Creada por: ${creatorName}`;

                    const gameIdP = document.createElement('p');
                    gameIdP.classList.add('game-id-short');
                    gameIdP.textContent = `ID: ${game.id.substring(0, 8)}...`;

                    gameInfo.appendChild(creatorNameP);
                    gameInfo.appendChild(gameIdP);

                    const joinButton = document.createElement('button');
                    joinButton.textContent = 'Unirse';
                    joinButton.classList.add('bg-green-500', 'hover:bg-green-600', 'text-white', 'font-bold', 'py-1', 'px-3', 'rounded-md', 'text-xs', 'sm:text-sm');
                    joinButton.onclick = () => joinGame(game.id);

                    gameItem.appendChild(gameInfo);
                    gameItem.appendChild(joinButton);
                    openGamesListDiv.appendChild(gameItem);
                });
            } else {
                console.log("fetchAndDisplayOpenGames: No hay partidas abiertas disponibles que coincidan con los criterios.");
                noOpenGamesMessageP.textContent = "No hay partidas abiertas disponibles.";
                openGamesListDiv.appendChild(noOpenGamesMessageP);
            }
        }
    } catch (catchError) {
        console.error("fetchAndDisplayOpenGames: Excepción catastrófica al obtener partidas:", catchError);
        noOpenGamesMessageP.textContent = "Error crítico al cargar la lista de partidas.";
         if (openGamesListDiv.innerHTML === '' || openGamesListDiv.contains(noOpenGamesMessageP)) {
            openGamesListDiv.innerHTML = '';
            openGamesListDiv.appendChild(noOpenGamesMessageP);
        }
    } finally {
        refreshGamesButton.disabled = false;
        console.log("fetchAndDisplayOpenGames: Fetch attempt finished.");
    }
}


async function createGame() {
    console.log("createGame: Function called.");
    if (!localPlayerProfile || !supabase) {
        networkStatus.textContent = !localPlayerProfile ? "Debes iniciar sesión primero." : "Error de conexión.";
        return;
    }
    networkStatus.textContent = "Creando partida...";
    createGameButton.disabled = true; joinGameWithIdButton.disabled = true; refreshGamesButton.disabled = true;

    try {
        const initialGameStateForSupabase = {
            board: Array(9).fill(''),
            current_player_index: 0,
            players: [localPlayerProfile, null], // Player 1 is the creator
            is_game_over: false,
            winner_index: -1,
            winning_combination: null
            // Supabase automatically adds 'id' and 'created_at'
        };
        const { data, error } = await supabase
            .from(SUPABASE_TABLE_NAME)
            .insert([initialGameStateForSupabase])
            .select() // Fetch the inserted row, including its generated ID
            .single(); // Expect a single row

        if (error) throw error;
        if (!data || !data.id) throw new Error("No se pudo obtener el ID de la partida creada.");

        currentGameId = data.id;
        localPlayerIndex = 0; // Creator is player 0
        networkStatus.textContent = `Partida creada! ID: ${currentGameId}. Esperando oponente...`;
        gameIdDisplay.textContent = `ID de Partida: ${currentGameId}`;
        listenToGameUpdates(currentGameId); // Start listening for updates (e.g., opponent joining)
    } catch (error) {
        console.error("Error al crear la partida:", error);
        networkStatus.textContent = `Error al crear partida: ${error.message}. Intenta de nuevo.`;
        createGameButton.disabled = false; joinGameWithIdButton.disabled = false; refreshGamesButton.disabled = false;
    }
}

async function joinGame(gameIdFromList = null) {
    console.log("joinGame: Function called.");
    if (!localPlayerProfile || !supabase) {
        networkStatus.textContent = "Debes iniciar sesión para unirte.";
        return;
    }
    const gameIdToJoin = gameIdFromList || joinGameIdInput.value.trim();
    if (!gameIdToJoin) {
        networkStatus.textContent = "Por favor, introduce un ID de partida.";
        return;
    }
    networkStatus.textContent = `Uniéndose a la partida ${gameIdToJoin}...`;
    createGameButton.disabled = true; joinGameWithIdButton.disabled = true; refreshGamesButton.disabled = true;

    try {
        // Fetch the game state first to check if it's joinable
        const { data: gameData, error: fetchError } = await supabase
            .from(SUPABASE_TABLE_NAME)
            .select('*')
            .eq('id', gameIdToJoin)
            .single(); // Expect a single row

        if (fetchError) throw fetchError; // If game not found, .single() causes an error
        if (!gameData) throw new Error("Partida no encontrada.");

        // Check conditions
        if (gameData.players[0].id === localPlayerProfile.id) {
             console.log("joinGame: El creador ya está en la partida. Re-escuchando...");
             currentGameId = gameIdToJoin;
             localPlayerIndex = 0;
             listenToGameUpdates(currentGameId);
             networkStatus.textContent = "Reconectado a tu partida. Esperando oponente si es necesario.";
             // Potentially call processGameStateUpdate if gameData is recent enough or fetch again
             processGameStateUpdate(gameData);
             return;
        }
        if (gameData.players[1] && gameData.players[1].id !== localPlayerProfile.id) { // Check if player 2 slot is filled by someone else
            throw new Error("La partida ya está llena.");
        }
        if (gameData.is_game_over) {
            throw new Error("Esta partida ya ha terminado.");
        }

        // Prepare the update payload
        const updatedPlayers = [gameData.players[0], localPlayerProfile]; // Player 2 is the joiner
        const updatePayload = { players: updatedPlayers };
        // if (!gameData.players[1]) { // If player 2 was null, game starts now. Current player is already 0 by default.
            // updatePayload.current_player_index = 0; // Or decide who starts, e.g., creator.
        // }

        const { data: updateData, error: updateError } = await supabase
            .from(SUPABASE_TABLE_NAME)
            .update(updatePayload)
            .eq('id', gameIdToJoin)
            .select()
            .single();

        if (updateError) throw updateError;

        currentGameId = gameIdToJoin;
        localPlayerIndex = 1; // Joiner is player 1
        networkStatus.textContent = "¡Te has unido a la partida! Esperando inicio...";
        gameIdDisplay.textContent = `ID de Partida: ${currentGameId}`;
        joinGameIdInput.value = '';
        listenToGameUpdates(currentGameId);
        // processGameStateUpdate(updateData); // Process the state after joining
    } catch (error) {
        console.error("Error al unirse a la partida:", error);
        networkStatus.textContent = `Error al unirse: ${error.message}`;
        createGameButton.disabled = false; joinGameWithIdButton.disabled = false; refreshGamesButton.disabled = false;
    }
}

function mapSupabaseToLocalState(supabaseData) {
    if (!supabaseData) {
        console.error("mapSupabaseToLocalState: supabaseData es nulo o indefinido.");
        return { // Return a default empty state
            board: Array(9).fill(''),
            currentPlayerIndex: 0,
            players: [null, null],
            isGameOver: false,
            winnerIndex: -1,
            winningCombination: null
        };
    }
    // Ensure players array is always a 2-element array, even if Supabase returns sparse or incomplete
    let playersArray = [null, null];
    if (supabaseData.players && Array.isArray(supabaseData.players)) {
        playersArray[0] = supabaseData.players[0] || null;
        playersArray[1] = supabaseData.players[1] || null;
    }

    return {
        board: supabaseData.board || Array(9).fill(''),
        currentPlayerIndex: typeof supabaseData.current_player_index === 'number' ? supabaseData.current_player_index : 0,
        players: playersArray,
        isGameOver: supabaseData.is_game_over || false,
        winnerIndex: typeof supabaseData.winner_index === 'number' ? supabaseData.winner_index : -1,
        winningCombination: supabaseData.winning_combination || null
    };
}

function processGameStateUpdate(updatedData) {
    console.log(`processGameStateUpdate: Recibidos datos (stringified):`, JSON.stringify(updatedData));
    gameState = mapSupabaseToLocalState(updatedData); // Crucial: update global gameState
    console.log(`processGameStateUpdate: Estado local actualizado (stringified):`, JSON.stringify(gameState));
    console.log(`processGameStateUpdate: localPlayerIndex: ${localPlayerIndex}, currentUser.id: ${currentUser?.id}`);
    console.log(`processGameStateUpdate: gameState.players:`, gameState.players);


    const P0_DataExists = gameState.players && gameState.players[0] && gameState.players[0].id;
    const P1_DataExists = gameState.players && gameState.players[1] && gameState.players[1].id;
    console.log(`processGameStateUpdate: P0_DataExists: ${P0_DataExists}, P1_DataExists: ${P1_DataExists}`);


    // Logic to transition to game screen or update it
    if (gameSection.classList.contains('hidden')) { // If game screen is not yet visible
        // Show game screen if this player is part of the game and player data is sufficient
        if ((localPlayerIndex === 0 && P0_DataExists) || // Player 0 and their data exists
            (localPlayerIndex === 1 && P0_DataExists && P1_DataExists)) { // Player 1 and both players' data exist
            showGameScreen(); // This function should also render based on new gameState
        } else {
            // Still waiting for players or conditions not met to show game screen
            if (localPlayerIndex === 0 && P0_DataExists && !P1_DataExists) {
                 networkStatus.textContent = `Esperando al Jugador 2... ID: ${currentGameId}`;
            } else {
                networkStatus.textContent = "Sincronizando partida...";
                console.warn("processGameStateUpdate: Condiciones para mostrar pantalla de juego no cumplidas, pero se recibió actualización.");
            }
        }
    } else { // Game screen is already visible, just update it
        renderBoard();
        updatePlayerInfo();
        updatePlayerTurnDisplay();
        updateGameStatus();
    }

     // Update network status message based on game state, even if game screen is visible
     if (!gameSection.classList.contains('hidden')) {
         if (P0_DataExists && P1_DataExists && !gameState.isGameOver) {
            networkStatus.textContent = "¡Partida en curso!";
         } else if (gameState.isGameOver) {
            networkStatus.textContent = "Partida finalizada.";
         } else if (P0_DataExists && !P1_DataExists) {
            // This might be redundant if already handled by initial screen show logic, but good for dynamic updates
            networkStatus.textContent = `Esperando al Jugador 2... ID: ${currentGameId}`;
         }
     }
}


function listenToGameUpdates(gameId) {
    if (!supabase || !gameId) {
        console.error("listenToGameUpdates: Supabase no inicializado o gameId no proporcionado.");
        return;
    }
    console.log(`listenToGameUpdates: Configurando listener para gameId: ${gameId}`);

    if (realtimeChannel) {
        console.log("listenToGameUpdates: Removiendo canal Realtime existente...");
        supabase.removeChannel(realtimeChannel)
            .then(status => console.log("listenToGameUpdates: Canal Realtime anterior removido, estado:", status))
            .catch(error => console.error("listenToGameUpdates: Error al remover canal Realtime previo:", error));
        realtimeChannel = null; // Important to nullify after removal
    }

    realtimeChannel = supabase
        .channel(`game-${gameId}`) // Unique channel per game
        .on('postgres_changes',
            { event: '*', schema: 'public', table: SUPABASE_TABLE_NAME, filter: `id=eq.${gameId}` },
            (payload) => {
                console.log('listenToGameUpdates: Cambio recibido de Supabase:', payload);
                if (payload.eventType === 'DELETE') {
                    // Handle game deletion (e.g., creator left before anyone joined and deleted it)
                    alert("La partida ha sido eliminada o ha terminado abruptamente.");
                    leaveGame(); // Go back to network screen
                    return;
                }
                if (!payload.new) {
                    console.warn("listenToGameUpdates: Payload no contiene 'new'. Esto puede pasar en DELETEs o si hay un problema.", payload);
                    return; // Or handle as an error/stale data indicator
                }
                processGameStateUpdate(payload.new);
            }
        )
        .subscribe(async (status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log(`listenToGameUpdates: Suscrito exitosamente al canal para la partida ${gameId}. Cargando estado inicial de la partida.`);
                networkStatus.textContent = "Conectado al canal. Cargando partida...";
                // Fetch the current game state once subscribed to ensure we have the latest
                try {
                    const { data: initialData, error: initialError } = await supabase
                        .from(SUPABASE_TABLE_NAME)
                        .select('*')
                        .eq('id', gameId)
                        .single();

                    if (initialError) {
                        console.error("Error cargando estado inicial de la partida (fetch post-suscripción):", initialError);
                        if (initialError.code === 'PGRST116') { // "Not found" for .single()
                             networkStatus.textContent = "La partida ya no existe o fue eliminada.";
                             leaveGame(); // Clean up and go back
                        } else {
                             networkStatus.textContent = "Error al cargar datos de la partida.";
                        }
                        return;
                    }
                    if (initialData) {
                        processGameStateUpdate(initialData);
                    } else {
                        // This case should ideally be covered by initialError with PGRST116
                        networkStatus.textContent = "Partida no encontrada después de la suscripción.";
                        leaveGame();
                    }
                } catch (e) {
                    console.error("Error crítico durante la carga/procesamiento inicial del estado del juego:", e);
                    networkStatus.textContent = "Error crítico al cargar la partida.";
                }
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error(`Error en el canal Realtime (${status}):`, err);
                networkStatus.textContent = `Error de conexión Realtime (${status}). Intenta refrescar.`;
                // Optionally, try to resubscribe or prompt user
            } else {
                console.log(`Estado del canal Realtime: ${status}`);
            }
        });
}

function checkWinOrDraw(boardToCheck, lastSymbol) {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (boardToCheck[a] === lastSymbol && boardToCheck[b] === lastSymbol && boardToCheck[c] === lastSymbol) {
            return { winner: lastSymbol, combination }; // Return symbol of winner and combination
        }
    }
    if (!boardToCheck.includes('')) {
        return { winner: 'draw', combination: null }; // It's a draw
    }
    return { winner: null, combination: null }; // Game continues
}

async function sendMove(cellIndex) {
    // Validate move conditions
    if (!currentGameId || !supabase || localPlayerIndex === -1 ||
        !gameState.players[0] || !gameState.players[1] || // Both players must be present
        gameState.board[cellIndex] !== '' || gameState.isGameOver ||
        gameState.currentPlayerIndex !== localPlayerIndex) {
        console.warn("sendMove: Movimiento inválido, fuera de turno, o esperando jugadores. Detalles:", {
            currentGameId, supabaseExists: !!supabase, localPlayerIndex,
            player0Exists: !!gameState.players[0], player1Exists: !!gameState.players[1],
            cellValue: gameState.board[cellIndex], isGameOver: gameState.isGameOver,
            isMyTurn: gameState.currentPlayerIndex === localPlayerIndex
        });
        return;
    }

    const symbol = localPlayerIndex === 0 ? 'X' : 'O';
    const newBoard = [...gameState.board];
    newBoard[cellIndex] = symbol;

    // Check for win or draw
    const { winner, combination } = checkWinOrDraw(newBoard, symbol);
    let newIsGameOver = false;
    let newWinnerIndex = -1;
    let newWinningCombination = null;
    let nextPlayerIndex = (gameState.currentPlayerIndex + 1) % 2; // Switch turn

    if (winner && winner !== 'draw') { // We have a winner
        newIsGameOver = true;
        newWinnerIndex = localPlayerIndex; // The current player (who made the move) is the winner
        newWinningCombination = combination;
    } else if (winner === 'draw' || !newBoard.includes('')) { // It's a draw (either by 'draw' result or full board)
        newIsGameOver = true;
        // winnerIndex remains -1 for a draw
    }

    // Prepare the state update for Supabase
    const updatedGameStateForSupabase = {
        board: newBoard,
        current_player_index: nextPlayerIndex,
        is_game_over: newIsGameOver,
        winner_index: newWinnerIndex,
        winning_combination: newWinningCombination
        // players array doesn't change here
    };

    try {
        const { error } = await supabase
            .from(SUPABASE_TABLE_NAME)
            .update(updatedGameStateForSupabase)
            .eq('id', currentGameId);

        if (error) {
            console.error("Error al enviar movimiento a Supabase:", error);
            networkStatus.textContent = "Error al enviar movimiento. Intenta de nuevo.";
            // Potentially revert local optimistic update if any, or re-fetch state
        } else {
            console.log("Movimiento enviado y actualizado en Supabase.");
            // Realtime listener should pick this up and call processGameStateUpdate
        }
    } catch (error) {
        console.error("Error catastrófico en sendMove (try-catch):", error);
        networkStatus.textContent = "Error crítico al procesar movimiento.";
    }
}

async function leaveGame() {
    console.log("leaveGame: Called. currentGameId:", currentGameId, "localPlayerIndex:", localPlayerIndex);
    if (realtimeChannel) {
        console.log("leaveGame: Unsubscribing from realtime channel.");
        try {
            const status = await supabase.removeChannel(realtimeChannel);
            console.log("leaveGame: Channel removal status:", status);
        } catch (error) {
            console.error("leaveGame: Error removing channel:", error);
        }
        realtimeChannel = null;
    }

    const gameIdBeingLeft = currentGameId; // Store before resetting
    const playerIndexLeaving = localPlayerIndex;
    
    resetLocalGameState(); // Resets UI and local state variables like currentGameId, localPlayerIndex

    // If the user was in a game, update Supabase (e.g., forfeit or delete)
    if (gameIdBeingLeft && supabase && currentUser) {
        try {
            // Fetch the game to see its current state (e.g., if other player exists)
            const { data: gameBeforeLeaving, error: fetchErr } = await supabase
                .from(SUPABASE_TABLE_NAME)
                .select('players, is_game_over')
                .eq('id', gameIdBeingLeft)
                .single();

            if (fetchErr) {
                console.warn("leaveGame: No se pudo obtener el estado de la partida antes de abandonar:", fetchErr.message);
                // Game might have been deleted by the other player or system already
            } else if (gameBeforeLeaving && !gameBeforeLeaving.is_game_over) {
                // Game exists and is not over, determine if to delete or forfeit
                if (playerIndexLeaving === 0 && gameBeforeLeaving.players[0]?.id === currentUser.id) {
                    // Player 0 (creator) is leaving
                    if (!gameBeforeLeaving.players[1]) { // No second player yet
                        console.log("leaveGame: Player 0 (creator) leaving an empty game. Deleting game.");
                        await supabase.from(SUPABASE_TABLE_NAME).delete().eq('id', gameIdBeingLeft);
                    } else { // Second player exists, Player 0 forfeits
                        console.log("leaveGame: Player 0 (creator) leaving. Player 1 wins by forfeit.");
                        await supabase.from(SUPABASE_TABLE_NAME)
                            .update({ is_game_over: true, winner_index: 1, current_player_index: -1 }) // player_index -1 to indicate no more turns
                            .eq('id', gameIdBeingLeft);
                    }
                } else if (playerIndexLeaving === 1 && gameBeforeLeaving.players[1]?.id === currentUser.id) {
                    // Player 1 is leaving, Player 0 wins by forfeit
                    console.log("leaveGame: Player 1 leaving. Player 0 wins by forfeit.");
                    await supabase.from(SUPABASE_TABLE_NAME)
                        .update({ is_game_over: true, winner_index: 0, current_player_index: -1 })
                        .eq('id', gameIdBeingLeft);
                }
            }
        } catch (dbError) {
            console.error("leaveGame: Error actualizando/borrando la partida en Supabase:", dbError);
        }
    }

    // UI updates after leaving
    gameSection.classList.add('hidden');
    gameIdDisplay.textContent = ''; // Clear game ID from display
    // statusMessage.textContent = ''; // Already handled by resetLocalGameState if it clears UI elements
    networkStatus.textContent = 'Has abandonado la partida.'; // General status

    if (currentUser) { // If user is still logged in, show network section
        networkSection.classList.remove('hidden');
        createGameButton.disabled = false;
        joinGameWithIdButton.disabled = false;
        refreshGamesButton.disabled = false; // Re-enable refresh
        fetchAndDisplayOpenGames(); // Refresh open games list
    } else { // No user, show auth section
        authSection.classList.remove('hidden');
        networkSection.classList.add('hidden');
    }
}