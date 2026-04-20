# Collision Angles — Manual Test Cases

## Paddle Reflection Tests

### P1: Center paddle hit sends ball straight up
- **Setup:** Position paddle in the center of the screen
- **Action:** Launch the ball so it falls and hits the middle of the paddle
- **Expected:** Ball bounces nearly straight up (slight angle is acceptable)

### P2: Left edge paddle hit sends ball to the left
- **Setup:** Move paddle so the ball lands on the left quarter of the paddle
- **Action:** Let ball hit the left side of the paddle
- **Expected:** Ball reflects at a steep angle toward the upper-left

### P3: Right edge paddle hit sends ball to the right
- **Setup:** Move paddle so the ball lands on the right quarter of the paddle
- **Action:** Let ball hit the right side of the paddle
- **Expected:** Ball reflects at a steep angle toward the upper-right

### P4: Ball speed stays consistent after paddle bounce
- **Setup:** Observe ball speed before hitting the paddle
- **Action:** Hit the ball at any position on the paddle
- **Expected:** Ball moves at the same speed after bouncing — no speedup or slowdown

### P5: Extreme edge hits don't go flat
- **Setup:** Move paddle so the ball barely catches the very edge
- **Action:** Let ball hit the far left or far right pixel of the paddle
- **Expected:** Ball bounces at a steep angle but never goes fully horizontal

---

## Brick Collision Tests

### B1: Ball hitting the bottom of a brick bounces downward
- **Setup:** Launch ball so it approaches a brick from below
- **Action:** Let ball hit the underside of a brick
- **Expected:** Ball's vertical direction reverses (bounces back down), horizontal direction unchanged

### B2: Ball hitting the top of a brick bounces upward
- **Setup:** Launch ball so it hits the top face of a brick (ball coming from above, e.g. after a wall bounce)
- **Action:** Let ball hit the top of a brick
- **Expected:** Ball's vertical direction reverses (bounces back up), horizontal direction unchanged

### B3: Ball hitting the left side of a brick bounces left
- **Setup:** Angle the ball so it approaches a brick from the left side
- **Action:** Let ball hit the left face of a brick
- **Expected:** Ball's horizontal direction reverses (bounces left), vertical direction unchanged

### B4: Ball hitting the right side of a brick bounces right
- **Setup:** Angle the ball so it approaches a brick from the right side
- **Action:** Let ball hit the right face of a brick
- **Expected:** Ball's horizontal direction reverses (bounces right), vertical direction unchanged

### B5: Brick disappears on hit
- **Setup:** Any brick collision
- **Action:** Ball hits an active brick
- **Expected:** Brick becomes invisible immediately after contact

### B6: Ball passes through destroyed bricks
- **Setup:** Destroy a brick, then direct the ball back to the same spot
- **Action:** Ball travels through the space where the brick was
- **Expected:** Ball passes through with no collision — no bounce, no stutter

### B7: Only one brick breaks per frame
- **Setup:** Angle the ball so it hits at the seam between two adjacent bricks
- **Action:** Let ball collide at the boundary
- **Expected:** Only one brick is destroyed per hit, not both simultaneously

---

## Wall Collision Tests (baseline — should not be affected by changes)

### W1: Left wall bounce
- **Action:** Let ball hit the left wall
- **Expected:** Ball bounces right, vertical direction unchanged

### W2: Right wall bounce
- **Action:** Let ball hit the right wall
- **Expected:** Ball bounces left, vertical direction unchanged

### W3: Ceiling bounce
- **Action:** Let ball hit the top wall
- **Expected:** Ball bounces downward, horizontal direction unchanged
