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
const BRICK_COLS  = 8;
const BRICK_ROWS  = 5;
const BRICK_W     = 60;
const BRICK_H     = 25;
const BRICK_GAP   = 7;
const BRICK_OFF_X = 60;  // ~1 brick width inset from each side
const BRICK_OFF_Y = 58;  // ~2 brick heights below the ceiling

// One PPG palette color per row, top-to-bottom.
const ROW_COLORS = ["#df414d", "#f5d742", "#62c3ae", "#51bbe7", "#86d43a"];

// Declared at module scope so collision detection (PBI #28) can iterate
// this array on every frame without re-querying the DOM.
let bricks = [];

// Odd rows are shifted right by half a brick+gap to create a staggered
// brick wall pattern. The container clips any overflow at the edges.
const BRICK_STEP  = BRICK_W + BRICK_GAP; // horizontal distance between brick starts
const BRICK_SHIFT = BRICK_STEP / 2;      // 50% offset for odd rows


// ── Level 1 Brick layout ──────────────────────────────────────────────────────
function buildLevel1() {
    for (let r = 0; r < BRICK_ROWS; r++) {
        const isOddRow = r % 2 === 1;
        const rowOffset = isOddRow ? BRICK_SHIFT : 0;

        for (let c = 0; c < BRICK_COLS; c++) {
            const el = document.createElement("div");
            el.classList.add("brick");

            const x = BRICK_OFF_X + c * BRICK_STEP + rowOffset;
            const y = BRICK_OFF_Y + r * (BRICK_H + BRICK_GAP);

            el.style.left = x + "px";
            el.style.top  = y + "px";
            const color = ROW_COLORS[r];
            el.style.background = `linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 45%), ${color}`;

            brickContainer.appendChild(el);
            bricks.push({ el: el, x: x, y: y, active: true });
        }
    }
} // Generates 5 rows x 8 columns = 40 bricks in staggered brick wall layout

// ── Level 2 Brick layout — Level 1 layout + armored bricks ───────────────────
// Same staggered full grid as Level 1.
// Bricks marked in TOUGH_L2 require two hits — shown with a stripe + crack visual.
function buildLevel2() {
    // "r-c" positions that are 2-hit bricks — spread across the grid
    const TOUGH_L2 = new Set([
        "0-1","0-5",
        "1-3","1-6",
        "2-0","2-4",
        "3-2","3-7",
        "4-4",
    ]);

    for (let r = 0; r < BRICK_ROWS; r++) {
        const rowOffset = (r % 2 === 1) ? BRICK_SHIFT : 0;
        for (let c = 0; c < BRICK_COLS; c++) {
            const el = document.createElement("div");
            el.classList.add("brick");

            const x = BRICK_OFF_X + c * BRICK_STEP + rowOffset;
            const y = BRICK_OFF_Y + r * (BRICK_H + BRICK_GAP);
            el.style.left = x + "px";
            el.style.top  = y + "px";

            const isTough = TOUGH_L2.has(`${r}-${c}`);
            const color   = ROW_COLORS[r];

            el.style.background = `
                linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 45%),
                linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%),
                ${color}
            `;

            if (isTough) el.classList.add("brick-tough");

            brickContainer.appendChild(el);
            bricks.push({ el, x, y, active: true, hits: isTough ? 2 : 1 });
        }
    }
}


// ── Level 3 Brick layout — Full grid + heavy armour ───────────────────────────
// Same staggered full grid as Level 1 & 2.
// ~18 bricks are 2-hit (vs 9 in Level 2), spread so every row has armoured bricks.
function buildLevel3() {
    const TOUGH_L3 = new Set([
        "0-0","0-3","0-5","0-7",
        "1-1","1-4","1-6",
        "2-2","2-4","2-5","2-7",
        "3-0","3-2","3-5","3-7",
        "4-1","4-3","4-6",
    ]);

    for (let r = 0; r < BRICK_ROWS; r++) {
        const rowOffset = (r % 2 === 1) ? BRICK_SHIFT : 0;
        for (let c = 0; c < BRICK_COLS; c++) {
            const el = document.createElement("div");
            el.classList.add("brick");

            const x = BRICK_OFF_X + c * BRICK_STEP + rowOffset;
            const y = BRICK_OFF_Y + r * (BRICK_H + BRICK_GAP);
            el.style.left = x + "px";
            el.style.top  = y + "px";

            const isTough = TOUGH_L3.has(`${r}-${c}`);
            const color   = ROW_COLORS[r];

            el.style.background = `
                linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 45%),
                linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%),
                ${color}
            `;

            if (isTough) el.classList.add("brick-tough");

            brickContainer.appendChild(el);
            bricks.push({ el, x, y, active: true, hits: isTough ? 2 : 1 });
        }
    }
}


