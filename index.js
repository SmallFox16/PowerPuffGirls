// index.js

const gamespace = document.getElementById("gamespace");
const ball = document.getElementById("ball");
const paddle = document.getElementById("paddle");

// ── Dimensions ────────────────────────────────────────────────────────────────
const GAME_W = gamespace.clientWidth;
const GAME_H = gamespace.clientHeight;
const BALL_SIZE = ball.offsetWidth;
const PADDLE_W = paddle.offsetWidth;
const PADDLE_H = paddle.offsetHeight;
const PADDLE_SPEED = 6;

// ── State ─────────────────────────────────────────────────────────────────────
let ballX = GAME_W / 2 - BALL_SIZE / 2;
let ballY = GAME_H - 200 - BALL_SIZE;
let ballDX = 3;
let ballDY = -3;

let paddleX = GAME_W / 2 - PADDLE_W / 2;

let keys = {};
let gameRunning = true;

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

// ── Helpers ───────────────────────────────────────────────────────────────────
function applyPositions() {
    ball.style.left      = ballX + "px";
    ball.style.bottom    = "unset";
    ball.style.top       = ballY + "px";
    ball.style.transform = "none";

    paddle.style.left      = paddleX + "px";
    paddle.style.transform = "none";
}

// ── Main loop ─────────────────────────────────────────────────────────────────
function update() {
    if (!gameRunning) return;

    // Paddle movement (arrow keys)
    if (keys["ArrowLeft"])  paddleX = Math.max(0, paddleX - PADDLE_SPEED);
    if (keys["ArrowRight"]) paddleX = Math.min(GAME_W - PADDLE_W, paddleX + PADDLE_SPEED);

    // Move ball
    ballX += ballDX;
    ballY += ballDY;

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
        const hitPos = (ballX + BALL_SIZE / 2 - paddleX) / PADDLE_W; // 0–1
        const angle  = (hitPos - 0.5) * 2;   // -1 to 1
        const speed  = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
        ballDX = angle * speed;
        ballDY = -Math.abs(ballDY);
    }

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
