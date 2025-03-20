// Game constants
const GRID_SIZE = 15;
const CELL_TYPES = {
    EMPTY: 0,
    WALL: 1,
    DOT: 2,
    POWER_DOT: 3
};
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Game state
let gameState = {
    grid: [],
    pacman: {
        x: 0,
        y: 0,
        direction: DIRECTIONS.RIGHT,
        nextDirection: DIRECTIONS.RIGHT
    },
    ghosts: [],
    score: 0,
    lives: 5,
    dotsRemaining: 0,
    gameOver: false,
    gameStarted: false,
    frightMode: false,
    frightModeTimer: null,
    gameSpeed: 350,
    difficulty: 'easy',
    isPaused: false
};

// DOM elements
const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const finalScoreElement = document.getElementById('final-score');
const startModal = document.getElementById('start-modal');
const gameOverModal = document.getElementById('game-over-modal');
const helpModal = document.getElementById('help-modal');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const upBtn = document.getElementById('up-btn');
const downBtn = document.getElementById('down-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const helpBtn = document.getElementById('help-btn');
const closeHelpBtn = document.getElementById('close-help');
const tutorialMessage = document.getElementById('tutorial-message');
const closeTutorialBtn = document.getElementById('close-tutorial');

// Initialize the game
function initGame() {
    gameState = {
        grid: generateMaze(),
        pacman: {
            x: 1,
            y: 1,
            direction: DIRECTIONS.RIGHT,
            nextDirection: DIRECTIONS.RIGHT
        },
        ghosts: [
            { x: GRID_SIZE - 2, y: 1, direction: DIRECTIONS.LEFT, color: 'red', frightened: false },
            { x: 1, y: GRID_SIZE - 2, direction: DIRECTIONS.RIGHT, color: 'pink', frightened: false },
            { x: GRID_SIZE - 2, y: GRID_SIZE - 2, direction: DIRECTIONS.UP, color: 'cyan', frightened: false },
            { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2), direction: DIRECTIONS.DOWN, color: 'orange', frightened: false }
        ],
        score: 0,
        lives: 5,
        dotsRemaining: 0,
        gameOver: false,
        gameStarted: false,
        frightMode: false,
        frightModeTimer: null,
        gameSpeed: 350,
        difficulty: 'easy',
        isPaused: false
    };

    updateUI();
    renderGameBoard();
    countDotsRemaining();
    
    showTutorial();
}

// Add game tutorial/guide hint
function showTutorial() {
    const tutorialElement = document.getElementById('tutorial-message');
    if (tutorialElement) {
        tutorialElement.classList.remove('hidden');
        setTimeout(() => {
            if (!tutorialElement.classList.contains('manually-closed')) {
                tutorialElement.classList.add('hidden');
            }
        }, 10000); // 10 seconds after automatically hiding tutorial
    }
}

// Show help modal
function showHelp() {
    if (gameState.gameStarted && !gameState.gameOver) {
        pauseGame();
    }
    helpModal.classList.remove('hidden');
}

// Close help modal
function closeHelp() {
    helpModal.classList.add('hidden');
    if (gameState.gameStarted && !gameState.gameOver && gameState.isPaused) {
        resumeGame();
    }
}

// Pause the game
function pauseGame() {
    if (!gameState.isPaused && gameState.gameStarted && !gameState.gameOver) {
        clearInterval(gameInterval);
        gameState.isPaused = true;
    }
}

// Resume the game
function resumeGame() {
    if (gameState.isPaused && gameState.gameStarted && !gameState.gameOver) {
        gameInterval = setInterval(gameLoop, gameState.gameSpeed);
        gameState.isPaused = false;
    }
}

