import Point from "../utils/classes/point.js";
import { handleWallCollisions } from "../physics/collision.js";

export class Enemy {
    constructor(x, y, speed = 85) {
        this.pos = new Point(x, y);
        this.radius = 6; // Koridorlara tam oturan milimetrik yarıçap
        this.speed = speed; 

        this.path = []; 
        this.pathUpdateTimer = Math.random() * 0.15; 
        
        // Yapay zeka durumu: "PATROL" (Devriye), "CHASE" (Agresif Kovalama)
        this.state = "PATROL"; 
        this.patrolTargetNodeId = null; 
        
        // Düşmanın baktığı yön (Fener için kullanılacak)
        this.angle = 0; 
    }

    update(dt, walls) {
        // Eğer gidecek bir yolu yoksa dur (Meltem'in A* algoritması burayı dolduracak)
        if (!this.path || this.path.length === 0) return;

        // Hedef noktayı (sıradaki waypoint) al
        const target = this.path[0];
        
        let dx = target.x - this.pos.x;
        let dy = target.y - this.pos.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

        // Hedefe çok yaklaştıysa o noktayı diziden çıkar (bir sonraki waypoint'e geç)
        if (distanceToTarget < 2) {
            this.path.shift();
            return;
        }

        // Yön vektörünü normalize et (uzunluğu 1 yap)
        let moveX = dx / distanceToTarget;
        let moveY = dy / distanceToTarget;

        // Düşmanın baktığı açıyı radyan cinsinden hesaplıyoruz
        this.angle = Math.atan2(moveY, moveX);

        // X Ekseni Hareketi ve Duvar Kontrolü
        if (moveX !== 0) {
            this.pos.x += moveX * this.speed * dt;
            let safe = handleWallCollisions(this.pos, this.radius, walls);
            this.pos.x = safe.x;
            this.pos.y = safe.y;
        }

        // Y Ekseni Hareketi ve Duvar Kontrolü
        if (moveY !== 0) {
            this.pos.y += moveY * this.speed * dt;
            let safe = handleWallCollisions(this.pos, this.radius, walls);
            this.pos.x = safe.x;
            this.pos.y = safe.y;
        }
    }

    draw(ctx) {
        // Devriyedeyken mor (sinsi), seni fark edip kovalamaya başlayınca parlak kırmızı!
        ctx.fillStyle = this.state === "CHASE" ? "#ff2222" : "#9b59b6"; 
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}