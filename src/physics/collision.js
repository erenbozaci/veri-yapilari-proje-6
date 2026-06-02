/**
 * Bir oyuncunun dairesel gövdesi ile bir duvar çizgisi arasındaki en yakın noktayı bulur.
 */
function closestPointOnSegment(p, seg) {
    const ab = { x: seg.b.x - seg.a.x, y: seg.b.y - seg.a.y };
    const ap = { x: p.x - seg.a.x, y: p.y - seg.a.y };

    const abLenSq = ab.x * ab.x + ab.y * ab.y;
    if (abLenSq === 0) return { x: seg.a.x, y: seg.a.y };

    let t = (ap.x * ab.x + ap.y * ab.y) / abLenSq;
    t = Math.max(0, Math.min(1, t));

    return {
        x: seg.a.x + t * ab.x,
        y: seg.a.y + t * ab.y
    };
}

/**
 * Haritadaki duvarları tarayarak oyuncuyu dışarı iter ve köşelerde yağ gibi kaymasını sağlar.
 * @param {Object} pos Oyuncunun test edilmek istenen konumu {x, y}
 * @param {number} radius Oyuncunun yarıçapı
 * @param {Array} walls Oyundaki tüm duvar segmentleri dizisi
 * @returns {Object} Çarpışması düzeltilmiş yeni {x, y} konumu
 */
export function handleWallCollisions(pos, radius, walls) {
    if (!walls || walls.length === 0) return { x: pos.x, y: pos.y };

    let corrected = { x: pos.x, y: pos.y };

    // Köşelerde takılmaları önlemek için stabilizasyon döngüsü (2 kez üzerinden geçiyoruz)
    for (let i = 0; i < 2; i++) {
        for (let seg of walls) {
            const closest = closestPointOnSegment(corrected, seg);
            
            const distX = corrected.x - closest.x;
            const distY = corrected.y - closest.y;
            const distance = Math.sqrt(distX * distX + distY * distY);

            // Eğer mesafe yarıçaptan küçükse, oyuncu duvarın sınırını ihlal etmiştir!
            if (distance < radius) {
                const overlap = radius - distance;

                if (distance === 0) {
                    // Tam çizgi üstüne denk geldiyse hafifçe yukarı fırlat
                    corrected.y -= radius;
                } else {
                    // Oyuncuyu duvarın dışına doğru normal vektörü doğrultusunda it
                    corrected.x += (distX / distance) * overlap;
                    corrected.y += (distY / distance) * overlap;
                }
            }
        }
    }

    return corrected;
}