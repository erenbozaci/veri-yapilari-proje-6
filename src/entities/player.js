import Point from "../utils/classes/point.js";
import { handleWallCollisions } from "../physics/collision.js";

export class Player {
    constructor(x, y) {
        this.pos = new Point(x, y);
        this.radius = 6; // Dar koridorlar için ideal boyut
        this.speed = 130;
        this.angle = 0; // Görüş alanı (ışık) açısı için eklendi
    }

    update(dt, keys, walls) {
        let moveX = 0;
        let moveY = 0;

        if (keys["w"] || keys["arrowup"]) moveY = -1;
        if (keys["s"] || keys["arrowdown"]) moveY = 1;
        if (keys["a"] || keys["arrowleft"]) moveX = -1;
        if (keys["d"] || keys["arrowright"]) moveX = 1;

        // Karakterin baktığı açıyı güncelle
        if (moveX !== 0 || moveY !== 0) {
            this.angle = Math.atan2(moveY, moveX);
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