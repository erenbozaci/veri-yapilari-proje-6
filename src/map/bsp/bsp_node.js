class BSPNode {
    constructor(partition = null) {
        this.partition = partition; // Bu düğümü bölen çizgi
        this.front = null;          // Ön taraf
        this.back = null;           // Arka taraf
        this.segments = [];         // Düğümdeki çizgi/duvar parçaları
    }

    isLeaf() {
        return this.front === null && this.back === null;
    }
}

module.exports = { BSPNode };