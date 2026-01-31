// Game State
const gameState = {
    score: 0,
    timeLeft: 90,
    lives: 3,
    badHits: 0,
    isPlaying: false,
    isPaused: false,
    timer: null,
    currentMole: null,
    volume: 0.7,
    highScore: localStorage.getItem('whackMoleHighScore') || 0,
    moles: [],
    goodImages: ['img/SPEAKI_SENYUM_1.webp', 'img/SPEAKI_SENYUM_1.webp'],
    badImages: ['img/sinbe11.webp', 'img/sinbe11.webp'],
    goodHitImages: ['img/SPEAKI_TERGANTUNG_ORANGNYA.webp', 'img/SPEAKI_TERGANTUNG_ORANGNYA.webp'],
    badHitImages: ['img/sinbe22.webp','img/sinbe22.webp' ]
};

// DOM Elements
const elements = {
    // Screens
    mainMenu: document.getElementById('main-menu'),
    gameScreen: document.getElementById('game-screen'),
    howToScreen: document.getElementById('how-to-screen'),
    gameOverModal: document.getElementById('game-over-modal'),
    
    // Game elements
    time: document.getElementById('time'),
    score: document.getElementById('score'),
    lives: document.getElementById('lives'),
    badHits: document.getElementById('bad-hits'),
    highScore: document.getElementById('high-score'),
    finalScore: document.getElementById('final-score'),
    bestScore: document.getElementById('best-score'),
    timeLeft: document.getElementById('time-left'),
    gameOverMessage: document.getElementById('game-over-message'),
    holesContainer: document.querySelector('.holes-container'),
    hammer: document.getElementById('hammer'),
    volumeSlider: document.getElementById('volume-slider'),
    soundIcon: document.getElementById('sound-icon'),
    
    // Buttons
    startGame: document.getElementById('start-game'),
    howToPlay: document.getElementById('how-to-play'),
    backFromHowto: document.getElementById('back-from-howto'),
    pauseGame: document.getElementById('pause-game'),
    backMenu: document.getElementById('back-menu'),
    playAgain: document.getElementById('play-again'),
    backToMenu: document.getElementById('back-to-menu')
};

// Audio Elements
const sounds = {
    appear: document.getElementById('mole-appear-sound'),
    goodHit: document.getElementById('good-hit-sound'),
    badHit: document.getElementById('bad-hit-sound'),
    bgMusic: document.getElementById('bg-music'),
    goodSpawn: document.getElementById('good-spawn-sound'),
    badSpawn: document.getElementById('bad-spawn-sound')
};

// Initialize Game
function initGame() {
    createHoles();
    updateHighScoreDisplay();
    setupEventListeners();
    setVolume(gameState.volume);
}

