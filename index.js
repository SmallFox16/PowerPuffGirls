// index.js

const gamespace = document.getElementById("gamespace");
const ball = document.getElementById("ball");
const paddle = document.getElementById("paddle");
const lifeElements = document.querySelectorAll(".life");
const brick1 = document.getElementById('brick1');

// ── Dimensions ────────────────────────────────────────────────────────────────
const GAME_W = gamespace.clientWidth;
const GAME_H = gamespace.clientHeight;
const BALL_SIZE = ball.offsetWidth;
const PADDLE_W = paddle.offsetWidth;
const PADDLE_H = paddle.offsetHeight;
const PADDLE_SPEED = 400;

const BRICK_W = brick1.offsetWidth;
const BRICK_H = brick1.offsetHeight;
const brick1X = brick1.offsetLeft + document.getElementById('brickContainer').offsetLeft - BRICK_W / 2;
const brick1Y = brick1.offsetTop + document.getElementById('brickContainer').offsetTop;

// ── State ─────────────────────────────────────────────────────────────────────
let ballX = GAME_W / 2 - BALL_SIZE / 2;
let ballY = GAME_H - 200 - BALL_SIZE;
let ballDX = 200;
let ballDY = -200;
let brick1Alive = true;

let paddleX = GAME_W / 2 - PADDLE_W / 2;

let keys = {};
let gameRunning = true;
let lastTime = null;

let lives = 3;

// ── Game Over overlay ─────────────────────────────────────────────────────────
const overlay = document.createElement("div");
overlay.id = "gameOverOverlay";
overlay.innerHTML = "<span>GAME OVER</span>";
overlay.style.cssText = `
    display: none;
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    color: bisque;
    font-family: sans-serif;
    font-size: 3rem;
    font-weight: bold;
    letter-spacing: 0.15em;
    align-items: center;
    justify-content: center;
    z-index: 10;
`;
gamespace.appendChild(overlay);

function showGameOver() {
    overlay.style.display = "flex";
}

// ── Input: keyboard ───────────────────────────────────────────────────────────
document.addEventListener("keydown", e => { keys[e.key] = true; });
document.addEventListener("keyup",   e => { keys[e.key] = false; });

// ── Input: touch drag ─────────────────────────────────────────────────────────
let lastTouchX = null;
gamespace.addEventListener("touchstart", e => {
    lastTouchX = e.touches[0].clientX;
}, { passive: true });
gamespace.addEventListener("touchmove", e => {
    if (lastTouchX === null) return;
    const dx = e.touches[0].clientX - lastTouchX;
    lastTouchX = e.touches[0].clientX;
    paddleX = Math.max(0, Math.min(GAME_W - PADDLE_W, paddleX + dx));
}, { passive: true });
gamespace.addEventListener("touchend", () => { lastTouchX = null; }, { passive: true });

// ── Input: mouse ─────────────────────────────────────────────────────────────
gamespace.addEventListener("mousemove", e => {
    const rect = gamespace.getBoundingClientRect();
    paddleX = Math.max(0, Math.min(GAME_W - PADDLE_W, e.clientX - rect.left - PADDLE_W / 2));
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function applyPositions() {
    ball.style.left      = ballX + "px";
    ball.style.bottom    = "unset";
    ball.style.top       = ballY + "px";
    ball.style.transform = "none";

    paddle.style.left      = paddleX + "px";
    paddle.style.transform = "none";
}

function updateLivesDisplay() {
    for (let i = 0; i < lifeElements.length; i++) {
        if (i < lives) {
            lifeElements[i].classList.remove("lifeLost");
        } else {
            lifeElements[i].classList.add("lifeLost");
        }
    }
} // Tracks number of lives for the display

function loseLife() {
    if (lives > 0) {
        lives--;
        updateLivesDisplay();
    }

    if (lives === 0) {
        showGameOver();
    }
} // Allows for display to change if life lost, triggers game over at 0 lives

function updateLivesDisplay() {
    for (let i = 0; i < lifeElements.length; i++) {
        if (i < lives) {
            lifeElements[i].classList.remove("lifeLost");
        } else {
            lifeElements[i].classList.add("lifeLost");
        }
    }
} // Tracks number of lives for the display

function loseLife() {
    if (lives > 0) {
        lives--;
        updateLivesDisplay();
    }

    if (lives === 0) {
        showGameOver();
    }
} // Allows for display to change if life lost, triggers game over at 0 lives

// Brick-Ball collision handler function. Auggie 4/19
// Checks if ball hitbox and brick are overlapping when called.
// If overlapping, bounces ball. 
// TODO: Brick removal should be added here later. I added an alive state for collision but it needs a visual 
// indication for brick destruction.
function ballBrickCollision(){
    if (!brick1Alive) return;
    const hit = ballX + BALL_SIZE > brick1X &&
        ballX < brick1X + BRICK_W &&
        ballY + BALL_SIZE > brick1Y &&
        ballY < brick1Y + BRICK_H;
    if (hit) {
        ballDY *= -1; // TODO: replace with angle-based bounce logic
        brick1Alive = false;
    }
}
// ── Main loop ─────────────────────────────────────────────────────────────────
function update(timestamp) {
    if (!gameRunning) return;

    if (lastTime === null) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Paddle movement (arrow keys)
    if (keys["ArrowLeft"])  paddleX = Math.max(0, paddleX - PADDLE_SPEED * dt);
    if (keys["ArrowRight"]) paddleX = Math.min(GAME_W - PADDLE_W, paddleX + PADDLE_SPEED * dt);

    // Move ball
    ballX += ballDX * dt;
    ballY += ballDY * dt;

    // Wall collisions (left / right)
    if (ballX <= 0) {
        ballX = 0;
        ballDX = Math.abs(ballDX);
    } else if (ballX + BALL_SIZE >= GAME_W) {
        ballX = GAME_W - BALL_SIZE;
        ballDX = -Math.abs(ballDX);
    }

    // Ceiling collision (top)
    if (ballY <= 0) {
        ballY = 0;
        ballDY = Math.abs(ballDY);
    }

    // Paddle collision
    const paddleTop = GAME_H - PADDLE_H;
    if (
        ballY + BALL_SIZE >= paddleTop &&
        ballY + BALL_SIZE <= paddleTop + PADDLE_H &&
        ballX + BALL_SIZE >= paddleX &&
        ballX <= paddleX + PADDLE_W
    ) {
        ballY = paddleTop - BALL_SIZE;
        ballDY = -Math.abs(ballDY);
    }
    
    // Brick collision
    ballBrickCollision();

    // Ball out of bounds
    if (ballY > GAME_H) {
        gameRunning = false;
        showGameOver();
        return;
    }

    applyPositions();
    requestAnimationFrame(update);
}

// ── Start ─────────────────────────────────────────────────────────────────────
applyPositions();
requestAnimationFrame(update);
