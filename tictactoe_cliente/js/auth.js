// --- Funciones de Autenticación y UI ---

function initializeSupabase() {
    try {
        if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('TU_') || SUPABASE_KEY.includes('TU_')) {
            throw new Error("Configuración de Supabase incompleta.");
        }
        if (!window.supabase?.createClient) {
            throw new Error("SDK de Supabase no cargado.");
        }
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        return true;
    } catch (error) {
        networkStatus && (networkStatus.textContent = "Error al conectar con el servicio.");
        displayAuthMessage(`Error al conectar: ${error.message}`, true);
        authSection?.classList.remove('hidden');
        networkSection?.classList.add('hidden');
        gameSection?.classList.add('hidden');
        supabase = null;
        return false;
    }
}

function displayAuthMessage(message, isError = false) {
    if (!authMessageDisplay) return;
    authMessageDisplay.textContent = message;
    authMessageDisplay.classList.toggle('hidden', false);
    authMessageDisplay.classList.toggle('error', isError);
    authMessageDisplay.classList.toggle('success', !isError);
}

function clearAuthMessage() {
    if (!authMessageDisplay) return;
    authMessageDisplay.textContent = '';
    authMessageDisplay.classList.add('hidden');
    authMessageDisplay.classList.remove('error', 'success');
}

async function handleSignUp(event) {
    event.preventDefault();
    clearAuthMessage();
    if (!supabase) {
        displayAuthMessage("Supabase no está inicializado.", true);
        return;
    }
    const { email, password } = Object.fromEntries(new FormData(signupForm));
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
        displayAuthMessage(`Error en registro: ${error.message}`, true);
    } else {
        displayAuthMessage("¡Registro exitoso! Revisa tu email para confirmar tu cuenta.", false);
        signupForm.reset();
        signupForm.classList.add('hidden');
        signinForm.classList.remove('hidden');
    }
}

async function handleSignIn(event) {
    event.preventDefault();
    clearAuthMessage();
    if (!supabase) {
        displayAuthMessage("Supabase no está inicializado.", true);
        return;
    }
    const { email, password } = Object.fromEntries(new FormData(signinForm));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        displayAuthMessage(`Error al iniciar sesión: ${error.message}`, true);
    } else {
        displayAuthMessage("Inicio de sesión exitoso. Cargando...", false);
        signinForm.reset();
    }
}

async function handleSignOut() {
    clearAuthMessage();
    if (!supabase) {
        displayAuthMessage("Supabase no está inicializado.", true);
        return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
        displayAuthMessage(`Error al cerrar sesión: ${error.message}`, true);
    } else {
        displayAuthMessage("Sesión cerrada.", false);
    }
}

function updateAuthUI(user) {
    currentUser = user;
    if (user) {
        authSection.classList.add('hidden');
        userStatusSection.classList.remove('hidden');
        userEmailDisplay.textContent = user.email;
        networkSection.classList.remove('hidden');
        gameSection.classList.add('hidden');
        createGameButton.disabled = false;
        joinGameWithIdButton.disabled = false;
        refreshGamesButton.disabled = false;

        const placeholderColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const placeholderText = user.email.charAt(0).toUpperCase();
        localPlayerProfile = {
            id: user.id,
            name: user.email,
            imageUrl: `https://placehold.co/60x60/${placeholderColor}/ffffff?text=${placeholderText}`
        };
        fetchAndDisplayOpenGames();
    } else {
        currentUser = null;
        localPlayerProfile = null;
        authSection.classList.remove('hidden');
        signinForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        userStatusSection.classList.add('hidden');
        userEmailDisplay.textContent = '';
        networkSection.classList.add('hidden');
        gameSection.classList.add('hidden');
        createGameButton.disabled = true;
        joinGameWithIdButton.disabled = true;
        refreshGamesButton.disabled = true;

        if (currentGameId && realtimeChannel) {
            leaveGame();
        } else {
            resetLocalGameState();
        }
    }
}