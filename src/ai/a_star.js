import { MinHeap } from "./min_heap.js";

/**
 * A* Algoritması ile graf üzerinde iki düğüm arasındaki en kısa yolu bulur.
 * @param {Graph} graph Üzerinde arama yapılacak Navigasyon Grafı
 * @param {string} startNodeId Başlangıç düğümünün ID'si (Düşmanın konumu)
 * @param {string} targetNodeId Hedef düğümünün ID'si (Oyuncunun konumu)
 * @returns {Array<string>|null} Düğüm ID'lerinden oluşan en kısa yol dizisi veya yol yoksa null
 */
export function findPathAStar(graph, startNodeId, targetNodeId) {
    if (!startNodeId || !targetNodeId) return null;
    if (startNodeId === targetNodeId) return [startNodeId];

    // Öncelikli kuyruğumuz (Sıfırdan yazdığımız Min-Heap)
    const openSet = new MinHeap();
    
    // gScore[node]: Başlangıçtan bu düğüme gelmenin bilinen en kısa mesafesi
    const gScore = new Map();
    
    // Yol takibi için ebeveyn düğümleri tutan harita
    const cameFrom = new Map();

    // Başlangıç değerlerini ata
    gScore.set(startNodeId, 0);
    
    // fScore = gScore + hScore (Heuristic olarak Öklid mesafesini kullanıyoruz)
    const initialF = graph.getDistance(startNodeId, targetNodeId);
    openSet.push({ node: startNodeId, f: initialF });

    // Heap içinde gezilecek düğüm kalmayana kadar dön
    while (!openSet.isEmpty()) {
        // En düşük F maliyetine sahip düğümü kuyruktan çek
        const currentItem = openSet.pop();
        const current = currentItem.node;

        // Hedefe ulaştıysak yolu geri sararak inşa et
        if (current === targetNodeId) {
            const totalPath = [current];
            let curr = current;
            while (cameFrom.has(curr)) {
                curr = cameFrom.get(curr);
                totalPath.unshift(curr); // Yolun başına ekle
            }
            return totalPath;
        }

        // Mevcut düğümün komşularını tara
        const neighbors = graph.getNeighbors(current);
        for (let neighbor of neighbors) {
            // Şimdilik her komşu arası uzaklık sabit (G maliyeti + mesafe)
            const tentativeGScore = (gScore.get(current) || 0) + graph.getDistance(current, neighbor);

            // Eğer bu komşuya daha kısa bir yoldan ulaştıysak güncelle
            if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeGScore);
                
                // F = G + H maliyetini hesapla ve Heap'e ekle
                const fScore = tentativeGScore + graph.getDistance(neighbor, targetNodeId);
                openSet.push({ node: neighbor, f: fScore });
            }
        }
    }

    // Eğer kuyruk bittiyse ve hedefe ulaşılamadıysa yol yoktur
    return null;
}