export class Graph {
    constructor() {
        this.adjacencyList = new Map();
        this.nodes = new Map(); 
    }

    addNode(id, x, y) {
        this.nodes.set(id, { x, y });
        if (!this.adjacencyList.has(id)) {
            this.adjacencyList.set(id, []);
        }
    }

    addEdge(node1, id2) {
        if (this.adjacencyList.has(node1)) {
            this.adjacencyList.get(node1).push(id2);
        }
    }

    getNeighbors(nodeId) {
        return this.adjacencyList.get(nodeId) || [];
    }

    getClosestNode(x, y) {
        let closestId = null;
        let minQueryDist = Infinity;

        for (let [id, pos] of this.nodes.entries()) {
            const dx = pos.x - x;
            const dy = pos.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minQueryDist) {
                minQueryDist = dist;
                closestId = id;
            }
        }
        return closestId;
    }
    
    getDistance(nodeId1, nodeId2) {
        const p1 = this.nodes.get(nodeId1);
        const p2 = this.nodes.get(nodeId2);
        if (!p1 || !p2) return Infinity;
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

export function buildNavigationGraph(walls, mapWidth, mapHeight) {
    const navGraph = new Graph();
    const cellSize = 40; // Hassas yol takibi için düğüm aralığını 40 yaptık

    for (let x = 70; x < mapWidth - 50; x += cellSize) {
        for (let y = 70; y < mapHeight - 50; y += cellSize) {
            
            let insideWall = false;
            for (let seg of walls) {
                if (pointToSegmentDistance({ x, y }, seg) < 22) {
                    insideWall = true;
                    break;
                }
            }

            if (!insideWall) {
                const id = `${x}_${y}`;
                navGraph.addNode(id, x, y);
            }
        }
    }

    for (let [id1, p1] of navGraph.nodes.entries()) {
        for (let [id2, p2] of navGraph.nodes.entries()) {
            if (id1 === id2) continue;
            const dx = Math.abs(p1.x - p2.x);
            const dy = Math.abs(p1.y - p2.y);
            
            if ((dx === cellSize && dy === 0) || (dx === 0 && dy === cellSize)) {
                navGraph.addEdge(id1, id2);
            }
        }
    }

    return navGraph;
}

function pointToSegmentDistance(p, seg) {
    const ab = { x: seg.b.x - seg.a.x, y: seg.b.y - seg.a.y };
    const ap = { x: p.x - seg.a.x, y: p.y - seg.a.y };
    const abLenSq = ab.x * ab.x + ab.y * ab.y;
    if (abLenSq === 0) return Math.sqrt((p.x - seg.a.x)**2 + (p.y - seg.a.y)**2);
    let t = (ap.x * ab.x + ap.y * ab.y) / abLenSq;
    t = Math.max(0, Math.min(1, t));
    const closest = { x: seg.a.x + t * ab.x, y: seg.a.y + t * ab.y };
    return Math.sqrt((p.x - closest.x)**2 + (p.y - closest.y)**2);
}