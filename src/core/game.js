import { Renderer } from "../render/renderer.js";
import { Player } from "../entities/player.js";
import { Enemy } from "../entities/enemy.js";
import { Map } from "../map/map.js";
import { BSPBuilder } from "../map/bsp/bsp_builder.js";
import { Raycaster } from "../vision/raycaster.js";
import { FOV } from "../vision/fov.js";
import { Enemy } from "../entities/enemy.js";
import { Map } from "../map/map.js";
import { findPathAStar } from "../ai/a_star.js";  //Meltem ekleme yapıldı
import { buildNavigationGraph } from "../ai/graph.js";  //meltem ekleme yapıldı
import Point from "../utils/classes/point.js";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    
    this.width = 1200;
    this.height = 700;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.renderer = new Renderer(this.ctx);
    this.lastTime = 0;
    this.gameState = "PLAYING"; 

    this.animationTimer = 0;
    this.keys = {};
    this._initInput();

    this.mapInstance = new Map(this.width, this.height);
    this.walls = this.mapInstance.getWalls();
    this.navGraph = buildNavigationGraph(this.walls, this.width, this.height);  //Meltem ekleme yapıldı

    // Enes Celik - BSP Agac Kurulumu
    const builder = new BSPBuilder();
    this.bspRoot = builder.buildTree(this.walls);

    this.player = {
        pos: new Point(85, 85),
        radius: 6, 
        speed: 140
    };
    this.playerAngle = 0; 
    this.viewAngle = 1.1; 

    this.targetPos = new Point(this.width - 80, this.height - 80);
    this.targetRadius = 15;

    this.enemies = [
        new Enemy(this.width - 80, 85, 80),
        new Enemy(85, this.height - 85, 85),
        new Enemy(this.width - 180, this.height - 180, 75)
    ];

    for (let enemy of this.enemies) {
        enemy.radius = 6; 
        enemy.path = [];
        enemy.forgetTimer = 0;      // Yapay zeka hafiza sayaci
        enemy.lastKnownPos = null;   // Kose donusleri icin son gorulme noktasi
        enemy.pathUpdateTimer = 0;
    }

    _initInput() {
        window.addEventListener("keydown", (e) => { this.keys[e.key.toLowerCase()] = true; });
        window.addEventListener("keyup", (e) => { this.keys[e.key.toLowerCase()] = false; });
    }

    start() {
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(time) {
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        if (this.gameState === "PLAYING") this.update(dt);
        this.render();
        requestAnimationFrame(this.loop.bind(this));
    }

    _linesIntersect(p1, p2, p3, p4) {
        const d = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
        if (d === 0) return false;
        const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / d;
        const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / d;
        return (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1);
    }
// meltem ekleme yapıldı-düşman yapay zekası
for (let enemy of this.enemies) {
        // 1. OYUNCU İLE ARAMIZDAKİ MESAFEYİ VE GÖRÜŞÜ ÖLÇ
        const dxToPlayer = this.player.pos.x - enemy.pos.x;
        const dyToPlayer = this.player.pos.y - enemy.pos.y;
        const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);
        
        // Raycasting ile aramızda duvar var mı bakıyoruz (Enes'in yazdığı fonksiyon)
        const hasLOS = this._hasLineOfSight(enemy.pos, this.player.pos);

        // 2. DURUM MAKİNESİ (STATE MACHINE) GEÇİŞLERİ
        // Eğer oyuncu algılama çemberindeyse (240px) ve arada duvar yoksa (hasLOS): SALDIR!
        if (distToPlayer < 240 && hasLOS) {
            enemy.state = "CHASE";
        } 
        // Eğer oyuncu çok uzaklaştıysa (350px): PES ET VE DEVRİYEYE DÖN!
        else if (distToPlayer > 350) { 
            if (enemy.state === "CHASE") {
                enemy.state = "PATROL";
                enemy.patrolTargetNodeId = null;
                enemy.path = []; // Eski rotayı unut
            }

        // 3. A* BEYNİNİ ÇALIŞTIRMA ZAMANLAYICISI
        // Her milisaniye hesap yapıp bilgisayarı dondurmamak için her 0.15 saniyede bir rota güncelliyoruz.
        enemy.pathUpdateTimer += dt;
        if (enemy.pathUpdateTimer > 0.15 || enemy.path.length === 0) {
            enemy.pathUpdateTimer = 0;
            
            // Düşmanın şu an haritada (Graph) bulunduğu en yakın düğümü bul
            const startNode = this.navGraph.getClosestNode(enemy.pos.x, enemy.pos.y);

            // Eğer kovalama modundaysak hedefe (oyuncuya) doğru rotayı hesapla
            if (enemy.state === "CHASE") {
                const targetNode = this.navGraph.getClosestNode(this.player.pos.x, this.player.pos.y);
                const newPath = findPathAStar(this.navGraph, startNode, targetNode);
                if (newPath) enemy.path = newPath;
            } 
            // Eğer devriye modundaysak rastgele bir düğüm seçip oraya doğru rota hesapla
            else if (enemy.state === "PATROL" && (!enemy.path || enemy.path.length === 0)) {
                const nodeIds = Array.from(this.navGraph.nodes.keys());
                if (nodeIds.length > 0) {
                    enemy.patrolTargetNodeId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
                    const newPath = findPathAStar(this.navGraph, startNode, enemy.patrolTargetNodeId);
                    if (newPath) enemy.path = newPath;
                }
            }

        // 4. BULUNAN ROTADA (WAYPOINT) YUMUŞAKÇA SÜZÜLME (HAREKET)
        let eMoveX = 0, eMoveY = 0;
        
        // Eğer oyuncu dibimizdeyse (130px) ve aramızda duvar yoksa, A* noktalarını boşver düz üstüne atla!
        if (enemy.state === "CHASE" && distToPlayer < 130 && hasLOS) {
            eMoveX = dxToPlayer / distToPlayer;
            eMoveY = dyToPlayer / distToPlayer;
        } 
        // Uzaktaysak senin A* ile bulduğumuz noktalara (Waypoint) sırasıyla yürümeye devam et
        else if (enemy.path && enemy.path.length > 0) {
            const nextNodePos = this.navGraph.nodes.get(enemy.path[0]);
            if (nextNodePos) {
                const dx = nextNodePos.x - enemy.pos.x;
                const dy = nextNodePos.y - enemy.pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Eğer o noktaya 18 piksel kadar yaklaştıysak, listeden sil ve bir sonraki noktaya geç!
                if (dist < 18) { 
                    enemy.path.shift(); 
                } else { 
                    eMoveX = dx / dist; 
                    eMoveY = dy / dist; 
                }
            }

        // 5. BULUNAN YÖNE DOĞRU FİZİKSEL OLARAK İLERLE VE DUVARLARA ÇARPMA
        const currentSpeed = enemy.state === "CHASE" ? enemy.speed : enemy.speed * 0.65;
        if (eMoveX !== 0) {
            let nextEX = enemy.pos.x + eMoveX * currentSpeed * dt;
            let safeE = this._checkAndCorrectWallCollision({ x: nextEX, y: enemy.pos.y }, enemy.radius);
            enemy.pos.x = safeE.x;
        }
        if (eMoveY !== 0) {
            let nextEY = enemy.pos.y + eMoveY * currentSpeed * dt;
            let safeE = this._checkAndCorrectWallCollision({ x: enemy.pos.x, y: nextEY }, enemy.radius);
            enemy.pos.y = safeE.y;
        }

        // 6. OYUNCU YAKALANDI MI? (KAZANMA/KAYBETME KONTROLÜ)
        if (Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer) < (this.player.radius + enemy.radius)) {
            this.gameState = "LOSE";
        }
    }

    _computeRestrictedFOVPoints(origin, centerAngle, viewAngle) {
        const segments = this.raycaster._collect(this.raycaster.root);
        const rawAngles = new Set();
        const points = [];

        const minAngle = centerAngle - viewAngle / 2;
        const maxAngle = centerAngle + viewAngle / 2;
        const maxRayDist = 140;

        for (let seg of segments) {
            for (let p of [seg.a, seg.b]) {
                let a = Math.atan2(p.y - origin.y, p.x - origin.x);
                let diffA = a - centerAngle;
                while (diffA < -Math.PI) diffA += Math.PI * 2;
                while (diffA > Math.PI) diffA -= Math.PI * 2;

                if (Math.abs(diffA) <= viewAngle / 2 + 0.1) {
                    rawAngles.add(a - 0.0001);
                    rawAngles.add(a);
                    rawAngles.add(a + 0.0001);
                }
            }
        }

        rawAngles.add(minAngle);
        rawAngles.add(maxAngle);

        const densitySteps = 35;
        for (let i = 0; i <= densitySteps; i++) {
            const stepAngle = minAngle + (viewAngle * (i / densitySteps));
            rawAngles.add(stepAngle);
        }

        const sortedAngles = Array.from(rawAngles).sort((a, b) => {
            let diffA = a - centerAngle;
            while (diffA < -Math.PI) diffA += Math.PI * 2;
            while (diffA > Math.PI) diffA -= Math.PI * 2;
            let diffB = b - centerAngle;
            while (diffB < -Math.PI) diffB += Math.PI * 2;
            while (diffB > Math.PI) diffB -= Math.PI * 2;
            return diffA - diffB;
        });

        for (let angle of sortedAngles) {
            let diffH = angle - centerAngle;
            while (diffH < -Math.PI) diffH += Math.PI * 2;
            while (diffH > Math.PI) diffH -= Math.PI * 2;
            
            if (Math.abs(diffH) <= viewAngle / 2 + 0.01) {
                const hit = this.raycaster.castRay(origin, angle);
                if (hit && hit.param * 2000 < maxRayDist) {
                    points.push({ point: hit.point, angle: angle });
                } else {
                    points.push({
                        point: new Point(origin.x + Math.cos(angle) * maxRayDist, origin.y + Math.sin(angle) * maxRayDist),
                        angle: angle
                    });
                }
            }
        }
        return points;
    }

    render() {
        // Ozi'nin Dokunuşu: Çizim hamallığı tamamen Renderer sınıfına paslandı!
        this.renderer.clear(this.width, this.height);

        const visibilityPoints = this._computeRestrictedFOVPoints(this.player.pos, this.player.angle, this.viewAngle);
        this.fov.drawShadow(this.ctx, this.player.pos, visibilityPoints, this.width, this.height);
        
        this.renderer.drawRealisticFlashlight(this.player.pos, visibilityPoints);
        this.renderer.drawWalls(this.walls);
        this.renderer.drawTargetGate(this.targetPos, this.targetRadius, this.animationTimer);
        this.renderer.drawPlayer(this.player);
        this.renderer.drawEnemies(this.enemies, this.animationTimer);

        if (this.gameState === "LOSE") {
            this.renderer.drawGameEnd(this.width, this.height, false);
        } else if (this.gameState === "WIN") {
            this.renderer.drawGameEnd(this.width, this.height, true);
        }
    }
}