// --- Log inicial para depurar el hash de la URL ---
console.log("RAW window.location.href:", window.location.href);
console.log("RAW window.location.hash:", window.location.hash);

// --- Variables del DOM ---
const authSection = document.getElementById('auth-section');
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');
const showSignupLink = document.getElementById('show-signup');
const showSigninLink = document.getElementById('show-signin');
const authMessageDisplay = document.getElementById('auth-message-display');
const userStatusSection = document.getElementById('user-status-section');
const userEmailDisplay = document.getElementById('user-email-display');
const signoutButton = document.getElementById('signout-button');

const networkSection = document.getElementById('network-section');
const createGameButton = document.getElementById('create-game-button');
const gameIdDisplay = document.getElementById('game-id-display');
const joinGameIdInput = document.getElementById('join-game-id');
const joinGameWithIdButton = document.getElementById('join-game-id-button');
const networkStatus = document.getElementById('network-status');
const openGamesListDiv = document.getElementById('open-games-list');
const noOpenGamesMessageP = document.getElementById('no-open-games-message');
const refreshGamesButton = document.getElementById('refresh-games-button');

const gameSection = document.getElementById('game-section');
const playerInfoElements = [document.getElementById('player-info-0'), document.getElementById('player-info-1')];
const playerImageElements = [document.getElementById('player-image-0'), document.getElementById('player-image-1')];
const playerNameElements = [document.getElementById('player-name-0'), document.getElementById('player-name-1')];
const turnIndicator = document.getElementById('turn-indicator');
const currentPlayerName = document.getElementById('current-player-name');
const boardElement = document.getElementById('board');
let cells = [];
const statusMessageContainer = document.getElementById('status-message-container');
let statusMessage = document.getElementById('status-message');
const resetButton = document.getElementById('reset-button');

// --- Constantes ---
const DEFAULT_IMAGE_URL = 'https://placehold.co/60x60/cccccc/ffffff?text=?';
const SUPABASE_TABLE_NAME = 'games';

// --- Estado del Usuario y Juego ---
let supabase = null;
let realtimeChannel = null;
let currentUser = null;
let localPlayerProfile = null;
let currentGameId = null;
let localPlayerIndex = -1;
let gameState = {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayerIndex: 0,
    players: [null, null],
    isGameOver: false,
    winnerIndex: -1,
    winningCombination: null
};
const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// --- Inicialización de Supabase ---
function initializeSupabase() {
    console.log("Intentando inicializar Supabase...");
    try {
        const supabaseUrl = 'https://gjxhppuobvjuypsxqhah.supabase.co'; 
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeGhwcHVvYnZqdXlwc3hxaGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0MzcxNzIsImV4cCI6MjA2MjAxMzE3Mn0.Rk1xe9CCyDccS4ueN-AI6Glv05xSK7hS2LXtxclLXtU';

        if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('TU_') || supabaseKey.includes('TU_')) {
            console.warn("Supabase URL o Key no configuradas. Por favor, edita el script y añade tus credenciales de Supabase.");
            displayAuthMessage("Configuración de Supabase incompleta. Revisa la consola para más detalles.", true);
            throw new Error("Configuración de Supabase incompleta. URL o Key faltantes.");
        }
        if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
            console.error("El SDK de Supabase no se ha cargado correctamente.");
            displayAuthMessage("Error al cargar el SDK de Supabase. Revisa la consola.", true);
            throw new Error("SDK de Supabase no cargado.");
        }
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log("Supabase inicializado correctamente.");
        return true;
    } catch (error) {
        console.error("Error inicializando Supabase:", error);
        networkStatus.textContent = "Error al conectar con el servicio.";
        displayAuthMessage(`Error al conectar: ${error.message}`, true);
        authSection.classList.remove('hidden');
        networkSection.classList.add('hidden');
        gameSection.classList.add('hidden');
        supabase = null;
        return false;
    }
}

// --- Funciones de Autenticación y UI ---
function displayAuthMessage(message, isError = false) {
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
    authMessageDisplay.textContent = '';
    authMessageDisplay.classList.add('hidden');
    authMessageDisplay.classList.remove('error', 'success');
}

// Más funciones aquí...