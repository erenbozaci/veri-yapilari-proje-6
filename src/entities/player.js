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
            this.pos.x += moveX * this.speed * dt;
            let safe = handleWallCollisions(this.pos, this.radius, walls);
            this.pos.x = safe.x;
            this.pos.y = safe.y;
        }

        // Y Ekseni Hareketi ve Güvenli Fizik Kontrolü
        if (moveY !== 0) {
            this.pos.y += moveY * this.speed * dt;
            let safe = handleWallCollisions(this.pos, this.radius, walls);
            this.pos.x = safe.x;
            this.pos.y = safe.y;
        }
    }

    draw(ctx) {
        ctx.fillStyle = "#2ecc71"; 
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}