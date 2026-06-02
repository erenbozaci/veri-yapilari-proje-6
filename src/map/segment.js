import Point from "../utils/classes/point.js";

export default class Segment {
    /**
     * İki nokta arasında bir duvar (çizgi segmenti) oluşturur.
     * @param {Point} a Başlangıç noktası
     * @param {Point} b Bitiş noktası
     */
    constructor(a, b) {
        this.a = a;
        this.b = b;
    }

    /**
     * Duvarın uzunluğunu hesaplar.
     * @returns {number}
     */
    getLength() {
        const dx = this.b.x - this.a.x;
        const dy = this.b.y - this.a.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}