import Point from "../utils/classes/point.js";
import { handleWallCollisions } from "../physics/collision.js";

export class Player {
    constructor(x, y) {
        this.pos = new Point(x, y);
        this.radius = 6; // Yarıçapı 8'den 6'ya düşürdük, dar labirent koridorlarında asla sıkışmayacak!
        this.speed = 130; 
    }

    update(dt, keys, walls) {
        let moveX = 0;
        let moveY = 0;

        if (keys["w"] || keys["ArrowUp"]) moveY = -1;
        if (keys["s"] || keys["ArrowDown"]) moveY = 1;
        if (keys["a"] || keys["ArrowLeft"]) moveX = -1;
        if (keys["d"] || keys["ArrowRight"]) moveX = 1;

        if (moveX !== 0 && moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
        }

        // X Ekseni Hareketi ve Güvenli Fizik Kontrolü
        if (moveX !== 0) {
            let nextX = this.pos.x + moveX * this.speed * dt;
            let checkPos = { x: nextX, y: this.pos.y };
            let safeX = handleWallCollisions(checkPos, this.radius, walls);
            this.pos.x = safeX.x;
        }

        // Y Ekseni Hareketi ve Güvenli Fizik Kontrolü
        if (moveY !== 0) {
            let nextY = this.pos.y + moveY * this.speed * dt;
            let checkPos = { x: this.pos.x, y: nextY };
            let safeY = handleWallCollisions(checkPos, this.radius, walls);
            this.pos.y = safeY.y;
        }
    }
}