// ── Level 4 Brick layout ──────────────────────────────────────────────────────
function buildLevel4() {
    for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {

            const isEdge =
                r === 0 ||
                r === BRICK_ROWS - 1 ||
                c === 0 ||
                c === BRICK_COLS - 1;

            if (!isEdge) continue;

            const el = document.createElement("div");
            el.classList.add("brick");

            const x = BRICK_OFF_X + c * BRICK_STEP;
            const y = BRICK_OFF_Y + r * (BRICK_H + BRICK_GAP);

            el.style.left = x + "px";
            el.style.top  = y + "px";

            const isTough = (r === 0 || r === BRICK_ROWS - 1);

            if (isTough) el.classList.add("brick-tough");

            el.style.background = ROW_COLORS[r];

            brickContainer.appendChild(el);
            bricks.push({ el, x, y, active: true, hits: isTough ? 2 : 1 });
        }
    }
}


// ── Level 5 Brick layout ──────────────────────────────────────────────────────
function buildLevel5() {
    for (let r = 0; r < BRICK_ROWS; r++) {
        const startCol = Math.floor(r / 2);
        const endCol = BRICK_COLS - startCol;

        for (let c = startCol; c < endCol; c++) {
            const el = document.createElement("div");
            el.classList.add("brick");

            const x = BRICK_OFF_X + c * BRICK_STEP;
            const y = BRICK_OFF_Y + r * (BRICK_H + BRICK_GAP);

            el.style.left = x + "px";
            el.style.top  = y + "px";

            const isTough = (r === 0 || c === startCol || c === endCol - 1);

            if (isTough) el.classList.add("brick-tough");

            el.style.background = ROW_COLORS[r];

            brickContainer.appendChild(el);
            bricks.push({ el, x, y, active: true, hits: isTough ? 2 : 1 });
        }
    }
}


// ── Level loader ──────────────────────────────────────────────────────────────
// Wipes the existing brick DOM and array, then builds the requested level.
// Called on first load and after each level is cleared.
const TOTAL_LEVELS = 5;
let currentLevel = 1;

function loadLevel(n) {
    brickContainer.innerHTML = "";
    bricks = [];
    switch (n) {
        case 1: buildLevel1(); break;
        case 2: buildLevel2(); break;
        case 3: buildLevel3(); break;
        case 4: buildLevel4(); break;
        case 5: buildLevel5(); break;
    }
}

loadLevel(currentLevel);


// ── Dimensions ────────────────────────────────────────────────────────────────
const GAME_W = gamespace.clientWidth;
const GAME_H = gamespace.clientHeight;
const BALL_SIZE = ball.offsetWidth;
const PADDLE_W = paddle.offsetWidth;
const PADDLE_H = paddle.offsetHeight;
const PADDLE_SPEED = 400;
const PADDLE_GAP = 10;


// ── State ─────────────────────────────────────────────────────────────────────
let ballX = GAME_W / 2 - BALL_SIZE / 2;
let ballY = GAME_H - 200 - BALL_SIZE;
let ballDX = 200;
let ballDY = -200;

let paddleX = GAME_W / 2 - PADDLE_W / 2;

let keys = {};

// Keys captured here are ignored by the keydown handler until the player
// physically releases them. Used by restartGame() so that a key held at the
// moment of restart (e.g. ArrowLeft, causing the paddle to be in motion when
// the player paused) does not immediately resume moving the paddle the
// instant restart finishes. The OS fires keydown auto-repeat while a key is
// held, so simply clearing keys[] in restartGame() is not enough — the next
// auto-repeat would refill it. keyup clears the suppression so the player
// can re-press normally afterwards.
let suppressedKeys = new Set();

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

// ── Pause state ───────────────────────────────────────────────────────────────
// Tracks whether the player has paused the game mid-round. Checked in the
// update loop as a second gate alongside gameRunning. Kept as a flat boolean
// for the same reason as 'launched' — there is no intermediate state between
// playing and paused that needs to be represented.
// resumeGame() is responsible for re-entering the loop when this flips back.
// - Cooper 4/20/2026
let paused = false;


