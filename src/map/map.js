import Segment from "./segment.js";
import Point from "../utils/classes/point.js";

export class Map {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.walls = [];
        
        // HÜCRE BOYUTUNU 80'DEN 50'YE DÜŞÜRDÜK: Labirent çok daha devasa ve karmaşık oldu!
        this.cellSize = 50; 
        this.cols = Math.floor((this.width - 100) / this.cellSize);
        this.rows = Math.floor((this.height - 100) / this.cellSize);
        
        this._generateMaze();
    }

    _generateMaze() {
        this.walls = [];
        
        // 1. Dış Çerçeve
        this.walls.push(new Segment(new Point(50, 50), new Point(this.width - 50, 50)));
        this.walls.push(new Segment(new Point(this.width - 50, 50), new Point(this.width - 50, this.height - 50)));
        this.walls.push(new Segment(new Point(this.width - 50, this.height - 50), new Point(this.width - 50, this.height - 50))); // Düzeltme koruması
        this.walls.push(new Segment(new Point(this.width - 50, this.height - 50), new Point(50, this.height - 50)));
        this.walls.push(new Segment(new Point(50, this.height - 50), new Point(50, 50)));

        const grid = [];
        for (let r = 0; r < this.rows; r++) {
            grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                grid[r][c] = {
                    r, c,
                    visited: false,
                    walls: { up: true, right: true, down: true, left: true }
                };
            }
        }

        const stack = [];
        let current = grid[0][0];
        current.visited = true;

        while (true) {
            const neighbors = [];
            const { r, c } = current;

            if (r > 0 && !grid[r - 1][c].visited) neighbors.push({ cell: grid[r - 1][c], dir: 'up' });
            if (c < this.cols - 1 && !grid[r][c + 1].visited) neighbors.push({ cell: grid[r][c + 1], dir: 'right' });
            if (r < this.rows - 1 && !grid[r + 1][c].visited) neighbors.push({ cell: grid[r + 1][c], dir: 'down' });
            if (c > 0 && !grid[r][c - 1].visited) neighbors.push({ cell: grid[r][c - 1], dir: 'left' });

            if (neighbors.length > 0) {
                const nextData = neighbors[Math.floor(Math.random() * neighbors.length)];
                const next = nextData.cell;

                if (nextData.dir === 'up') { current.walls.up = false; next.walls.down = false; }
                if (nextData.dir === 'right') { current.walls.right = false; next.walls.left = false; }
                if (nextData.dir === 'down') { current.walls.down = false; next.walls.up = false; }
                if (nextData.dir === 'left') { current.walls.left = false; next.walls.right = false; }

                next.visited = true;
                stack.push(current);
                current = next;
            } else if (stack.length > 0) {
                current = stack.pop();
            } else {
                break;
            }
        }

        const startX = 50;
        const startY = 50;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = grid[r][c];
                const x1 = startX + c * this.cellSize;
                const y1 = startY + r * this.cellSize;
                const x2 = x1 + this.cellSize;
                const y2 = y1 + this.cellSize;

                if (cell.walls.up && r > 0) {
                    this.walls.push(new Segment(new Point(x1, y1), new Point(x2, y1)));
                }
                if (cell.walls.left && c > 0) {
                    this.walls.push(new Segment(new Point(x1, y1), new Point(x1, y2)));
                }
            }
        }
    }

    getWalls() {
        return this.walls;
    }
}