import Vector2 from "./vector2.js";

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Bir noktadan diğer noktaya olan açıyı radyan cinsinden hesaplar.
   * @param {Point} other 
   * @returns {number}
   */
  angleTo(other) {
    return Math.atan2(other.y - this.y, other.x - this.x);
  }

  /**
   * Noktanın kopyasını oluşturur.
   * @returns {Point}
   */
  clone() {
    return new Point(this.x, this.y);
  }

  /**
   * İki noktayı birbirinden çıkararak bir yön/mesafe vektörü elde eder.
   * @param {Point} p 
   * @returns {Vector2}
   */
  subtract(p) {
    return new Vector2(this.x - p.x, this.y - p.y);
  }
}

export default Point;