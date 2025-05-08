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
const joinGameWithIdButton = document.getElementById('join-game-id-button'); // Corrected ID
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
let cells = []; // Populated in ui.js
const statusMessageContainer = document.getElementById('status-message-container');
let statusMessage = document.getElementById('status-message'); // Re-assign if needed, or ensure it's always valid
const resetButton = document.getElementById('reset-button');


// --- Constantes ---
const DEFAULT_IMAGE_URL = 'https://placehold.co/60x60/cccccc/ffffff?text=?';
const SUPABASE_TABLE_NAME = 'games'; // Ensure this matches your Supabase table
const SUPABASE_URL = 'https://gjxhppuobvjuypsxqhah.supabase.co'; // YOUR_SUPABASE_URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeGhwcHVvYnZqdXlwc3hxaGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0MzcxNzIsImV4cCI6MjA2MjAxMzE3Mn0.Rk1xe9CCyDccS4ueN-AI6Glv05xSK7hS2LXtxclLXtU'; // YOUR_SUPABASE_ANON_KEY


// --- Estado del Usuario y Juego (Global) ---
let supabase = null;
let realtimeChannel = null;
let currentUser = null;
let localPlayerProfile = null; // Example: { id: 'user-uuid', name: 'user@example.com', imageUrl: '...' }
let currentGameId = null;
let localPlayerIndex = -1; // 0 for 'X' (creator), 1 for 'O' (joiner)
let gameState = {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayerIndex: 0, // 0 or 1
    players: [null, null], // Array of player profile objects
    isGameOver: false,
    winnerIndex: -1, // 0, 1, or -1 for draw/none
    winningCombination: null // Array of 3 cell indices
};
const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];