import { classifyPoint } from "./bsp_builder.js";

export function findLeaf(node, point) {
    if (node.isLeaf()) {
        return node;
    }

    const side = classifyPoint(point, node.partition.a, node.partition.b);

    if (side === 'FRONT') {
        return findLeaf(node.front, point);
    } else {
        return findLeaf(node.back, point);
    }
}
