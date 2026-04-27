# Restart Game — Manual Test Cases

## R1: Restart returns to Level 1 from a later level
- **Setup:** Press W repeatedly to skip past Level 1 (e.g. land on Level 3). Launch the ball, then press Escape to pause.
- **Action:** Click the `RESTART` button.
- **Expected:** The brick wall matches the Level 1 layout (8x5 staggered, no armoured bricks), not the level the player was previously on.

## R2: Restart resets lives to three
- **Setup:** Lose 1 or 2 lives during a round. Launch the ball, then pause.
- **Action:** Click `RESTART`.
- **Expected:** All three life indicators are visible; none are in the lost state.

## R3: Brick wall is freshly populated
- **Setup:** Break several bricks during a round, leaving visible gaps in the wall. Pause.
- **Action:** Click `RESTART`.
- **Expected:** The wall is full again — every brick that was destroyed has been rebuilt. Layout matches Level 1.

## R4: Ball is anchored to the paddle after restart
- **Setup:** Pause the game with the ball mid-flight.
- **Action:** Click `RESTART`.
- **Expected:** The ball is sitting on top of the paddle and follows the paddle horizontally as the player moves the mouse. It does not move on its own.

## R5: Launch prompt reappears
- **Setup:** Launch the ball, then pause.
- **Action:** Click `RESTART`.
- **Expected:** The "Click or press Space to launch" prompt is visible at the bottom of the gamespace.

## R6: Pause overlay is dismissed
- **Setup:** Pause the game.
- **Action:** Click `RESTART`.
- **Expected:** The pause overlay (PAUSED title and the three buttons) is no longer visible.

## R7: Game does not auto-launch after restart
- **Setup:** Pause the game.
- **Action:** Click `RESTART` and wait several seconds without clicking or pressing Space.
- **Expected:** The ball stays on the paddle. No automatic launch occurs.

## R8: Game plays normally after restart and launch
- **Setup:** Launch the ball, let it bounce a few times, then pause.
- **Action:** Click `RESTART`, then press Space to launch.
- **Expected:** Ball launches normally, paddle responds to mouse and arrow keys, ball moves at the expected speed — gameplay matches a fresh page load.

## R9: Held paddle key does not cause drift after restart
- **Setup:** Hold the right arrow key while pausing the game.
- **Action:** With the right arrow still held, click `RESTART`. Then release the right arrow.
- **Expected:** The paddle does not drift on its own after restart. The player must re-press the key to keep moving.

## R10: Pause guard is re-armed after restart
- **Setup:** Pause the game.
- **Action:** Click `RESTART`. Without launching, press Escape.
- **Expected:** Nothing happens — the pause overlay does not reopen, because the ball has not yet been launched. Same behaviour as on initial page load.

## R11: Multiple consecutive restarts work
- **Setup:** Pause the game.
- **Action:** Click `RESTART`, launch the ball, pause again, click `RESTART` a second time.
- **Expected:** Each restart returns the game cleanly to the Level 1 pre-launch state. No frozen loop, no stuck ball, no duplicated bricks.

## R12: Restart button visual is unchanged
- **Setup:** Open the pause overlay.
- **Action:** Visually compare the `RESTART` button to the `RESUME` and `MAIN MENU` buttons.
- **Expected:** Same shape, size, colours, font, and label "RESTART" as before this change — only its behaviour is new.
