import Vector2 from "../utils/classes/vector2.js";
import Point from "../utils/classes/point.js";
import Segment from "../utils/classes/segment.js";

/**
 * Bu fonksiyon, verilen bir ışının (ray) bir segmentle kesişip kesişmediğini kontrol eder.
 * Eğer kesişme varsa, kesişme noktasını ve ışının başlangıç noktasından bu kesişme noktasına olan mesafeyi döndürür.
 * @param {Point} origin 
 * @param {Point} dir 
 * @param {Segment} seg 
 * @returns {point: Point, dist: number} | null
 */
export function intersectRaySegment(origin, dir, seg) {
  const v1 = origin.subtract(seg.a);
  const v2 = seg.b.subtract(seg.a);
  const v3 = new Vector2(-dir.y, dir.x);

  const dot = v2.dot(v3);

  if (Math.abs(dot) < 0.000001) return null;

  const t1 = v2.cross(v1) / dot;
  const t2 = v1.dot(v3) / dot;

  if (t1 >= 0 && t2 >= 0 && t2 <= 1) {
    return {
      point: new Point(
        origin.x + dir.x * t1,
        origin.y + dir.y * t1
      ),
      dist: t1
    };
  }

  return null;
}