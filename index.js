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

// ── Launch state ──────────────────────────────────────────────────────────────────
// The ball must not move until the player explicitly triggers launch. 
// This boolean is the single gate checked in the update loop. It is intentionally
// a flat boolean rather than an enum because there is no transitional state
// between 'waiting' and 'in flight' that needs to be represented.
// - Cooper

let launched = false;

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
// Checks entire array of bricks "bricks" against the ball's position to detect and handle collisions.
// Reflects the ball based on which face of the brick was hit (top/bottom vs left/right).
function ballBrickCollision(){
    for (const brick of bricks) {
        if (!brick.active) continue;
        const hit = ballX + BALL_SIZE > brick.x &&
                    ballX < brick.x + BRICK_W &&
                    ballY + BALL_SIZE > brick.y &&
                    ballY < brick.y + BRICK_H;
        if (hit) {
            // Determine which face the ball hit by comparing overlap depths.
            // The smallest overlap tells us which side the ball entered from.
            const overlapLeft   = (ballX + BALL_SIZE) - brick.x;
            const overlapRight  = (brick.x + BRICK_W) - ballX;
            const overlapTop    = (ballY + BALL_SIZE) - brick.y;
            const overlapBottom = (brick.y + BRICK_H) - ballY;

            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);

            if (minOverlapX < minOverlapY) {
                // Side hit — reverse horizontal direction
                ballDX *= -1;
            } else {
                // Top or bottom hit — reverse vertical direction
                ballDY *= -1;
            }

            brick.active = false;
            brick.el.classList.add('brickDestroyed');
            break; // early exit, ball can only hit one brick per frame
        }
    }
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

    // Paddle collision — angle-based reflection
    // The ball's outgoing angle depends on where it hits the paddle.
    // Center hit = straight up, edges = steep angles. This gives the
    // player skill-based control over the ball's trajectory.
    const BALL_SPEED = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
    const paddleTop = GAME_H - PADDLE_H;
    if (
        ballY + BALL_SIZE >= paddleTop &&
        ballY + BALL_SIZE <= paddleTop + PADDLE_H &&
        ballX + BALL_SIZE >= paddleX &&
        ballX <= paddleX + PADDLE_W
    ) {
        ballY = paddleTop - BALL_SIZE;

        // hitPos: 0.0 = left edge, 1.0 = right edge
        const ballCenter = ballX + BALL_SIZE / 2;
        const hitPos = (ballCenter - paddleX) / PADDLE_W;

        // Map to angle: -60° (left edge) to +60° (right edge)
        // 0° is straight up. Range keeps the ball playable (never goes flat).
        const MAX_ANGLE = Math.PI / 3; // 60 degrees
        const angle = (hitPos - 0.5) * 2 * MAX_ANGLE;

        ballDX =  BALL_SPEED * Math.sin(angle);
        ballDY = -BALL_SPEED * Math.cos(angle);
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
