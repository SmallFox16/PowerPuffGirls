// index.js

const gamespace = document.getElementById("gamespace");
const ball = document.getElementById("ball");
const paddle = document.getElementById("paddle");
const lifeElements = document.querySelectorAll(".life");

// ── Brick wall ────────────────────────────────────────────────────────────────
const brickContainer = document.getElementById("brickContainer");

// Named constants so layout can be adjusted in one place without
// hunting for magic numbers through the loop.
// Math: 10 * 60px + 9 * 7px + 8px offset = 671px (fits 725px canvas)
//       5 * 25px + 4 * 7px + 8px offset = 161px (fits 200px container)
const BRICK_COLS  = 10;
const BRICK_ROWS  = 5;
const BRICK_W     = 60;
const BRICK_H     = 25;
const BRICK_GAP   = 7;
const BRICK_OFF_X = 8;   // left margin so bricks don't touch the container edge
const BRICK_OFF_Y = 8;   // top margin so bricks don't touch the top of the container

// One color per row, indexed top-to-bottom.
// This is temporary just for visual feedback.
const ROW_COLORS = ["#DF414D", "#EF7B99", "#62C3AE", "#51BBE7", "#86D43A"];

// Declared at module scope so collision detection (PBI #28) can iterate
// this array on every frame without re-querying the DOM.
let bricks = [];

for(let r = 0; r < BRICK_ROWS; r++) {
    for(let c = 0; c < BRICK_COLS; c++) {
        const el = document.createElement("div");
        el.classList.add("brick");

        // Position is computed from row/col index so every brick lands
        // in the correct grid cell regardless of total rows or columns.
        const x = BRICK_OFF_X + c * (BRICK_W + BRICK_GAP);
        const y = BRICK_OFF_Y + r * (BRICK_H + BRICK_GAP);

        el.style.left            = x + "px";
        el.style.top             = y + "px";
        el.style.backgroundColor = ROW_COLORS[r];

        brickContainer.appendChild(el);

        // x and y are stored alongside the element so collision code
        // never needs to recalculate position from the DOM each frame.
        bricks.push({el: el, x: x, y: y, active: true});
    }
} // Generates 5 rows x 10 columns = 50 bricks into #brickContainer

// ── Dimensions ────────────────────────────────────────────────────────────────
const GAME_W = gamespace.clientWidth;
const GAME_H = gamespace.clientHeight;
const BALL_SIZE = ball.offsetWidth;
const PADDLE_W = paddle.offsetWidth;
const PADDLE_H = paddle.offsetHeight;
const PADDLE_SPEED = 400;

// ── State ─────────────────────────────────────────────────────────────────────
let ballX = GAME_W / 2 - BALL_SIZE / 2;
let ballY = GAME_H - 200 - BALL_SIZE;
let ballDX = 200;
let ballDY = -200;

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
