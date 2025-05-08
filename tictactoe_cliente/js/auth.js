// --- Funciones de Autenticación y UI ---

function initializeSupabase() {
    console.log("Intentando inicializar Supabase...");
    try {
        // Supabase URL and Key are now in globals.js
        if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('TU_') || SUPABASE_KEY.includes('TU_')) {
             console.warn("Supabase URL o Key no configuradas. Por favor, edita globals.js y añade tus credenciales de Supabase.");
             displayAuthMessage("Configuración de Supabase incompleta. Revisa la consola para más detalles.", true);
             throw new Error("Configuración de Supabase incompleta. URL o Key faltantes.");
        }
        if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
            console.error("El SDK de Supabase no se ha cargado correctamente.");
            displayAuthMessage("Error al cargar el SDK de Supabase. Revisa la consola.", true);
            throw new Error("SDK de Supabase no cargado.");
        }
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); // Assign to global supabase
        console.log("Supabase inicializado correctamente.");
        return true;
    } catch (error) {
        console.error("Error inicializando Supabase:", error);
        if(networkStatus) networkStatus.textContent = "Error al conectar con el servicio.";
        displayAuthMessage(`Error al conectar: ${error.message}`, true);
        if(authSection) authSection.classList.remove('hidden');
        if(networkSection) networkSection.classList.add('hidden');
        if(gameSection) gameSection.classList.add('hidden');
        supabase = null; // Ensure supabase is null if init fails
        return false;
    }
}

function displayAuthMessage(message, isError = false) {
    if (!authMessageDisplay) return;
    authMessageDisplay.textContent = message;
    authMessageDisplay.classList.remove('hidden');
    if (isError) {
        authMessageDisplay.classList.remove('success');
        authMessageDisplay.classList.add('error');
    } else {
        authMessageDisplay.classList.remove('error');
        authMessageDisplay.classList.add('success');
    }
}

function clearAuthMessage() {
    if (!authMessageDisplay) return;
    authMessageDisplay.textContent = '';
    authMessageDisplay.classList.add('hidden');
    authMessageDisplay.classList.remove('error', 'success');
}

async function handleSignUp(event) {
    console.log("handleSignUp: Function called.");
    event.preventDefault();
    clearAuthMessage();
    if (!supabase) {
        console.error("handleSignUp: Supabase no está inicializado.");
        displayAuthMessage("Supabase no está inicializado. No se puede registrar.", true);
        return;
    }
    const email = signupForm.elements['signup-email'].value;
    const password = signupForm.elements['signup-password'].value;
    console.log("handleSignUp: Attempting to sign up with email:", email);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
        console.error("handleSignUp: Error en registro:", error);
        displayAuthMessage(`Error en registro: ${error.message}`, true);
    } else {
        console.log("handleSignUp: Usuario registrado:", data.user);
        // Advise user to check email, Supabase handles confirmation.
        displayAuthMessage("¡Registro exitoso! Revisa tu email para confirmar tu cuenta. Luego, inicia sesión.", false);
        signupForm.reset();
        signupForm.classList.add('hidden');
        signinForm.classList.remove('hidden');
    }
}

async function handleSignIn(event) {
    event.preventDefault();
    clearAuthMessage();
    if (!supabase) { displayAuthMessage("Supabase no está inicializado.", true); return; }
    const email = signinForm.elements['signin-email'].value;
    const password = signinForm.elements['signin-password'].value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        displayAuthMessage(`Error al iniciar sesión: ${error.message}`, true);
        console.error("Error al iniciar sesión:", error);
    } else {
        // onAuthStateChange will handle the rest of the UI update
        displayAuthMessage("Inicio de sesión exitoso. Cargando...", false);
        console.log("Usuario inició sesión:", data.user);
        signinForm.reset();
        // UI update is handled by onAuthStateChange
    }
}

async function handleSignOut() {
    clearAuthMessage();
    if (!supabase) { displayAuthMessage("Supabase no está inicializado.", true); return; }
    const { error } = await supabase.auth.signOut();
    if (error) {
        displayAuthMessage(`Error al cerrar sesión: ${error.message}`, true);
        console.error("Error al cerrar sesión:", error);
    } else {
        // onAuthStateChange will handle UI update
        displayAuthMessage("Sesión cerrada.", false); // Brief message
        console.log("Usuario cerró sesión.");
        // Global currentUser will be set to null by onAuthStateChange
    }
}

function updateAuthUI(user) {
    currentUser = user; // Update global currentUser
    if (user) {
        console.log("updateAuthUI: Usuario detectado:", user.email);
        authSection.classList.add('hidden');
        userStatusSection.classList.remove('hidden');
        userEmailDisplay.textContent = user.email;

        networkSection.classList.remove('hidden');
        gameSection.classList.add('hidden'); // Hide game section when auth state changes, re-join if needed
        createGameButton.disabled = false;
        joinGameWithIdButton.disabled = false;
        refreshGamesButton.disabled = false;


        // Create a simple local player profile
        const placeholderColor = Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        const placeholderText = user.email.charAt(0).toUpperCase();
        localPlayerProfile = {
            id: user.id,
            name: user.email, // Or a display name if you have one
            imageUrl: `https://placehold.co/60x60/${placeholderColor}/ffffff?text=${placeholderText}`
        };
        console.log("updateAuthUI: localPlayerProfile creado:", localPlayerProfile);
        fetchAndDisplayOpenGames(); // Fetch games when user is logged in
    } else {
        console.log("updateAuthUI: No hay usuario.");
        currentUser = null; // Ensure current user is null
        localPlayerProfile = null; // Clear local profile

        authSection.classList.remove('hidden');
        signinForm.classList.remove('hidden'); // Default to sign-in
        signupForm.classList.add('hidden');
        userStatusSection.classList.add('hidden');
        userEmailDisplay.textContent = '';

        networkSection.classList.add('hidden');
        gameSection.classList.add('hidden');
        createGameButton.disabled = true;
        joinGameWithIdButton.disabled = true;
        refreshGamesButton.disabled = true;


        // If the user signs out while in a game, ensure they leave it properly
        if (currentGameId && realtimeChannel) { // Check if they were in a game
             console.log("updateAuthUI: User signed out, ensuring they leave any active game.");
             leaveGame(); // This will also reset local game state and UI
        } else {
            resetLocalGameState(); // Ensure game state is clean even if not actively in a game channel
        }
    }
}