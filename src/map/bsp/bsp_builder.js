import { BSPNode } from "./bsp_node.js";

export function cross(a, b) {
    return a.x * b.y - a.y * b.x;
}

export function classifyPoint(p, a, b) {
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const ap = { x: p.x - a.x, y: p.y - a.y };
    const val = cross(ab, ap);
    if (val > 0.00001) return 'FRONT';
    if (val < -0.00001) return 'BACK';
    return 'ON_LINE';
}

export class BSPBuilder {
    splitSegment(seg, a, b) {
        const ab = { x: b.x - a.x, y: b.y - a.y };
        const segVec = { x: seg.b.x - seg.a.x, y: seg.b.y - seg.a.y };
        const ap = { x: seg.a.x - a.x, y: seg.a.y - a.y };

        const denom = cross(segVec, ab);
        if (Math.abs(denom) < 0.00001) return { frontPart: null, backPart: null };

        const t = cross(ap, ab) / denom;
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

    buildTree(segments) {
        if (segments.length === 0) return null;

        // Seçilen bölme segmentini al (Genellikle listenin ilki)
        const partitionSeg = segments[0];
        const node = new BSPNode(partitionSeg);

        const frontSegments = [];
        const backSegments = [];

        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            
            // Bölme segmentinin kendisini veya onunla çakışanları node.segments içine koy
            const sideA = classifyPoint(seg.a, partitionSeg.a, partitionSeg.b);
            const sideB = classifyPoint(seg.b, partitionSeg.a, partitionSeg.b);

            if (sideA === 'ON_LINE' && sideB === 'ON_LINE') {
                node.segments.push(seg);
                continue;
            }

            if (sideA !== 'BACK' && sideB !== 'BACK') {
                // Tamamen önde veya bir ucu çizgide
                frontSegments.push(seg);
            } else if (sideA !== 'FRONT' && sideB !== 'FRONT') {
                // Tamamen arkada veya bir ucu çizgide
                backSegments.push(seg);
            } else {
                // Çizgiyi kesiyor, böl
                const { frontPart, backPart } = this.splitSegment(seg, partitionSeg.a, partitionSeg.b);
                
                // Bölünen parçalar null değilse ekle
                if (frontPart) frontSegments.push(frontPart);
                if (backPart) backSegments.push(backPart);
                
                // Eğer splitSegment null döndürdüyse (sayısal hassasiyet nedeniyle), 
                // parçayı olduğu gibi bir tarafa atalım (veri kaybını önlemek için)
                if (!frontPart && !backPart) {
                    if (sideA === 'FRONT' || sideB === 'FRONT') frontSegments.push(seg);
                    else backSegments.push(seg);
                }
            }
        }

        // Önemli: Sonsuz döngüyü önlemek için partitionSeg'i alt dallara göndermiyoruz
        // Çünkü o zaten node.segments içinde.
        const filteredFront = frontSegments.filter(s => s !== partitionSeg);
        const filteredBack = backSegments.filter(s => s !== partitionSeg);

        node.front = this.buildTree(filteredFront);
        node.back = this.buildTree(filteredBack);

        return node;
    }
}