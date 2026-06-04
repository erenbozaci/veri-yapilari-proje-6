import Point from "../utils/classes/point.js";

export class Raycaster {
  /**
   * @param {Object} bspRoot Oluşturulan BSP Ağacının kök düğümü (Root)
   */
  constructor(bspRoot) {
    this.root = bspRoot;
  }

  /**
   * Belirli bir orijinden ve belirli bir açıda ışın fırlatır.
   * BSP ağacını kullanarak en yakın duvar kesişim noktasını bulur.
   * @param {Point} origin Işının çıkış noktası (Oyuncu konumu)
   * @param {number} angle Işının atıldığı açı (Radyan)
   * @returns {{point: Point, param: number} | null} Kesişim noktası ve uzaklık parametresi
   */
  castRay(origin, angle) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    
    // Büyük bir ışın segmenti oluşturuyoruz (Maksimum görüş menzili için)
    const rayEnd = new Point(origin.x + dx * 2000, origin.y + dy * 2000);
    
    return this._traverse(this.root, origin, rayEnd);
  }

  /**
   * BSP Ağacı üzerinde Rekürsif Gezinme ve Budama (Traversal & Pruning) Algoritması
   * Şartname Faz 2: "BSP ağacı kullanılarak gereksiz testler azaltılır" maddesidir.
   */
  _traverse(node, p1, p2) {
    if (!node) return null;

    let closestHit = null;

    // Bölme doğrusuna göre ışının başlangıç ve bitiş noktalarını sınıflandır
    const d1 = this._pointToLineDistance(p1, node.partition);
    const d2 = this._pointToLineDistance(p2, node.partition);

    // Düğümdeki tüm duvarlarla (bölme segmentleri dahil) kesişim testi yap
    // Şartname: "Her düğümdeki segmentler kontrol edilmelidir"
    for (let wall of node.segments) {
        const hit = this._intersectSegments(p1, p2, wall.a, wall.b);
        if (hit) {
            if (!closestHit || hit.param < closestHit.param) {
                closestHit = hit;
            }
        }
    }

    // Işın bölme doğrusunun tamamen ÖNÜNDEYSE
    if (d1 >= 0 && d2 >= 0) {
        const hitFront = this._traverse(node.front, p1, p2);
        if (hitFront && (!closestHit || hitFront.param < closestHit.param)) closestHit = hitFront;
    }
    // Işın bölme doğrusunun tamamen ARKASINDAYSA
    else if (d1 < 0 && d2 < 0) {
        const hitBack = this._traverse(node.back, p1, p2);
        if (hitBack && (!closestHit || hitBack.param < closestHit.param)) closestHit = hitBack;
    }
    // Işın doğruyu kesiyorsa veya çizgideyse her iki tarafı da tara
    else {
        const first = d1 >= 0 ? node.front : node.back;
        const second = d1 >= 0 ? node.back : node.front;

        const hitFirst = this._traverse(first, p1, p2);
        if (hitFirst && (!closestHit || hitFirst.param < closestHit.param)) closestHit = hitFirst;
        
        // Eğer ilk tarafta bulduğumuz hit, zaten en yakın hit ise ve bölme noktasından önceyse
        // ikinci tarafa bakmaya gerek kalmayabilir, ancak güvenli olması için bakıyoruz.
        const hitSecond = this._traverse(second, p1, p2);
        if (hitSecond && (!closestHit || hitSecond.param < closestHit.param)) closestHit = hitSecond;
    }

    return closestHit;
  }

  // Rekürsiyon için tüm duvarları düz bir diziye toplayan yardımcı fonksiyon
  _collect(node) {
    if (!node) return [];
    if (node.isLeaf) return node.segments;
    return [...this._collect(node.front), ...this._collect(node.back)];
  }

  // İki çizgi segmenti arasındaki geometrik kesişimi hesaplar (Determinant yöntemi)
  _intersectSegments(p1, p2, p3, p4) {
    const den = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (den === 0) return null; // Paralel

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / den;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / den;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return {
        point: new Point(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y)),
        param: ua // Başlangıç noktasına olan uzaklık oranı
      };
    }
    return null;
  }

  // Noktanın doğruya göre konumunu bulur (Pozitif: Ön, Negatif: Arka)
  _pointToLineDistance(pt, line) {
    return (line.b.x - line.a.x) * (pt.y - line.a.y) - (line.b.y - line.a.y) * (pt.x - line.a.x);
  }
}