// Generate the game maze
function generateMaze() {
    const maze = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(CELL_TYPES.EMPTY));
    
    // Add the outer walls
    for (let i = 0; i < GRID_SIZE; i++) {
        maze[0][i] = CELL_TYPES.WALL;
        maze[GRID_SIZE - 1][i] = CELL_TYPES.WALL;
        maze[i][0] = CELL_TYPES.WALL;
        maze[i][GRID_SIZE - 1] = CELL_TYPES.WALL;
    }
    
    // Add some internal walls - reduce wall count and complexity
    for (let i = 2; i < GRID_SIZE - 2; i += 3) { // changed from every 2 to every 3
        for (let j = 2; j < GRID_SIZE - 2; j += 3) { // changed from every 2 to every 3
            maze[i][j] = CELL_TYPES.WALL;
            
            // Random extension of walls - reduce wall extension probability
            if (Math.random() < 0.3) { // changed from 0.4 to 0.3
                const direction = Math.floor(Math.random() * 4);
                if (direction === 0 && i > 2) maze[i-1][j] = CELL_TYPES.WALL;
                if (direction === 1 && i < GRID_SIZE - 3) maze[i+1][j] = CELL_TYPES.WALL;
                if (direction === 2 && j > 2) maze[i][j-1] = CELL_TYPES.WALL;
                if (direction === 3 && j < GRID_SIZE - 3) maze[i][j+1] = CELL_TYPES.WALL;
            }
        }
    }
    
    // Ensure maze is not too complex
    // Randomly clear some walls, creating more passages
    for (let i = 1; i < GRID_SIZE - 1; i++) {
        for (let j = 1; j < GRID_SIZE - 1; j++) {
            if (maze[i][j] === CELL_TYPES.WALL && Math.random() < 0.2) {
                maze[i][j] = CELL_TYPES.EMPTY;
            }
        }
    }
    
    // Add dots and power dots
    for (let i = 1; i < GRID_SIZE - 1; i++) {
        for (let j = 1; j < GRID_SIZE - 1; j++) {
            if (maze[i][j] === CELL_TYPES.EMPTY) {
                maze[i][j] = CELL_TYPES.DOT;
            }
        }
    }
    
    // Add power dots at specific locations
    const powerDotPositions = [
        {x: 1, y: 1},
        {x: 1, y: GRID_SIZE - 2},
        {x: GRID_SIZE - 2, y: 1},
        {x: GRID_SIZE - 2, y: GRID_SIZE - 2},
        {x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2)} // extra power dot in center
    ];
    
    powerDotPositions.forEach(pos => {
        if (maze[pos.y][pos.x] !== CELL_TYPES.WALL) {
            maze[pos.y][pos.x] = CELL_TYPES.POWER_DOT;
        }
    });
    
    // Clear pacman's starting position
    maze[1][1] = CELL_TYPES.EMPTY;
    
    // Clear some points around the ghost, giving player more starting space
    clearAreaAroundPosition(maze, 1, 1, 2);
    
    return maze;
}

// New function: Clear specified position's surrounding area of points and walls
function clearAreaAroundPosition(maze, centerX, centerY, radius) {
    for (let y = Math.max(1, centerY - radius); y <= Math.min(GRID_SIZE - 2, centerY + radius); y++) {
        for (let x = Math.max(1, centerX - radius); x <= Math.min(GRID_SIZE - 2, centerX + radius); x++) {
            if (Math.abs(x - centerX) + Math.abs(y - centerY) <= radius) {
                if (maze[y][x] !== CELL_TYPES.WALL) {
                    maze[y][x] = CELL_TYPES.EMPTY;
                }
            }
        }
    }
}

