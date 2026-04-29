// Gerekli modülleri alıyoruz
const { BSPNode } = require('./bsp_node.js');

// Yardımcı matematik fonksiyonları (Döngüsel bağımlılığı önlemek için burada tanımlayıp export ediyoruz)
function cross(a, b) {
    return a.x * b.y - a.y * b.x;
}

function classifyPoint(p, a, b) {
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const ap = { x: p.x - a.x, y: p.y - a.y };
    const val = cross(ab, ap);
    if (val > 0.00001) return 'FRONT';
    if (val < -0.00001) return 'BACK';
    return 'ON_LINE';
}

class BSPBuilder {
    // Duvarı bölme çizgisinde kesip ikiye ayıran fonksiyon
    splitSegment(seg, a, b) {
        // İki doğrunun kesişim noktasını (t) vektörel olarak buluyoruz
        const ab = { x: b.x - a.x, y: b.y - a.y };
        const segVec = { x: seg.b.x - seg.a.x, y: seg.b.y - seg.a.y };
        const ap = { x: seg.a.x - a.x, y: seg.a.y - a.y };

        const denom = cross(segVec, ab);
        if (Math.abs(denom) < 0.00001) return { frontPart: null, backPart: null }; // Paralel

        const t = cross(ap, ab) / denom;

        const intersect = {
            x: seg.a.x + t * segVec.x,
            y: seg.a.y + t * segVec.y
        };

        return {
            frontPart: { a: seg.a, b: intersect }, // Basitçe örneklendirme, ihtiyaca göre a/b yer değişebilir
            backPart: { a: intersect, b: seg.b }
        };
    }

    buildTree(segments) {
        if (segments.length === 0) return null;

        const node = new BSPNode(segments[0]);
        const frontSegments = [];
        const backSegments = [];

        // ÖNEMLİ: Orta nokta yerine uç noktaları kontrol ediyoruz
        for (let i = 1; i < segments.length; i++) {
            const seg = segments[i];
            const sideA = classifyPoint(seg.a, node.partition.a, node.partition.b);
            const sideB = classifyPoint(seg.b, node.partition.a, node.partition.b);

            if (sideA === 'FRONT' && sideB === 'FRONT') {
                frontSegments.push(seg);
            } else if (sideA === 'BACK' && sideB === 'BACK') {
                backSegments.push(seg);
            } else {
                // Kesişme var, bölüyoruz!
                const { frontPart, backPart } = this.splitSegment(seg, node.partition.a, node.partition.b);
                if (frontPart) frontSegments.push(frontPart);
                if (backPart) backSegments.push(backPart);
            }
        }

        node.front = this.buildTree(frontSegments);
        node.back = this.buildTree(backSegments);

        return node;
    }
}

// Hem sınıfı hem yardımcı fonksiyonları dışarı veriyoruz
module.exports = { BSPBuilder, classifyPoint, cross };