// Create Holes
function createHoles() {
    elements.holesContainer.innerHTML = '';
    gameState.moles = [];
    
    for (let i = 0; i < 9; i++) {
        const hole = document.createElement('div');
        hole.className = 'hole';
        hole.dataset.index = i;
        
        const mole = document.createElement('img');
        mole.className = 'mole';
        mole.style.display = 'none';
        
        hole.appendChild(mole);
        elements.holesContainer.appendChild(hole);
        
        gameState.moles.push({
            element: hole,
            mole: mole,
            isActive: false,
            isGood: false,
            imageIndex: 0,
            isHit: false
        });
        
        hole.addEventListener('click', () => whackMole(i));
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Menu buttons
    elements.startGame.addEventListener('click', startGame);
    elements.howToPlay.addEventListener('click', showHowToPlay);
    elements.backFromHowto.addEventListener('click', showMainMenu);
    
    // Game buttons
    elements.pauseGame.addEventListener('click', togglePause);
    elements.backMenu.addEventListener('click', backToMainMenu);
    
    // Game over buttons
    elements.playAgain.addEventListener('click', restartGame);
    elements.backToMenu.addEventListener('click', () => {
        elements.gameOverModal.classList.remove('active');
        showMainMenu();
    });
    
    // Volume control
    elements.volumeSlider.addEventListener('input', handleVolumeChange);
    
    // Hammer follow mouse
    document.addEventListener('mousemove', (e) => {
        if (!gameState.isPlaying) return;
        
        const gameBoard = document.querySelector('.game-board');
        const rect = gameBoard.getBoundingClientRect();
        
        // Calculate position relative to game board
        const x = e.clientX - rect.left - 40;
        const y = e.clientY - rect.top - 40;
        
        // Keep hammer within game board bounds
        const boundedX = Math.max(0, Math.min(x, rect.width - 80));
        const boundedY = Math.max(0, Math.min(y, rect.height - 80));
        
        elements.hammer.style.left = `${boundedX}px`;
        elements.hammer.style.top = `${boundedY}px`;
    });
    
    // Hammer swing on click
    document.addEventListener('click', () => {
        if (!gameState.isPlaying || gameState.isPaused) return;
        
        elements.hammer.classList.add('swing');
        setTimeout(() => {
            elements.hammer.classList.remove('swing');
        }, 100);
    });
}

// Screen Navigation
function showMainMenu() {
    elements.gameScreen.classList.remove('active');
    elements.howToScreen.classList.remove('active');
    elements.mainMenu.classList.add('active');
    stopGame();
}

function showHowToPlay() {
    elements.mainMenu.classList.remove('active');
    elements.howToScreen.classList.add('active');
}

// Start Game
function startGame() {
    elements.mainMenu.classList.remove('active');
    elements.gameScreen.classList.add('active');
    
    resetGame();
    gameState.isPlaying = true;
    gameState.isPaused = false;
    
    updateUI();
    startTimer();
    spawnMole();
    playSound(sounds.bgMusic);
}

// Reset Game
function resetGame() {
    gameState.score = 0;
    gameState.timeLeft = 90;
    gameState.lives = 3;
    gameState.badHits = 0;
    gameState.isPlaying = false;
    gameState.isPaused = false;
    
    clearTimeout(gameState.currentMole);
    gameState.currentMole = null;
    
    // Hide all moles
    gameState.moles.forEach(mole => {
        mole.mole.style.display = 'none';
        mole.isActive = false;
        mole.isHit = false;
    });
}

// Update UI
function updateUI() {
    elements.time.textContent = gameState.timeLeft;
    elements.score.textContent = gameState.score;
    elements.lives.textContent = gameState.lives;
    elements.badHits.textContent = gameState.badHits;
}

// Update High Score Display
function updateHighScoreDisplay() {
    elements.highScore.textContent = gameState.highScore;
}

// Game Timer
function startTimer() {
    clearInterval(gameState.timer);
    
    gameState.timer = setInterval(() => {
        if (!gameState.isPaused && gameState.isPlaying) {
            gameState.timeLeft--;
            elements.time.textContent = gameState.timeLeft;
            
            if (gameState.timeLeft <= 0) {
                endGame('time');
            }
        }
    }, 1000);
}

// Spawn Mole
function spawnMole() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    // Hide current mole if exists
    hideAllMoles();
    
    // Find inactive hole
    const inactiveHoles = gameState.moles.filter(mole => !mole.isActive);
    if (inactiveHoles.length === 0) return;
    
    const randomHole = inactiveHoles[Math.floor(Math.random() * inactiveHoles.length)];
    const holeIndex = gameState.moles.indexOf(randomHole);
    
    // Determine mole type (70% good, 30% bad)
    const isGood = Math.random() < 0.7;
    const imageIndex = Math.floor(Math.random() * 2);
    
    // Set mole properties
randomHole.isActive = true;
randomHole.isGood = isGood;
randomHole.imageIndex = imageIndex;
randomHole.isHit = false;

// Set mole image dengan properti CSS
randomHole.mole.src = isGood ? gameState.goodImages[imageIndex] : gameState.badImages[imageIndex];
randomHole.mole.className = `mole ${isGood ? 'good' : 'bad'}`;
randomHole.mole.style.display = 'block';
//randomHole.mole.style.width = 'auto';
//randomHole.mole.style.height = 'auto'; 
randomHole.mole.style.maxHeight = '95%';
randomHole.mole.style.maxWidth = '80%'; 
randomHole.mole.style.objectFit = 'contain'; 

// Tunggu gambar load dulu baru muncul
playSound(isGood ? sounds.goodSpawn : sounds.badSpawn);
    // Show mole setelah gambar ready
    setTimeout(() => {
        randomHole.mole.classList.add('active');
    }, 10); 

// Set timeout to hide mole
const speedMultiplier = 1 + (gameState.score / 200) + ((90 - gameState.timeLeft) / 60);
const baseTime = 1300;
const visibleTime = Math.max(350, (baseTime / speedMultiplier)); //+ Math.random() * 500);
    gameState.currentMole = setTimeout(() => {
        if (randomHole.isActive && !randomHole.isHit) {
            hideMole(holeIndex);
        }
    }, visibleTime);
}
// Hide Mole
function hideMole(holeIndex) {
    const mole = gameState.moles[holeIndex];
    if (!mole.isActive) return;
    
    mole.mole.classList.remove('active');
    setTimeout(() => {
        mole.mole.style.display = 'none';
        mole.isActive = false;
        mole.isHit = false;
        
        // Spawn new mole after delay
        if (gameState.isPlaying && !gameState.isPaused) {
            setTimeout(spawnMole, 500);
        }
    }, 300);
}

