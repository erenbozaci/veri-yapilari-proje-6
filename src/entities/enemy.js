import Point from "../utils/classes/point.js";

export class Enemy {
    constructor(x, y, speed = 85) {
        this.pos = new Point(x, y);
        this.radius = 6; // Koridorlara tam oturan milimetrik yarıçap
        this.speed = speed;
        
        // --- MİKROSERVİS DEĞİŞKENLERİ ---
        this.path = []; 
        this.pathUpdateTimer = Math.random() * 0.15; 
        this.isCalculatingPath = false; // Python'a üst üste istek atmamak için kilit
        
        // Yapay zeka durumu: "PATROL" (Devriye), "CHASE" (Agresif Kovalama)
        this.state = "PATROL";
        
        // Düşmanın baktığı yön (Fener için kullanılacak)
        this.angle = 0;
    }

    // Çizim işlemi (Fener hariç bedeni çiziyoruz)
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