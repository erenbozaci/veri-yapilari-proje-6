export class BSPNode {
    constructor(partition = null) {
        this.partition = partition;
        this.line = partition;
        this.front = null;
        this.back = null;
        this.segments = [];
    }

    isLeaf() {
        return this.front === null && this.back === null;
    }
}