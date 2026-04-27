import { cross } from '../../utils/math.js';

export function classifyPoint(p, a, b) {
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const ap = { x: p.x - a.x, y: p.y - a.y };

    const val = cross(ab, ap);

    if (val > 0.00001) return 'FRONT';
    if (val < -0.00001) return 'BACK';
    return 'ON_LINE';
}
