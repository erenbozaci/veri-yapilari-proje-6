
import { BSPNode } from "./bsp_node.js";

// Enes Çelik - İki vektörün vektörel çarpımını (Cross Product) hesaplar
export function cross_enes_celik(a, b) {
    return a.x * b.y - a.y * b.x;
}

// Enes Çelik - Vektörel çarpım metoduyla noktanın ayırıcı doğruya konumunu (FRONT, BACK, ON_LINE) saptar
// Not: 0.00001 (Epsilon) tolerans payı ile floating point hassasiyet kaybı çözülmüştür.
export function classifyPoint_enes_celik(p, a, b) {
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const ap = { x: p.x - a.x, y: p.y - a.y };
    const val = cross_enes_celik(ab, ap);
    if (val > 0.00001) return 'FRONT';
    if (val < -0.00001) return 'BACK';
    return 'ON_LINE';
}

export class BSPBuilder {
    // Enes Çelik - Bir segmentin ayırıcı çizgi tarafından kesilmesi durumunda ikiye böler (Segment Splitting)
    splitSegment_enes_celik(seg, a, b) {
        const ab = { x: b.x - a.x, y: b.y - a.y };
        const segVec = { x: seg.b.x - seg.a.x, y: seg.b.y - seg.a.y };
        const ap = { x: seg.a.x - a.x, y: seg.a.y - a.y };

        const denom = cross_enes_celik(segVec, ab);
        if (Math.abs(denom) < 0.00001) return { frontPart: null, backPart: null };

        const t = cross_enes_celik(ap, ab) / denom;
        if (t <= 0 || t >= 1) return { frontPart: null, backPart: null };

        const intersect = {
            x: seg.a.x + t * segVec.x,
            y: seg.a.y + t * segVec.y
        };

        return {
            frontPart: { a: seg.a, b: intersect },
            backPart: { a: intersect, b: seg.b }
        };
    }

    // Enes Çelik - Duvar segmentlerini hiyerarşik düzene sokan rekürsif ağaç kurulum algoritması (BSP Tree Build)
    buildTree_enes_celik(segments) {
        if (segments.length === 0) return null;

        const node = new BSPNode(segments[0]);
        node.segments.push(segments[0]);

        const frontSegments = [];
        const backSegments = [];

        for (let i = 1; i < segments.length; i++) {
            const seg = segments[i];
            const sideA = classifyPoint_enes_celik(seg.a, node.partition.a, node.partition.b);
            const sideB = classifyPoint_enes_celik(seg.b, node.partition.a, node.partition.b);

            if (sideA === 'FRONT' && sideB === 'FRONT') {
                frontSegments.push(seg);
            } else if (sideA === 'BACK' && sideB === 'BACK') {
                backSegments.push(seg);
            } else {
                const { frontPart, backPart } = this.splitSegment_enes_celik(seg, node.partition.a, node.partition.b);
                if (frontPart) frontSegments.push(frontPart);
                if (backPart) backSegments.push(backPart);
            }
        }

        node.front = this.buildTree_enes_celik(frontSegments);
        node.back = this.buildTree_enes_celik(backSegments);

        return node;
    }

    // Projenin geri kalan modüllerinin (Görüş poligonu, Raycasting vb.) hata vermemesi için orijinal köprü fonksiyonlar:
    buildTree(segments) {
        return this.buildTree_enes_celik(segments);
    }

    splitSegment(seg, a, b) {
        return this.splitSegment_enes_celik(seg, a, b);
    }
}

// Eren veya diğer modüller eski isimlerle import etmeye çalışırsa uyumluluk köprüsü:
export { classifyPoint_enes_celik as classifyPoint };