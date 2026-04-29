// İçe aktarma (import yerine require)
const { classifyPoint } = require('./bsp_builder.js');

function findLeaf(node, point) {
    // 1. Eğer bir yaprağa ulaştıysak, burası noktayı içeren bölgedir
    if (node.isLeaf()) {
        return node;
    }

    // 2. Noktanın, bu düğümün bölme çizgisinin neresinde olduğuna bak
    const side = classifyPoint(point, node.partition.a, node.partition.b);

    // 3. Karara göre ağaçta aşağı in
    if (side === 'FRONT') {
        return findLeaf(node.front, point);
    } else {
        // BACK veya ON_LINE durumlarında arka tarafa devam ediyoruz
        return findLeaf(node.back, point);
    }
}

// Dışa aktarma (export yerine module.exports)
module.exports = { findLeaf };