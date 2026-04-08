/**
 * GameObject - Base class for all game entities.
 * Every object in the game extends this class to ensure a consistent
 * interface for the game loop (update, draw, collision detection).
 * 
 * TO USE:
 * import { GameObject } from './GameObject.js';
 * 
 * export class YourObject extends GameObject {...your object creation...}
 * use/extend the constructor
 */
export class GameObject {
  /**
   * @param {number} x - Initial X position (top-left origin)
   * @param {number} y - Initial Y position (top-left origin)
   * @param {number} width
   * @param {number} height
   */
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    // Velocity in pixels per second
    this.vx = 0;
    this.vy = 0;

    // When false, the object is skipped by update/draw and can be culled
    this.active = true;

    // Optional tag for quick type checks without instanceof chains
    this.tag = 'GameObject';
  }

  /**
   * Returns an axis-aligned bounding box for collision detection.
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Called once per frame. Override in subclasses to add behaviour.
   * @param {number} deltaTime - Seconds elapsed since last frame
   */
  update(deltaTime) {
    // Base implementation: apply velocity
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
  }

  /**
   * Called once per frame after update. Override in subclasses to render.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    // Base implementation intentionally empty — subclasses own their visuals
  }

  /**
   * Marks the object as inactive so the game loop can remove it.
   */
  destroy() {
    this.active = false;
  }
}