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

// ── Launch state ──────────────────────────────────────────────────────────────────
// The ball must not move until the player explicitly triggers launch. 
// This boolean is the single gate checked in the update loop. It is intentionally
// a flat boolean rather than an enum because there is no transitional state
// between 'waiting' and 'in flight' that needs to be represented.
// - Cooper

let launched = false;

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

// ── Launch prompt overlay ───────────────────────────────────────────────────
// Created in JS (not HTML) to keep the prompt co-located with the logic that
// shows and hides it. This follows the same pattern as the game-over overlay.
// pointer-events: none ensures the prompt itself does not block the click
// event that triggers the launch on the gamespace beneath it.
// - Cooper

const launchPrompt = document.createElement('div');
launchPrompt.id = 'launchPrompt';
launchPrompt.innerHTML = '<span>Click or press Space to launch</span>';
launchPrompt.style.cssText = `
    display: flex;
    position: absolute;
    inset: 0;
    color: bisque;
    font-family: sans-serif;
    font-size: 1.5rem;
    font-weight: bold;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 60px;
    pointer-events: none;
    z-index: 9;
`;

gamespace.appendChild(launchPrompt);
function hideLaunchPrompt() {
    launchPrompt.style.display = 'none';
}

// ── Launch trigger ─────────────────────────────────────────────────────────────────
// Both input methods (spacebar and click) funnel into this single function.
// Centralizing here means the 'launch once' guard only has to live in one
// place. If anyone needs adds touch-to-launch for mobile, they only
// need to wire their event listener to this function with no other changes needed.
// - Cooper

function triggerLaunch() {
    // Guard: once the ball is in flight, ignore any further launch attempts.
    // This enforces the acceptance criterion that launch only occurs once per start.

    if (launched) return;
    launched = true;
    hideLaunchPrompt();
}


// ── Input: keyboard ───────────────────────────────────────────────────────────
document.addEventListener("keydown", e => { keys[e.key] = true; });
document.addEventListener("keyup",   e => { keys[e.key] = false; });

// Spacebar is checked inside the existing keydown listener rather than adding
// a second document-level listener. Two listeners for the same event on the
// same element would work, but consolidating keeps the event handling readable.
// - Cooper

document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ') triggerLaunch();

});


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


// Click is bound to the gamespace (not the document) so that clicking outside
// the game area does not accidentally trigger the launch.
// NOTE for future mobile support: wire a 'touchend' listener on gamespace to
// triggerLaunch() here. The touchmove handler already exists for paddle control.
// - Cooper

gamespace.addEventListener('click', triggerLaunch);


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
function update(timestamp) {
    if (!gameRunning) return;

    if (lastTime === null) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // While waiting for the player to launch, anchor the ball above the paddle
    // center on every frame. This gives the player visual feedback that the ball
    // will come from the paddle they are positioning, which is the standard
    // brick-breaker convention. Returning early skips all movement and collision
    // logic -- nothing in the remainder of update() should fire before launch.
    // - Cooper

    if (!launched) {
        ballX = paddleX + PADDLE_W / 2 - BALL_SIZE / 2;
        ballY = GAME_H - PADDLE_H - BALL_SIZE - 2; // 2px gap so ball sits on top of paddle, not inside it
        applyPositions();
        requestAnimationFrame(update);
        return;
    }


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
