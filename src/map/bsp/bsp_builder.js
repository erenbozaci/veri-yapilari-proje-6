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

        const node = new BSPNode(segments[0]);
        node.segments.push(segments[0]); // ÖNEMLİ: Bölücü çizgiyi düğüme kaydettik!

        const frontSegments = [];
        const backSegments = [];

        for (let i = 1; i < segments.length; i++) {
            const seg = segments[i];
            const sideA = classifyPoint(seg.a, node.partition.a, node.partition.b);
            const sideB = classifyPoint(seg.b, node.partition.a, node.partition.b);

            if (sideA === 'FRONT' && sideB === 'FRONT') {
                frontSegments.push(seg);
            } else if (sideA === 'BACK' && sideB === 'BACK') {
                backSegments.push(seg);
            } else {
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