// ── Game Over overlay ─────────────────────────────────────────────────────────
const overlay = document.createElement("div");
overlay.id = "gameOverOverlay";
overlay.innerHTML = "<span>GAME OVER</span>";
overlay.style.cssText = `
    display: none;
    position: absolute;
    inset: 0;
    background: rgba(247, 207, 217, 0.8);
    color: #3a2a3f;
    font-family: sans-serif;
    font-size: 3rem;
    font-weight: bold;
    letter-spacing: 0.15em;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    z-index: 10;
`;
gamespace.appendChild(overlay);

function showGameOver() {
    overlay.style.display = "flex";
}

// ── Win overlay ──────────────────────────────────────────────────────────────
const winOverlay = document.createElement("div");
winOverlay.id = "winOverlay";
winOverlay.innerHTML = "<span>YOU WIN!</span>";
winOverlay.style.cssText = `
    display: none;
    position: absolute;
    inset: 0;
    background: rgba(247, 207, 217, 0.8);
    color: #3a2a3f;
    font-family: sans-serif;
    font-size: 3rem;
    font-weight: bold;
    letter-spacing: 0.15em;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    z-index: 10;
`;
gamespace.appendChild(winOverlay);

function showWin() {
    winOverlay.style.display = "flex";
}

// ── Level transition overlay ──────────────────────────────────────────────────
const levelOverlay = document.createElement("div");
levelOverlay.id = "levelOverlay";
levelOverlay.style.cssText = `
    display: none;
    position: absolute;
    inset: 0;
    background: rgba(247, 207, 217, 0.8);
    color: #3a2a3f;
    font-family: sans-serif;
    font-size: 3rem;
    font-weight: bold;
    letter-spacing: 0.15em;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    z-index: 10;
`;
gamespace.appendChild(levelOverlay);

function showLevelTransition(n, callback) {
    levelOverlay.innerHTML = `<span>LEVEL ${n}</span>`;
    levelOverlay.style.display = "flex";
    setTimeout(() => {
        levelOverlay.style.display = "none";
        callback();
    }, 1500);
}

