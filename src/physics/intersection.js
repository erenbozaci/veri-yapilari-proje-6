import Vector2 from "../utils/classes/vector2.js";
import Point from "../utils/classes/point.js";
import Segment from "../utils/classes/segment.js";

/**
 * Bu fonksiyon, verilen bir ışının (ray) bir segmentle kesişimini bulur.
 * (Raycasting modülü entegrasyonu)
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

/**
 * Bir oyuncunun dairesel gövdesi ile bir duvar çizgisi arasındaki en yakın noktayı bulur.
 * (Circle-Segment çarpışma modülü)
 */
export function closestPointOnSegment(p, seg) {
    const ab = { x: seg.b.x - seg.a.x, y: seg.b.y - seg.a.y };
    const ap = { x: p.x - seg.a.x, y: p.y - seg.a.y };

    const abLenSq = ab.x * ab.x + ab.y * ab.y;
    if (abLenSq === 0) return { x: seg.a.x, y: seg.a.y };

    let t = (ap.x * ab.x + ap.y * ab.y) / abLenSq;
    t = Math.max(0, Math.min(1, t));

    return {
        x: seg.a.x + t * ab.x,
        y: seg.a.y + t * ab.y
    };
}