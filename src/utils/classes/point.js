class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  /**
   * 
   * @param {Point} other 
   * @returns 
   */
  angleTo(other) {
    return Math.atan2(other.y - this.y, other.x - this.x);
  }

  clone() {
    return new Point(this.x, this.y);
  }

  subtract(p) {
    return new Vector2(this.x - p.x, this.y - p.y);
  }
}

export default Point;