function checkWin() {
    if (!bricks.every(brick => !brick.active)) return false;

    if (currentLevel >= TOTAL_LEVELS) {
        gameRunning = false;
        showWin();
        return true;
    }

    currentLevel++;
    gameRunning = false;

    showLevelTransition(currentLevel, () => {
        loadLevel(currentLevel);
        resetBallForLaunch();
        gameRunning = true;
        lastTime = null;
        requestAnimationFrame(update);
    });

    return true;
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
    color: #3a2a3f;
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

// ── Pause overlay ─────────────────────────────────────────────────────────────
// Created in JS to stay co-located with the pause/resume logic that controls it,
// consistent with the game-over and launch prompt overlay pattern.
// Contains three buttons: Resume (functional), Restart and Main Menu (stubs).
// Restart and Main Menu are intentionally empty — they are placeholders for
// future PBIs. The button elements exist so those PBIs have a clear hook point
// without needing to restructure this overlay.
// -Cooper 4/20/2026
const pauseOverlay = document.createElement("div");
pauseOverlay.id = "pauseOverlay";
pauseOverlay.style.cssText = `
    display: none;
    position: absolute;
    inset: 0;
    background: rgba(247, 207, 217, 0.92);
    color: #3a2a3f;
    font-family: sans-serif;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    border-radius: 12px;
    z-index: 10;
`;
 
const pauseTitle = document.createElement("div");
pauseTitle.textContent = "PAUSED";
pauseTitle.style.cssText = `
    font-size: 3rem;
    font-weight: bold;
    letter-spacing: 0.15em;
    margin-bottom: 8px;
`;
 
// Shared button style string — defined once and reused across all three buttons
// so that visual changes only need to be made in one place.
const pauseBtnStyle = `
    width: 200px;
    padding: 12px 0;
    font-size: 1rem;
    font-weight: bold;
    font-family: sans-serif;
    border-radius: 999px;
    border: 2.5px solid #3a2a3f;
    cursor: pointer;
    letter-spacing: 0.08em;
    background: #3a2a3f;
    color: #fba5d0;
`;
 
const resumeBtn = document.createElement("button");
resumeBtn.textContent = "RESUME";
resumeBtn.style.cssText = pauseBtnStyle;
resumeBtn.addEventListener("click", resumeGame);
 
const restartBtn = document.createElement("button");
restartBtn.textContent = "RESTART";
restartBtn.style.cssText = pauseBtnStyle;
restartBtn.addEventListener("click", restartGame);
 
const mainMenuBtn = document.createElement("button");
mainMenuBtn.textContent = "MAIN MENU";
mainMenuBtn.style.cssText = pauseBtnStyle;
mainMenuBtn.addEventListener("click", () => {
    // TODO: Implement main menu navigation (future PBI).
    // Navigate the player to the main menu screen when it exists.
    // Consider whether unsaved progress or high scores need to be handled here.
});
 
pauseOverlay.appendChild(pauseTitle);
pauseOverlay.appendChild(resumeBtn);
pauseOverlay.appendChild(restartBtn);
pauseOverlay.appendChild(mainMenuBtn);
gamespace.appendChild(pauseOverlay);

// Stop clicks on the pause overlay from bubbling up to the gamespace click
// handler (which calls triggerLaunch). Without this, clicking RESTART would
// fire restartGame() — which sets launched = false — and then the same click
// would bubble to gamespace, flipping launched back to true and auto-firing
// the ball the moment the overlay disappears. Attaching here on the overlay
// itself covers all current and future buttons inside it.
pauseOverlay.addEventListener("click", e => e.stopPropagation());

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

// ── Pause / resume logic ──────────────────────────────────────────────────────
// togglePause() is the single entry point for both the Escape key and the
// on-screen pause button. It delegates to pauseGame() or resumeGame() depending
// on current state. resumeGame() is also called directly by the Resume button
// inside the pause overlay, which is why it exists as a named function rather
// than being inlined inside togglePause().
// -Cooper 4/20/2026
function pauseGame() {
    // Guard: only allow pausing if the game is actively running and the ball is
    // in flight. Pausing before launch or after game over would leave the game
    // in a broken state where the loop never restarts.
    if (!gameRunning || !launched) return;
    paused = true;
    pauseOverlay.style.display = "flex";
}
 
function resumeGame() {
    paused = false;
    pauseOverlay.style.display = "none";
    // Reset lastTime so the first frame after resuming calculates a normal dt.
    // Without this, dt would equal the full duration of the pause (potentially
    // many seconds), launching the ball across the canvas in a single frame.
    lastTime = null;
    requestAnimationFrame(update);
}
 
function togglePause() {
    // Guard: do nothing if the game is over or the ball hasn't launched yet.
    // This prevents Escape from opening the pause screen on the end-state overlays.
    if (!gameRunning || !launched) return;
    if (paused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

// ── Ball respawn helper ──────────────────────────────────────────────────────
// Shared by life loss, level transitions, and the pause-menu restart. Each of
// those flows previously inlined the same four assignments to send the ball
// back to the paddle for re-launch. Centralising here means the next change
// to spawn velocity or to the launch-prompt overlay only needs editing in
// one place.
//
// Deliberately does NOT recentre paddleX: life loss and level transitions
// leave the paddle wherever the player last had it, which is friendlier than
// yanking it to the centre mid-run. restartGame() handles paddle re-centring
// itself because a full game restart is the one flow where re-centring is
// appropriate.
//
// Anchors ballX / ballY to the current paddle position eagerly. The update
// loop's !launched branch already re-anchors on every frame, but doing it
// here as well removes the one-frame window where applyPositions() (called
// by both restartGame() and the level-transition callback) would otherwise
// render the ball at its previous mid-flight position before the next frame
// snaps it back. Without this, restart leaves the ball visibly stuck at its
// pre-restart coordinates for ~16ms, which reads as "the ball didn't reset".
function resetBallForLaunch() {
    launched = false;
    ballDX = 200;
    ballDY = -200;
    ballX = paddleX + PADDLE_W / 2 - BALL_SIZE / 2;
    ballY = GAME_H - PADDLE_H - BALL_SIZE - PADDLE_GAP - 2;
    launchPrompt.style.display = "flex";
}

// ── Restart game ─────────────────────────────────────────────────────────────
// Wired to the RESTART button inside the pause overlay. Returns the game to
// the same state it would be in on a fresh page load: Level 1, three lives,
// freshly built brick wall, paddle centred, ball anchored above it awaiting
// launch.
//
// Hides the game-over and win overlays defensively, even though they cannot
// currently be visible while the pause overlay is open. This keeps
// restartGame() ready to be wired into those overlays in a follow-up PBI
// without restructuring this function.
//
// The rAF loop must be re-kicked here: the update loop's pause guard exits
// the loop on its own when the player pauses, and resumeGame() is the only
// path that restarts it. Without requestAnimationFrame(update) below the game
// would appear frozen after the overlay disappears. lastTime = null prevents
// the first post-restart frame from computing dt against a stale timestamp
// from before the pause, which would otherwise launch the ball across the
// canvas in a single frame (same reasoning as resumeGame()).
//
// keys = {} clears any held movement keys so the paddle does not drift on
// its own after restart. The player must re-press to keep moving.
function restartGame() {
    currentLevel = 1;
    loadLevel(currentLevel);

    lives = 3;
    updateLivesDisplay();

    paddleX = GAME_W / 2 - PADDLE_W / 2;
    resetBallForLaunch();

    // Mark every currently-held key as suppressed before clearing keys[].
    // Without the suppression set, OS keydown auto-repeat would immediately
    // refill keys[] for any key the player still has physically held (most
    // commonly ArrowLeft / ArrowRight), and the paddle would resume moving
    // the moment the player launches the new game.
    for (const k in keys) {
        if (keys[k]) suppressedKeys.add(k);
    }
    keys = {};

    paused = false;
    gameRunning = true;
    lastTime = null;

    pauseOverlay.style.display = "none";
    overlay.style.display = "none";
    winOverlay.style.display = "none";
    levelOverlay.style.display = "none";

    applyPositions();
    requestAnimationFrame(update);
}

// ── Skip level (dev / testing shortcut) ──────────────────────────────────────
// Press W to instantly clear the current level and advance to the next.
// On the final level it triggers the win screen instead.
function skipToNextLevel() {
    if (!gameRunning) return;
    bricks.forEach(b => {
        b.active = false;
        b.el.classList.add('brickDestroyed');
    });
    checkWin();
}

// ── Input: keyboard ───────────────────────────────────────────────────────────
// All key-triggered actions are consolidated into a single keydown listener.
// A separate listener only for key tracking (keys[]) is kept for the held-key
// paddle movement in the update loop. Escape and Space are one-shot actions
// that do not need to be in the keys map.
document.addEventListener("keydown", e => {
    // Held-key suppression: if restart fired while this key was already held,
    // the OS will keep auto-repeating keydown for it. Ignore those repeats
    // until the player physically releases and re-presses the key.
    if (suppressedKeys.has(e.key)) return;
    keys[e.key] = true;
if (e.key === " ")                   triggerLaunch();
        if (e.key === "Escape")              togglePause();
        if (e.key === "w" || e.key === "W")  skipToNextLevel();
});
document.addEventListener("keyup", e => {
    keys[e.key] = false;
    suppressedKeys.delete(e.key);
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
    paddle.style.top       = (GAME_H - PADDLE_H - PADDLE_GAP) + "px"; // Auggie 4/19 this raises the paddle.
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
    lives--;
    updateLivesDisplay();

    if (lives <= 0) {
        gameRunning = false;
        showGameOver();
        return;
    }

    resetBallForLaunch();
}

// ── Brick-Ball collision handler ──────────────────────────────────────────────
// Handles both single-hit and multi-hit bricks.
// On first hit of a 2-hit brick: decrement hits, show cracked visual, no destroy.
// On final hit (hits reaches 0): destroy as normal.
function ballBrickCollision() {
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

            // Default hits to 1 for any brick that pre-dates this system
            if (brick.hits == null) brick.hits = 1;
            brick.hits--;

            if (brick.hits <= 0) {
                // Fully destroyed
                brick.active = false;
                brick.el.classList.remove('brick-tough', 'brick-damaged');
                brick.el.classList.add('brickDestroyed');
            } else {
                // First hit on a 2-hit brick — strip armour, looks like a normal brick
                brick.el.classList.remove('brick-tough');
            }

            break; // early exit, ball can only hit one brick per frame
        }
    }
}

// ── Main loop ─────────────────────────────────────────────────────────────────
function update(timestamp) {
    if (!gameRunning) return;

    // Pause gate: if the player has paused, drop out of the loop entirely.
    // resumeGame() restarts requestAnimationFrame when the player resumes,
    // so the loop re-enters cleanly without needing a flag to skip frames.
    // -Cooper 4/20/2026
    if (paused) return;

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
        ballY = GAME_H - PADDLE_H - BALL_SIZE - PADDLE_GAP - 2; // 2px gap so ball sits on top of paddle, not inside it
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
    const BALL_SPEED = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
    const paddleTop = GAME_H - PADDLE_H - PADDLE_GAP;
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

    // Check if all bricks are destroyed — player wins
    if (checkWin()) return;

    // Ball out of bounds — lose a life and reset to paddle
    if (ballY > GAME_H) {
        loseLife();
        if (!gameRunning) return;
        applyPositions();
        requestAnimationFrame(update);
        return;
    }

    applyPositions();
    requestAnimationFrame(update);
}

// ── Start ─────────────────────────────────────────────────────────────────────
applyPositions();
requestAnimationFrame(update);