// Hide All Moles
function hideAllMoles() {
    gameState.moles.forEach((mole, index) => {
        if (mole.isActive) {
            mole.mole.classList.remove('active');
            setTimeout(() => {
                mole.mole.style.display = 'none';
                mole.isActive = false;
                mole.isHit = false;
            }, 300);
        }
    });
    
    if (gameState.currentMole) {
        clearTimeout(gameState.currentMole);
        gameState.currentMole = null;
    }
}

function stopAllSpawnSounds() {
    // Force stop semua spawn sound
    sounds.goodSpawn.pause();
    sounds.goodSpawn.currentTime = 0;
    sounds.badSpawn.pause();
    sounds.badSpawn.currentTime = 0;
}

// Whack Mole
function whackMole(holeIndex) {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    const mole = gameState.moles[holeIndex];
    if (!mole.isActive || mole.isHit) return;
    
    mole.isHit = true;

    // Panggil di whackMole():
    stopAllSpawnSounds();

    // Change to hit image
    if (mole.isGood) {
        mole.mole.src = gameState.goodHitImages[mole.imageIndex];
        gameState.score += 10;
        playSound(sounds.goodHit);
        
        // Visual feedback
        mole.mole.style.transform = 'scale(1.2)';
        setTimeout(() => {
            mole.mole.style.transform = 'scale(1)';
        }, 200);
    } else {
        mole.mole.src = gameState.badHitImages[mole.imageIndex];
        gameState.score -= 10;
        gameState.badHits++;
        playSound(sounds.badHit);
        
        // Visual feedback
        //mole.mole.style.filter = 'brightness(0.7)';
        
        // Check if game over from bad hits
        if (gameState.badHits >= 3) {
            setTimeout(() => endGame('bad'), 300);
        }
    }
    
    // Update UI
    updateUI();
    
    // Hide mole after hit
    setTimeout(() => {
        hideMole(holeIndex);
    }, 300);
}

// Pause/Resume Game
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        elements.pauseGame.innerHTML = '<i class="fas fa-play"></i> LANJUT';
        pauseSound(sounds.bgMusic);
    } else {
        elements.pauseGame.innerHTML = '<i class="fas fa-pause"></i> JEDA';
        playSound(sounds.bgMusic);
    }
}

// Back to Main Menu
function backToMainMenu() {
    if (confirm('Apakah Anda yakin ingin kembali ke menu? Progress game akan hilang.')) {
        showMainMenu();
    }
}

// End Game
function endGame(reason) {
    gameState.isPlaying = false;
    clearInterval(gameState.timer);
    hideAllMoles();
    pauseSound(sounds.bgMusic);
    
    // Update high score
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('whackMoleHighScore', gameState.highScore);
        updateHighScoreDisplay();
    }
    
    // Set final stats
    elements.finalScore.textContent = gameState.score;
    elements.bestScore.textContent = gameState.highScore;
    elements.timeLeft.textContent = gameState.timeLeft;
    
    // Set game over message
    let message = '';
    if (reason === 'time') {
        message = 'WAKTU HABIS!<br>Coba lagi untuk skor lebih tinggi!';
    } else if (reason === 'bad') {
        message = 'TERLALU BANYAK MEMUKUL SINBE!<br>Hati-hati memilih target!';
    }
    elements.gameOverMessage.innerHTML = message;
    
    // Show game over modal
    elements.gameOverModal.classList.add('active');
}

// Restart Game
function restartGame() {
    elements.gameOverModal.classList.remove('active');
    startGame();
}

// Stop Game
function stopGame() {
    gameState.isPlaying = false;
    gameState.isPaused = false;
    clearInterval(gameState.timer);
    hideAllMoles();
    pauseSound(sounds.bgMusic);
}

// Audio Functions
function setVolume(volume) {
    gameState.volume = volume / 100;
    
    // Set volume for all sounds
    Object.values(sounds).forEach(sound => {
        sound.volume = gameState.volume;
    });
    
    // Update icon
    if (gameState.volume === 0) {
        elements.soundIcon.className = 'fas fa-volume-mute';
    } else if (gameState.volume < 0.5) {
        elements.soundIcon.className = 'fas fa-volume-down';
    } else {
        elements.soundIcon.className = 'fas fa-volume-up';
    }
}

function handleVolumeChange(e) {
    setVolume(e.target.value);
}

function playSound(sound) {
    console.log("Playing sound:", sound.id);
    if (gameState.volume === 0) return;
    
    try {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
        console.log('Audio error:', e);
    }
}

function pauseSound(sound) {
    sound.pause();
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', initGame);