// Render the game board
function renderGameBoard() {
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            if (gameState.grid[y][x] === CELL_TYPES.WALL) {
                cell.classList.add('wall');
            } else if (gameState.grid[y][x] === CELL_TYPES.DOT) {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                cell.appendChild(dot);
            } else if (gameState.grid[y][x] === CELL_TYPES.POWER_DOT) {
                const powerDot = document.createElement('div');
                powerDot.classList.add('power-dot');
                cell.appendChild(powerDot);
            }
            
            gameBoard.appendChild(cell);
        }
    }
    
    // Add Pac-Man
    const pacmanElement = document.createElement('div');
    pacmanElement.classList.add('pacman');
    const rotationDegrees = {
        [DIRECTIONS.RIGHT.x + "," + DIRECTIONS.RIGHT.y]: 0,
        [DIRECTIONS.DOWN.x + "," + DIRECTIONS.DOWN.y]: 90,
        [DIRECTIONS.LEFT.x + "," + DIRECTIONS.LEFT.y]: 180,
        [DIRECTIONS.UP.x + "," + DIRECTIONS.UP.y]: 270
    };
    
    const rotation = rotationDegrees[gameState.pacman.direction.x + "," + gameState.pacman.direction.y];
    pacmanElement.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    
    const pacmanCell = gameBoard.children[gameState.pacman.y * GRID_SIZE + gameState.pacman.x];
    pacmanCell.appendChild(pacmanElement);
    
    // Add ghosts
    gameState.ghosts.forEach(ghost => {
        const ghostElement = document.createElement('div');
        ghostElement.classList.add('ghost', ghost.color);
        
        if (ghost.frightened) {
            ghostElement.classList.add('frightened');
        }
        
        const ghostCell = gameBoard.children[ghost.y * GRID_SIZE + ghost.x];
        ghostCell.appendChild(ghostElement);
    });
}

// Count the number of dots remaining
function countDotsRemaining() {
    gameState.dotsRemaining = 0;
    
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (gameState.grid[y][x] === CELL_TYPES.DOT || gameState.grid[y][x] === CELL_TYPES.POWER_DOT) {
                gameState.dotsRemaining++;
            }
        }
    }
}

// Update the game UI
function updateUI() {
    scoreElement.textContent = gameState.score;
    livesElement.textContent = gameState.lives;
    finalScoreElement.textContent = gameState.score;
}

// Check if the move is valid
function isValidMove(x, y) {
    return x >= 0 && x < GRID_SIZE && 
           y >= 0 && y < GRID_SIZE && 
           gameState.grid[y][x] !== CELL_TYPES.WALL;
}

// Move Pac-Man
function movePacman() {
    const nextX = gameState.pacman.x + gameState.pacman.nextDirection.x;
    const nextY = gameState.pacman.y + gameState.pacman.nextDirection.y;
    
    if (isValidMove(nextX, nextY)) {
        gameState.pacman.direction = gameState.pacman.nextDirection;
        gameState.pacman.x = nextX;
        gameState.pacman.y = nextY;
    } else {
        const currentDirX = gameState.pacman.x + gameState.pacman.direction.x;
        const currentDirY = gameState.pacman.y + gameState.pacman.direction.y;
        
        if (isValidMove(currentDirX, currentDirY)) {
            gameState.pacman.x = currentDirX;
            gameState.pacman.y = currentDirY;
        }
    }
    
    // Check for dots
    if (gameState.grid[gameState.pacman.y][gameState.pacman.x] === CELL_TYPES.DOT) {
        gameState.grid[gameState.pacman.y][gameState.pacman.x] = CELL_TYPES.EMPTY;
        gameState.score += 10;
        gameState.dotsRemaining--;
    } else if (gameState.grid[gameState.pacman.y][gameState.pacman.x] === CELL_TYPES.POWER_DOT) {
        gameState.grid[gameState.pacman.y][gameState.pacman.x] = CELL_TYPES.EMPTY;
        gameState.score += 50;
        gameState.dotsRemaining--;
        activateFrightMode();
    }
    
    updateUI();
    
    // Check if all dots are collected
    if (gameState.dotsRemaining === 0) {
        endGame(true);
    }
}

// Activate fright mode
function activateFrightMode() {
    gameState.frightMode = true;
    
    gameState.ghosts.forEach(ghost => {
        ghost.frightened = true;
        // Reverse direction when frightened
        ghost.direction = {
            x: -ghost.direction.x,
            y: -ghost.direction.y
        };
    });
    
    if (gameState.frightModeTimer) {
        clearTimeout(gameState.frightModeTimer);
    }
    
    // Add visual feedback, briefly flash the game area
    gameBoard.classList.add('power-activated');
    setTimeout(() => {
        gameBoard.classList.remove('power-activated');
    }, 500);
    
    gameState.frightModeTimer = setTimeout(() => {
        // Warn the player power is about to disappear
        gameBoard.classList.add('power-warning');
        setTimeout(() => {
            gameBoard.classList.remove('power-warning');
            gameState.frightMode = false;
            gameState.ghosts.forEach(ghost => {
                ghost.frightened = false;
            });
        }, 3000);
    }, 7000); // Total 10 seconds invincibility time
}

