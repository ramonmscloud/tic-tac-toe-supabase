// --- Event Listeners Globales y Arranque ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed.");

    // Initialize Supabase client
    const supabaseReady = initializeSupabase(); // initializeSupabase is from auth.js
    console.log("DOMContentLoaded: supabaseReady status:", supabaseReady);

    // Toggle between Sign In and Sign Up forms
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        signinForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        clearAuthMessage(); // clearAuthMessage from auth.js
    });
    showSigninLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        signinForm.classList.remove('hidden');
        clearAuthMessage(); // clearAuthMessage from auth.js
    });

    if (supabaseReady) {
        console.log("DOMContentLoaded: supabaseReady is true. Attaching auth and game event listeners.");

        // Auth form listeners
        if (signinForm) signinForm.addEventListener('submit', handleSignIn); // from auth.js
        if (signupForm) signupForm.addEventListener('submit', handleSignUp); // from auth.js
        if (signoutButton) signoutButton.addEventListener('click', handleSignOut); // from auth.js

        // Listen for Supabase auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('[AUTH_STATE_CHANGE] Event:', event, 'Session:', session);

            const user = session?.user || null;
            updateAuthUI(user); // updateAuthUI from auth.js

            // Handle specific auth events for user feedback if needed
            if (event === 'SIGNED_IN' && session) {
                console.log('[AUTH_STATE_CHANGE] SIGNED_IN event detected successfully! User:', session.user.email);
                // displayAuthMessage("Sesión iniciada correctamente.", false); // This might be too quick if updateAuthUI also shows msg
            } else if (event === 'INITIAL_SESSION' && !session) {
                console.log('[AUTH_STATE_CHANGE] Initial session, no user.');
                // Check for auth errors in URL hash (e.g., from email confirmation link)
                if (window.location.hash.includes('error=')) {
                    try {
                        // Best effort to parse, ensure no open redirect vulnerabilities if using hash for more
                        const params = new URLSearchParams(window.location.hash.substring(1));
                        const errorDescription = params.get('error_description');
                        if (errorDescription) {
                            displayAuthMessage(`Error de autenticación: ${decodeURIComponent(errorDescription.replace(/\+/g, ' '))}`, true);
                            // Clean the hash
                            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
                        }
                    } catch (e) { console.error("Error parsing auth error from hash", e); }
                }
            } else if (event === 'SIGNED_OUT') {
                console.log('[AUTH_STATE_CHANGE] SIGNED_OUT event.');
                displayAuthMessage("Sesión cerrada.", false); // Display after UI updates
            } else if (event === 'USER_DELETED') {
                console.log('[AUTH_STATE_CHANGE] USER_DELETED event.');
                displayAuthMessage("Tu cuenta ha sido eliminada.", true);
            } else if (event === 'PASSWORD_RECOVERY') {
                 console.log('[AUTH_STATE_CHANGE] PASSWORD_RECOVERY event. User may need to check email.');
                 displayAuthMessage("Estás en modo de recuperación de contraseña. Sigue las instrucciones para resetearla.", false);
            } else if (event === 'TOKEN_REFRESHED'){
                console.log('[AUTH_STATE_CHANGE] TOKEN_REFRESHED event.');
            } else if (event === 'USER_UPDATED') {
                console.log('[AUTH_STATE_CHANGE] USER_UPDATED event.');
                 if (user && userEmailDisplay.textContent !== user.email) { // Example of updating UI on user data change
                    userEmailDisplay.textContent = user.email;
                }
            }
        });
    } else {
        console.warn("DOMContentLoaded: supabaseReady is false. Funcionalidad de red y autenticación limitada o deshabilitada.");
        updateAuthUI(null); // Ensure UI reflects no auth state
        displayAuthMessage("Error crítico: No se pudo conectar al servicio. La funcionalidad online no está disponible.", true);
        // Disable buttons that require supabase
        createGameButton.disabled = true;
        joinGameWithIdButton.disabled = true;
        refreshGamesButton.disabled = true;
    }

    // Network/Game action listeners
    if (createGameButton) createGameButton.addEventListener('click', createGame); // from network.js
    if (joinGameWithIdButton) joinGameWithIdButton.addEventListener('click', () => joinGame()); // from network.js, wrapping for no args
    if (refreshGamesButton) refreshGamesButton.addEventListener('click', fetchAndDisplayOpenGames); // from network.js
    if (resetButton) resetButton.addEventListener('click', leaveGame); // from network.js (Abandonar Partida)

    // Note: Cell click listeners are added in ui.js when the game screen is shown
});