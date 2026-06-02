import { MinHeap } from "./min_heap.js";

export function findPathAStar(graph, startNodeId, targetNodeId) {
    // 1. GÜVENLİK KONTROLÜ
    if (!startNodeId || !targetNodeId) return null;
    if (startNodeId === targetNodeId) return [startNodeId];

    // 2. AÇIK LİSTE (Min-Heap): İnceleyeceğimiz noktaları tutacak. En ucuz F maliyeti hep en üstte olacak.
    const openSet = new MinHeap();
    
    // 3. G-MALİYETİ HAFIZASI: Başlangıçtan hangi noktaya kaç adımda (maliyetle) gittiğimizi yazacağımız defter.
    const gScore = new Map();
    
    // 4. EBEVEYN HAFIZASI (Nereden Geldim?): Hedefe ulaşınca yolu geriye doğru çizmek için kullanacağımız defter.
    const cameFrom = new Map();

    // --- BAŞLANGIÇ AYARLARI ---
    gScore.set(startNodeId, 0);
    const initialF = graph.getDistance(startNodeId, targetNodeId);
    openSet.push({ node: startNodeId, f: initialF });

    // 5. ARAMA DÖNGÜSÜ
    while (!openSet.isEmpty()) {
        const currentItem = openSet.pop();
        const current = currentItem.node;

        // 6. HEDEFE ULAŞTIK MI?
        if (current === targetNodeId) {
            const totalPath = [current];
            let curr = current;
            
            while (cameFrom.has(curr)) {
                curr = cameFrom.get(curr);
                totalPath.unshift(curr); // Dizinin en başına ekle
            }
            return totalPath;
        }

        // 7. KOMŞULARA BAKMA (Keşif Aşaması)
        const neighbors = graph.getNeighbors(current);
        
        for (let neighbor of neighbors) {
            const tentativeGScore = gScore.get(current) + graph.getDistance(current, neighbor);

            // 8. DAHA KISA BİR YOL BULDUK MU?
            if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeGScore);
                
                const fScore = tentativeGScore + graph.getDistance(neighbor, targetNodeId);
                openSet.push({ node: neighbor, f: fScore });
            }
        }
    }

    // 9. GİDECEK HİÇBİR YOL YOKSA
    return null;
}