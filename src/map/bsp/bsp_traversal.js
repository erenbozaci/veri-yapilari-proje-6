
import { classifyPoint } from "./bsp_builder.js";

/**
 * Enes Çelik - Bir noktanın ağaç üzerindeki hangi yaprak düğümde (leaf node) olduğunu saptar.
 * Eren'in Raycasting ve Görüş Poligonu sistemi için temel teşkil eden gezinme algoritmasıdır.
 * * @param {BSPNode} node Gezinmeye başlanacak kök düğüm
 * @param {Object} point Koordinatları içeren nokta objesi {x, y}
 * @returns {BSPNode} Noktanın ait olduğu yaprak düğüm
 */
export function findLeaf_enes_celik(node, point) {
    if (!node) return null;

    // bsp_node dosyasında mühürlediğimiz isLeaf kontrolü tetiklenir
    if (node.isLeaf()) {
        return node;
    }

    // bsp_builder dosyasında mühürlediğimiz yön sınıflandırması tetiklenir
    const side = classifyPoint(point, node.partition.a, node.partition.b);

    if (side === 'FRONT') {
        return findLeaf_enes_celik(node.front, point);
    } else {
        return findLeaf_enes_celik(node.back, point);
    }
}

// Projenin diğer modüllerinin (Raycasting vb.) hata vermemesi için orijinal köprü fonksiyon:
export function findLeaf(node, point) {
    return findLeaf_enes_celik(node, point);
}