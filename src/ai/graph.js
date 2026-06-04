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

    getClosestNode(x, y, walls = []) {
        let closestId = null;
        let minQueryDist = Infinity;

        for (let [id, pos] of this.nodes.entries()) {
            const dx = pos.x - x;
            const dy = pos.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < minQueryDist) {
                // EKLENEN: Duvar arkasındaki düğümleri seçme
                let blocked = false;
                if (walls.length > 0) {
                    for (let wall of walls) {
                        if (doSegmentsIntersect({x, y}, pos, wall.a, wall.b)) {
                            blocked = true;
                            break;
                        }
                    }
                }

                if (!blocked) {
                    minQueryDist = dist;
                    closestId = id;
                }
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

/**
 * İki çizgi segmentinin kesişip kesişmediğini kontrol eder.
 */
function doSegmentsIntersect(p1, p2, p3, p4) {
    const den = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (den === 0) return false; // Paralel

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / den;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / den;

    // Segmentler üzerinde mi? (0.01 payı ile)
    return (ua > 0 && ua < 1 && ub > 0 && ub < 1);
}

export function buildNavigationGraph(walls, mapWidth, mapHeight) {
    const navGraph = new Graph();
    const cellSize = 40; 

    // 1. Düğümleri oluştur
    for (let x = 70; x < mapWidth - 50; x += cellSize) {
        for (let y = 70; y < mapHeight - 50; y += cellSize) {
            
            let insideWall = false;
            for (let seg of walls) {
                if (pointToSegmentDistance({ x, y }, seg) < 25) {
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

    // 2. Kenarları (Edges) oluştur ve duvar kontrolü yap
    for (let [id1, p1] of navGraph.nodes.entries()) {
        const neighbors = [
            {x: p1.x + cellSize, y: p1.y},
            {x: p1.x - cellSize, y: p1.y},
            {x: p1.x, y: p1.y + cellSize},
            {x: p1.x, y: p1.y - cellSize}
        ];

        for (let nPos of neighbors) {
            const id2 = `${nPos.x}_${nPos.y}`;
            if (navGraph.nodes.has(id2)) {
                const p2 = navGraph.nodes.get(id2);
                
                // Duvar engeli kontrolü
                let crossesWall = false;
                for (let wall of walls) {
                    if (doSegmentsIntersect(p1, p2, wall.a, wall.b)) {
                        crossesWall = true;
                        break;
                    }
                }

                if (!crossesWall) {
                    navGraph.addEdge(id1, id2);
                }
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