export class MinHeap {
    constructor() {
        this.heap = [];
    }

    /**
     * Heap'in boyutunu döndürür.
     */
    size() {
        return this.heap.length;
    }

    /**
     * Heap boş mu kontrol eder.
     */
    isEmpty() {
        return this.heap.length === 0;
    }

    /**
     * Heap'e yeni bir eleman (düğüm) ekler.
     * @param {Object} item { node: string, f: number } formatında olmalı
     */
    push(item) {
        this.heap.push(item);
        this._bubbleUp(this.heap.length - 1);
    }

    /**
     * En küçük maliyetli (en düşük F değerine sahip) elemanı heap'ten çıkarır.
     */
    pop() {
        if (this.isEmpty()) return null;
        const min = this.heap[0];
        const end = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = end;
            this._sinkDown(0);
        }
        return min;
    }

    _bubbleUp(index) {
        while (index > 0) {
            let parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[index].f >= this.heap[parentIndex].f) break;
            
            // Yer değiştir
            let temp = this.heap[index];
            this.heap[index] = this.heap[parentIndex];
            this.heap[parentIndex] = temp;
            
            index = parentIndex;
        }
    }

    _sinkDown(index) {
        const length = this.heap.length;
        const element = this.heap[index];

        while (true) {
            let leftChildIndex = 2 * index + 1;
            let rightChildIndex = 2 * index + 2;
            let leftChild, rightChild;
            let swap = null;

            if (leftChildIndex < length) {
                leftChild = this.heap[leftChildIndex];
                if (leftChild.f < element.f) {
                    swap = leftChildIndex;
                }
            }

            if (rightChildIndex < length) {
                rightChild = this.heap[rightChildIndex];
                if (
                    (swap === null && rightChild.f < element.f) ||
                    (swap !== null && rightChild.f < leftChild.f)
                ) {
                    swap = rightChildIndex;
                }
            }

            if (swap === null) break;

            this.heap[index] = this.heap[swap];
            this.heap[swap] = element;
            index = swap;
        }
    }
}