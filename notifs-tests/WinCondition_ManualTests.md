# Win Condition — Manual Test Cases

## W1: Win screen appears after all bricks are destroyed
- **Setup:** Play the game normally
- **Action:** Break every brick on screen
- **Expected:** "YOU WIN!" overlay appears immediately after the last brick is hit

## W2: Game stops after winning
- **Setup:** Break all bricks to trigger the win screen
- **Action:** Try moving the paddle or clicking after the win overlay shows
- **Expected:** Ball and paddle stop moving, game loop no longer runs

## W3: Ball does not need to be caught after last brick
- **Setup:** Break all bricks with the ball still in play
- **Action:** Let the last brick break while the ball is mid-flight
- **Expected:** Win triggers instantly on the last brick hit, not after the ball returns to paddle

## W4: Win takes priority over ball falling out of bounds
- **Setup:** Angle the ball so it breaks the last brick while heading downward toward the bottom
- **Action:** Last brick breaks as ball is about to fall off screen
- **Expected:** "YOU WIN!" shows, not "GAME OVER" — win check happens before out-of-bounds check

## W5: Win works on final life
- **Setup:** Lose 2 lives, then break all remaining bricks on the 3rd life
- **Action:** Destroy the last brick with only 1 life remaining
- **Expected:** "YOU WIN!" overlay appears normally, game does not show game over

## W6: Destroyed bricks stay destroyed during play
- **Setup:** Break several bricks, then lose a life
- **Action:** After ball resets to paddle, check the brick wall
- **Expected:** Previously destroyed bricks remain gone — they do not reappear on life loss

## W7: Win overlay does not appear prematurely
- **Setup:** Start a new game
- **Action:** Break only some bricks, not all
- **Expected:** No win overlay appears while any bricks remain active
