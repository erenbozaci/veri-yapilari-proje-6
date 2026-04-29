export class BSPNode {
    constructor(partition = null) {
        this.partition = partition; // Bu düğümü bölen çizgi
        this.line = partition;      // Raycaster 'line' ismini bekliyor, eşitledik.
        this.front = null;
        this.back = null;
        this.segments = [];         // Düğümdeki çizgi/duvar parçaları
    }

    isLeaf() {
        return this.front === null && this.back === null;
    }
}
