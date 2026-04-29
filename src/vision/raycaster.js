import { intersectRaySegment } from "../physics/intersection.js";
import Point from "../utils/classes/point.js";
import Ray from "../utils/classes/ray.js";
import Vector2 from "../utils/classes/vector2.js";

export class Raycaster {
  constructor(bspRoot) {
    this.root = bspRoot;
    this.EPS = 1e-6;
  }
  /**
   * Bu fonksiyon, verilen origin noktasından belirli 
   * bir açıyla bir ışın (ray) atar ve bu ışının BSP 
   * ağacındaki segmentlerle kesişip kesişmediğini kontrol eder. 
   * Eğer kesişme varsa, kesişme noktasını ve mesafesini döndürür.
   * @param {Point} origin 
   * @param {number} angle 
   * @returns {{point: Point, dist: number} | null} Kesişme sonucu: {point: Point, dist: number} veya null
   */
  castRay(origin, angle) {
    const dir = Vector2.fromAngle(angle);
    const ray = new Ray(origin, dir);

    const hit = this._traverse(this.root, ray);
    return hit;
  }

  /**
   * Bu fonksiyon, verilen bir BSP düğümünde (node) ve bir ışında (ray), 
   * ışının düğümdeki segmentlerle kesişip kesişmediğini kontrol eder. 
   * Eğer kesişme varsa, kesişme noktasını ve mesafesini döndürür. 
   * Fonksiyon, önce ışının başlangıç noktasına göre düğümü sınıflandırır 
   * (front veya back) ve önce yakın subtree'yi (near) sonra uzak subtree'yi (far) kontrol eder. 
   * Eğer bir kesişme bulunursa, uzak subtree'yi kontrol etmeden sonucu döndürür (pruning).
   * @param {BSPNode} node 
   * @param {Ray} ray 
   * @returns {{point: Point, dist: number} | null} Kesişme sonucu: {point: Point, dist: number} veya null
   */
  _traverse(node, ray) {
    if (!node) return null;

    const side = this._classify(ray.origin, node.line);

    const near = side >= 0 ? node.front : node.back;
    const far  = side >= 0 ? node.back  : node.front;

    // yakın subtree
    let bestHit = this._traverse(near, ray);

    // node segmentleri
    for (let seg of node.segments) {
      const hit = intersectRaySegment(ray.origin, ray.dir, seg);

      if (!hit) continue;

      if (!bestHit || hit.dist < bestHit.dist) {
        bestHit = hit;
      }
    }

    // PRUNE
    if (bestHit) {
      const lineHit = this._rayLine(ray, node.line);

      if (!lineHit || lineHit.dist > bestHit.dist) {
        return bestHit;
      }
    }

    // far subtree
    const farHit = this._traverse(far, ray);

    if (!bestHit) return farHit;
    if (!farHit) return bestHit;

    return (farHit.dist < bestHit.dist) ? farHit : bestHit;
  }

  _rayLine(ray, line) {
    const p = ray.origin;
    const r = ray.dir;

    const q = line.a;
    const s = {
      x: line.b.x - line.a.x,
      y: line.b.y - line.a.y
    };

    const cross = r.x * s.y - r.y * s.x;
    if (Math.abs(cross) < this.EPS) return null;

    const qp = { x: q.x - p.x, y: q.y - p.y };
    const t = (qp.x * s.y - qp.y * s.x) / cross;

    if (t >= 0) {
      return {
        x: p.x + r.x * t,
        y: p.y + r.y * t,
        dist: t
      };
    }

    return null;
  }

  _classify(point, line) {
    const dx = line.b.x - line.a.x;
    const dy = line.b.y - line.a.y;

    return (point.x - line.a.x) * dy -
           (point.y - line.a.y) * dx;
  }

  /**
   * Origin noktasından tüm açılar için ışınlar atarak, bu ışınların 
   * BSP ağacındaki segmentlerle kesiştiği noktaları hesaplar. 
   * Bu noktalar, origin noktasının görüş alanını (field of view) 
   * oluşturur. Fonksiyon, bu noktaları açısal sıraya göre sıralayarak döndürür.
   * @param {Point} origin 
   * @returns {Array<{point: Point, dist: number, angle: number}>} Görüş alanındaki noktalar
   */
  computeVisibility(origin) {
    const segments = this._collect(this.root);
    const angles = [];
    const points = [];

    for (let seg of segments) {
      for (let p of [seg.a, seg.b]) {
        const a = Math.atan2(p.y - origin.y, p.x - origin.x);

        angles.push(a - 0.0001, a, a + 0.0001);
      }
    }

    for (let angle of angles) {
      const hit = this.castRay(origin, angle);
      if (hit) {
        hit.angle = angle;
        points.push(hit);
      }
    }

    points.sort((a, b) => a.angle - b.angle);
    return points;
  }

  _collect(node, list = []) {
    if (!node) return list;

    list.push(...node.segments);
    this._collect(node.front, list);
    this._collect(node.back, list);

    return list;
  }
}