// Move ghosts
function moveGhosts() {
    // Move only a portion of the ghosts at a time, reducing difficulty
    gameState.ghosts.forEach((ghost, index) => {
        // In easy mode, ghosts move slower: only a certain chance of moving
        if (gameState.difficulty === 'easy') {
            if (Math.random() > 0.75) { // 25% chance of not moving
                return;
            }
        }
        
        // Determine possible directions
        const possibleDirections = [];
        
        for (const dir in DIRECTIONS) {
            const nextX = ghost.x + DIRECTIONS[dir].x;
            const nextY = ghost.y + DIRECTIONS[dir].y;
            
            if (isValidMove(nextX, nextY)) {
                // Avoid going back in the opposite direction (unless no other option)
                if (DIRECTIONS[dir].x !== -ghost.direction.x || DIRECTIONS[dir].y !== -ghost.direction.y) {
                    possibleDirections.push(DIRECTIONS[dir]);
                }
            }
        }
        
        // If no valid directions (except going back), allow going back
        if (possibleDirections.length === 0) {
            possibleDirections.push({
                x: -ghost.direction.x,
                y: -ghost.direction.y
            });
        }
        
        // Choose a random direction from the possible ones
        let targetDir;
        if (ghost.frightened) {
            // Random movement when frightened
            targetDir = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
            
            // In invincibility mode, ghosts will try to move away from Pac-Man
            if (Math.random() < 0.7) { // Increased chance of ghost running away
                targetDir = possibleDirections.reduce((farthest, dir) => {
                    const currentDist = Math.abs(gameState.pacman.x - (ghost.x + farthest.x)) + 
                                         Math.abs(gameState.pacman.y - (ghost.y + farthest.y));
                    const newDist = Math.abs(gameState.pacman.x - (ghost.x + dir.x)) + 
                                    Math.abs(gameState.pacman.y - (ghost.y + dir.y));
                    return newDist > currentDist ? dir : farthest;
                }, possibleDirections[0]);
            }
        } else {
            // Target Pac-Man when not frightened, with some randomness
            if (Math.random() < 0.6) { // Reduced chasing chance from 0.75 to 0.6
                // Choose the direction closest to Pac-Man
                targetDir = possibleDirections.reduce((closest, dir) => {
                    const currentDist = Math.abs(gameState.pacman.x - (ghost.x + closest.x)) + 
                                         Math.abs(gameState.pacman.y - (ghost.y + closest.y));
                    const newDist = Math.abs(gameState.pacman.x - (ghost.x + dir.x)) + 
                                    Math.abs(gameState.pacman.y - (ghost.y + dir.y));
                    return newDist < currentDist ? dir : closest;
                }, possibleDirections[0]);
            } else {
                // Sometimes move randomly
                targetDir = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
            }
        }
        
        ghost.direction = targetDir;
        ghost.x += ghost.direction.x;
        ghost.y += ghost.direction.y;
    });
    
    // Check for collisions with Pac-Man
    checkGhostCollisions();
}

// Check for ghost collisions
function checkGhostCollisions() {
    gameState.ghosts.forEach(ghost => {
        if (ghost.x === gameState.pacman.x && ghost.y === gameState.pacman.y) {
            if (ghost.frightened) {
                // Eat the ghost
                gameState.score += 200;
                updateUI();
                
                // Reset ghost position
                ghost.x = Math.floor(GRID_SIZE / 2);
                ghost.y = Math.floor(GRID_SIZE / 2);
                ghost.frightened = false;
            } else {
                // Lose a life
                gameState.lives--;
                updateUI();
                
                if (gameState.lives <= 0) {
                    endGame(false);
                } else {
                    resetPositions();
                }
            }
        }
    });
}

