import { Renderer } from "../render/renderer.js";
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

    this.raycaster = new Raycaster(this.bspRoot);
    this.fov = new FOV(this.raycaster);
    this.fov.showRays = false; 
  }

  _initInput() {
    window.addEventListener("keydown", (e) => { this.keys[e.key.toLowerCase()] = true; });
    window.addEventListener("keyup", (e) => { this.keys[e.key.toLowerCase()] = false; });
  }

  start() { requestAnimationFrame(this.loop.bind(this)); }

  loop(time) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    if (this.gameState === "PLAYING") this.update(dt);
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }

  _checkAndCorrectWallCollision(pos, radius) {
    let corrected = { x: pos.x, y: pos.y };
    for (let seg of this.walls) {
        const ab = { x: seg.b.x - seg.a.x, y: seg.b.y - seg.a.y };
        const ap = { x: corrected.x - seg.a.x, y: corrected.y - seg.a.y };
        const abLenSq = ab.x * ab.x + ab.y * ab.y;
        if (abLenSq === 0) continue;

        let t = (ap.x * ab.x + ap.y * ab.y) / abLenSq;
        t = Math.max(0, Math.min(1, t));

        const closest = { x: seg.a.x + t * ab.x, y: seg.a.y + t * ab.y };
        const distX = corrected.x - closest.x;
        const distY = corrected.y - closest.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance < radius) {
            const overlap = radius - distance;
            if (distance === 0) { 
                corrected.y -= radius; 
            } else {
                corrected.x += (distX / distance) * overlap;
                corrected.y += (distY / distance) * overlap;
            }
        }
    }
    return corrected;
  }

  _linesIntersect(p1, p2, p3, p4) {
    const d = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (d === 0) return false;
    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / d;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / d;
    return (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1);
  }

  _hasLineOfSight(enemyPos, playerPos) {
    for (let wall of this.walls) {
        if (this._linesIntersect(enemyPos, playerPos, wall.a, wall.b)) {
            return false; 
        }
    }
    return true; 
  }

  update(dt) {
    this.animationTimer += dt;

    let moveX = 0, moveY = 0;
    if (this.keys["w"] || this.keys["arrowup"]) moveY = -1;
    if (this.keys["s"] || this.keys["arrowdown"]) moveY = 1;
    if (this.keys["a"] || this.keys["arrowleft"]) moveX = -1;
    if (this.keys["d"] || this.keys["arrowright"]) moveX = 1;

    if (moveX !== 0 || moveY !== 0) {
        this.playerAngle = Math.atan2(moveY, moveX);
        const len = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= len; moveY /= len;
    }

    if (moveX !== 0) {
        let nextX = this.player.pos.x + moveX * this.player.speed * dt;
        let safe = this._checkAndCorrectWallCollision({ x: nextX, y: this.player.pos.y }, this.player.radius);
        this.player.pos.x = safe.x;
    }
    if (moveY !== 0) {
        let nextY = this.player.pos.y + moveY * this.player.speed * dt;
        let safe = this._checkAndCorrectWallCollision({ x: this.player.pos.x, y: nextY }, this.player.radius);
        this.player.pos.y = safe.y;
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

    const tDx = this.player.pos.x - this.targetPos.x;
    const tDy = this.player.pos.y - this.targetPos.y;
    if (Math.sqrt(tDx * tDx + tDy * tDy) < (this.player.radius + this.targetRadius)) {
        this.gameState = "WIN";
    }
  }

  _drawWalls() {
    this.ctx.strokeStyle = "#00f0ff"; 
    this.ctx.lineWidth = 4;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = "#00f0ff";
    for (let seg of this.walls) {
        this.ctx.beginPath();
        this.ctx.moveTo(seg.a.x, seg.a.y);
        this.ctx.lineTo(seg.b.x, seg.b.y);
        this.ctx.stroke();
    }
    this.ctx.shadowBlur = 0;
  }

  _drawTargetGate() {
    const pulse = Math.sin(this.animationTimer * 5) * 3;
    const radius = this.targetRadius + pulse;

    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = "#00ff66";
    this.ctx.fillStyle = "rgba(0, 255, 102, 0.2)";
    this.ctx.beginPath();
    this.ctx.arc(this.targetPos.x, this.targetPos.y, radius + 5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "#00ff66";
    this.ctx.beginPath();
    this.ctx.arc(this.targetPos.x, this.targetPos.y, this.targetRadius - 2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.arc(this.targetPos.x, this.targetPos.y, radius, this.animationTimer, this.animationTimer + Math.PI * 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
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

  _drawRealisticFlashlight(origin, points) {
    if (!points || points.length === 0) return;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(origin.x, origin.y);
    for (let p of points) {
        this.ctx.lineTo(p.point.x, p.point.y);
    }
    this.ctx.closePath();

    const gradient = this.ctx.createRadialGradient(origin.x, origin.y, 10, origin.x, origin.y, 140);
    gradient.addColorStop(0, "rgba(255, 230, 130, 0.45)"); 
    gradient.addColorStop(0.5, "rgba(255, 215, 100, 0.18)"); 
    gradient.addColorStop(1, "rgba(255, 200, 50, 0.01)");  

    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    this.ctx.restore();
  }

  render() {
    this.renderer.clear();

    const visibilityPoints = this._computeRestrictedFOVPoints(this.player.pos, this.playerAngle, this.viewAngle);
    this.fov.drawShadow(this.ctx, this.player.pos, visibilityPoints, this.width, this.height);
    this._drawRealisticFlashlight(this.player.pos, visibilityPoints);
    
    this._drawWalls();
    this._drawTargetGate(); 
    
    this.ctx.shadowBlur = 12;
    this.ctx.shadowColor = "#ffffff";
    this.ctx.fillStyle = "#ffffff";
    this.ctx.beginPath();
    this.ctx.arc(this.player.pos.x, this.player.pos.y, this.player.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    for (let enemy of this.enemies) {
        const isChasing = enemy.state === "CHASE";
        if (isChasing) {
            const radarPulse = (this.animationTimer * 40) % 35;
            this.ctx.strokeStyle = `rgba(255, 34, 34, ${1 - radarPulse/35})`;
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.arc(enemy.pos.x, enemy.pos.y, enemy.radius + radarPulse, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = isChasing ? "#ff2222" : "#9b59b6";
        this.ctx.fillStyle = isChasing ? "#ff2222" : "#9b59b6";
        this.ctx.beginPath();
        this.ctx.arc(enemy.pos.x, enemy.pos.y, enemy.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = "black";
        this.ctx.beginPath();
        this.ctx.arc(enemy.pos.x, enemy.pos.y, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    if (this.gameState === "LOSE") {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = "#ff2222";
        this.ctx.font = "bold 54px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("DUSMANA YAKALANDINIZ!", this.width / 2, this.height / 2 - 20);
        
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "20px Arial";
        this.ctx.fillText("Yeniden denemek icin klavyeden F5 tusuna basiniz.", this.width / 2, this.height / 2 + 50);
    }

    if (this.gameState === "WIN") {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = "#00ff66";
        this.ctx.font = "bold 54px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("HEDEF NOKTAYA ULASTINIZ!", this.width / 2, this.height / 2 - 20);
        
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "20px Arial";
        this.ctx.fillText("Basariyla tamamlandi. Yeni bir harita uretmek icin F5 tusuna basiniz.", this.width / 2, this.height / 2 + 50);
    }
  }
}