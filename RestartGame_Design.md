# Restart Game — Design Document

## Overview

The pause overlay currently exposes a `RESTART` button wired to a no-op handler
(`index.js:464-470`). This document specifies the design for that handler.

The behaviour is **Restart Game**, not "Restart Level": clicking `RESTART`
returns the game to exactly the state it would be in on a fresh page load —
Level 1, three lives, freshly built brick wall, ball anchored to the paddle
awaiting launch. The button's text (`RESTART`) and visual styling are
unchanged; only its click handler is implemented.

## User-facing behaviour

When the player clicks `RESTART` from the pause overlay:

1. The pause overlay is dismissed.
2. The game returns to Level 1 with three lives.
3. The brick wall is rebuilt with the Level 1 layout — no destroyed bricks
   remain from the previous run.
4. The paddle returns to the centre of the gamespace and the ball is anchored
   on top of it, not moving.
5. The "Click or press Space to launch" prompt is visible.
6. Gameplay proceeds normally from that point — paddle responds to input, the
   ball launches when the player triggers it, and the loop runs at full speed.

## State reset

Reset values match the values used at initial page load. The table below maps
each piece of state to its definition site so reviewers can verify nothing is
missed when the implementation lands.

| State              | Definition site                                       | Reset value                |
|--------------------|-------------------------------------------------------|----------------------------|
| `currentLevel`     | `index.js:211`                                        | `1`                        |
| Brick wall (DOM + `bricks`) | `index.js:9, 28`, built by `loadLevel()` at `index.js:213` | rebuild via `loadLevel(1)` |
| `lives`            | `index.js:259`                                        | `3`                        |
| Lives DOM          | `index.js:6`, refreshed by `updateLivesDisplay()` at `index.js:607` | refresh after `lives = 3` |
| `ballX`, `ballY`   | `index.js:239-240`                                    | initial spawn position     |
| `ballDX`, `ballDY` | `index.js:241-242`                                    | `200`, `-200`              |
| `paddleX`          | `index.js:244`                                        | centred                    |
| `launched`         | `index.js:257`                                        | `false`                    |
| `gameRunning`      | `index.js:247`                                        | `true`                     |
| `paused`           | `index.js:268`                                        | `false`                    |
| `lastTime`         | `index.js:248`                                        | `null`                     |
| `keys`             | `index.js:246`                                        | `{}`                       |

Overlays:
- Hide: `pauseOverlay`, `overlay` (game over), `winOverlay`, `levelOverlay`.
- Show: `launchPrompt`.

Loop:
- Re-kick via `requestAnimationFrame(update)`. The loop is suspended when
  `paused` is `true` (`index.js:691`) and when `gameRunning` is `false`
  (`index.js:685`), so restart MUST re-enter the loop or the game will appear
  frozen after the overlay disappears.

## Implementation outline

Two new functions, both placed in the pause section of `index.js` to stay
co-located with the pause/resume logic that motivates them.

### `resetBallForLaunch()` — extracted from existing code

The same "reset velocity, clear `launched`, show launch prompt" sequence is
currently duplicated in two in-game flows:

- `loseLife()` — `index.js:628-631`
- the level-transition callback inside `checkWin()` — `index.js:364-367`

`resetBallForLaunch()` consolidates those two. Each call site is updated to
call the helper instead of inlining the same four assignments.

The helper deliberately does NOT recentre `paddleX`. Both pre-existing call
sites leave the paddle where the player last had it — yanking it to the
centre on every life loss or level transition would be more punishing than
useful. `restartGame()` handles paddle re-centring itself, since a full game
restart is the one flow where re-centring is appropriate.

(The initial state declarations at `index.js:239-247, 257` use `let` with
literal values and are not consolidated. They could be rewritten to call the
helper too, but that would replace clean variable initialisation with a
sequence of imperative function calls for marginal benefit. The two real
duplicates are the in-game reset blocks.)

This consolidation is intentional and bundled with the restart work:
introducing a third copy in `restartGame()` without first deduplicating
would leave three call sites to keep in sync the next time spawn velocity
changes.

### `restartGame()` — the new pause-button handler

Builds on top of `resetBallForLaunch()`. Responsible for the restart-only
resets that the per-life and per-level resets do NOT perform: rebuild the
Level 1 wall, restore lives to three, recentre the paddle, clear `keys`,
hide every overlay that might be visible, and re-kick `requestAnimationFrame`.

### Wiring

The no-op handler at `index.js:464-470` is replaced with:

```js
restartBtn.addEventListener("click", restartGame);
```

The button element, its text (`RESTART`), its position in the overlay, and
all styling remain exactly as they are today.

## Comment / coding standards

The new functions follow the same conventions as the rest of `index.js`:

- A section divider above the new code:
  `// ── Restart ──────────────────────────────────────────────────────────────`
- A multi-line block comment above each function explaining the WHY (intent,
  what it consolidates, why it re-kicks rAF), matching the style of
  `pauseGame()`, `resumeGame()`, and `loseLife()`.
- An author attribution line at the end of the block comment.
- `let` for state, `const` for handles, single responsibility per function.

The `RESTART` button's text and styling are not touched. No new CSS, no new
DOM elements, no changes to `index.html`.

## Edge cases handled

- **Restart while a paddle key is held.** Simply clearing `keys = {}` is not
  enough: the OS fires `keydown` auto-repeat events while a key is physically
  held, so the cleared map would be refilled almost immediately and the
  paddle would resume moving the moment the player launches the new game.
  Restart instead copies every currently-held key into a `suppressedKeys`
  set before clearing `keys`. The `keydown` listener honours `suppressedKeys`
  by returning early, and the `keyup` listener removes a key from the set so
  the player can re-press normally. Net behaviour: the paddle is still after
  restart, and the player must release and re-press to keep moving — same as
  a fresh page load.
- **Loop re-entry.** `gameRunning = true` and `lastTime = null` are set before
  `requestAnimationFrame(update)`. This mirrors `resumeGame()`
  (`index.js:519-527`). Without `lastTime = null`, the first post-restart
  frame would compute `dt` against a stale timestamp from before the pause and
  throw the ball across the canvas in a single frame.
- **Defensive overlay hiding.** Restart hides the game-over and win overlays
  even though they cannot currently be visible while the pause overlay is
  open. This is deliberate so a follow-up PBI can wire `restartGame()` into
  those overlays without restructuring this function.
- **Pause guard after restart.** `togglePause()` (`index.js:529`) is gated by
  `!launched`. After restart, `launched === false`, so Escape is a no-op
  until the player launches the ball. Same behaviour as on initial load.
- **RESTART click does not bubble to the gamespace launch handler.** The
  gamespace listens for clicks to call `triggerLaunch()`. Without
  intervention, clicking RESTART would run `restartGame()` (which sets
  `launched = false`) and then the same click would bubble to gamespace,
  flipping `launched` back to `true` and auto-firing the ball the moment the
  overlay disappears. A `click` listener on `pauseOverlay` calls
  `stopPropagation()` to break this chain. The listener is attached to the
  overlay itself rather than to each button so it covers MAIN MENU and any
  future overlay buttons by default.

## Out of scope

- Wiring `RESTART` into the game-over and win overlays. The helper is shaped
  to support this, but adding buttons to those overlays is a follow-up PBI.
- The `MAIN MENU` button (`index.js:472-479`) — separate stub, separate PBI.
- A confirmation dialog before restart.
- Score / high-score reset — no scoring system exists yet.