// Reset positions after losing a life
function resetPositions() {
    gameState.pacman.x = 1;
    gameState.pacman.y = 1;
    gameState.pacman.direction = DIRECTIONS.RIGHT;
    gameState.pacman.nextDirection = DIRECTIONS.RIGHT;
    
    gameState.ghosts = [
        { x: GRID_SIZE - 2, y: 1, direction: DIRECTIONS.LEFT, color: 'red', frightened: false },
        { x: 1, y: GRID_SIZE - 2, direction: DIRECTIONS.RIGHT, color: 'pink', frightened: false },
        { x: GRID_SIZE - 2, y: GRID_SIZE - 2, direction: DIRECTIONS.UP, color: 'cyan', frightened: false },
        { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2), direction: DIRECTIONS.DOWN, color: 'orange', frightened: false }
    ];
}

// Game loop
let gameInterval;

function gameLoop() {
    movePacman();
    moveGhosts();
    renderGameBoard();
}

// Start the game
function startGame() {
    if (!gameState.gameStarted) {
        gameState.gameStarted = true;
        startModal.classList.add('hidden');
        gameInterval = setInterval(gameLoop, gameState.gameSpeed); // Use dynamic game speed
    }
}

// End the game
function endGame(win) {
    gameState.gameOver = true;
    clearInterval(gameInterval);
    
    if (win) {
        finalScoreElement.textContent = gameState.score + " (You won!)";
    } else {
        finalScoreElement.textContent = gameState.score;
    }
    
    gameOverModal.classList.remove('hidden');
}

// Restart the game
function restartGame() {
    clearInterval(gameInterval);
    initGame();
    gameOverModal.classList.add('hidden');
    startModal.classList.remove('hidden');
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (!gameState.gameStarted || gameState.gameOver) return;
    
    switch (e.key) {
        case 'ArrowUp':
            gameState.pacman.nextDirection = DIRECTIONS.UP;
            break;
        case 'ArrowDown':
            gameState.pacman.nextDirection = DIRECTIONS.DOWN;
            break;
        case 'ArrowLeft':
            gameState.pacman.nextDirection = DIRECTIONS.LEFT;
            break;
        case 'ArrowRight':
            gameState.pacman.nextDirection = DIRECTIONS.RIGHT;
            break;
        case 'p': // Press P to pause/resume game
        case 'P':
            if (gameState.isPaused) {
                resumeGame();
            } else {
                pauseGame();
            }
            break;
        case 'h': // Press H to show help
        case 'H':
            showHelp();
            break;
        case 'Escape': // Press ESC to close help
            if (!helpModal.classList.contains('hidden')) {
                closeHelp();
            }
            break;
    }
});

// D-Pad button listeners
upBtn.addEventListener('click', () => {
    if (!gameState.gameStarted || gameState.gameOver) return;
    gameState.pacman.nextDirection = DIRECTIONS.UP;
});

downBtn.addEventListener('click', () => {
    if (!gameState.gameStarted || gameState.gameOver) return;
    gameState.pacman.nextDirection = DIRECTIONS.DOWN;
});

leftBtn.addEventListener('click', () => {
    if (!gameState.gameStarted || gameState.gameOver) return;
    gameState.pacman.nextDirection = DIRECTIONS.LEFT;
});

rightBtn.addEventListener('click', () => {
    if (!gameState.gameStarted || gameState.gameOver) return;
    gameState.pacman.nextDirection = DIRECTIONS.RIGHT;
});

// Help and tutorial button listeners
helpBtn.addEventListener('click', showHelp);
closeHelpBtn.addEventListener('click', closeHelp);

// Tutorial hint close button
if (closeTutorialBtn) {
    closeTutorialBtn.addEventListener('click', () => {
        tutorialMessage.classList.add('hidden');
        tutorialMessage.classList.add('manually-closed');
    });
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);

// Initialize the game when the page loads
window.addEventListener('load', initGame); 