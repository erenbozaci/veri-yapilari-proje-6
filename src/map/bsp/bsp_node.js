
export class BSPNode {
    constructor(partition = null) {
        this.partition = partition;
        this.line = partition;
        this.front = null;
        this.back = null;
        this.segments = [];
    }

    // Enes Çelik - Düğümün yaprak (leaf) düğüm olup olmadığını kontrol eder (Evlatları yoksa yapraktır)
    isLeaf_enes_celik() {
        return this.front === null && this.back === null;
    }

    // Sistem entegrasyonu için uyumluluk köprüsü:
    isLeaf() {
        return this.isLeaf_enes_celik();
    }
}