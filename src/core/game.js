import { Renderer } from "../render/renderer.js";
import { Player } from "../entities/player.js";
import { Enemy } from "../entities/enemy.js";
import { Map } from "../map/map.js";
import { BSPBuilder } from "../map/bsp/bsp_builder.js";
import { Raycaster } from "../vision/raycaster.js";
import { FOV } from "../vision/fov.js";
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

    // Harita ve Duvar (Segment) Üretimi
    this.mapInstance = new Map(this.width, this.height);
    this.walls = this.mapInstance.getWalls();

    // BSP (Binary Space Partitioning) Ağacı İnşası
    const builder = new BSPBuilder();
    this.bspRoot = builder.buildTree(this.walls);

    // Oğuzhan Malkoç - Oyuncu (Player) Sınıfı ve Konfigürasyonları
    this.player = new Player(85, 85);
    this.viewAngle = 1.1;

    // Hedef Noktası (Çıkış Kapısı)
    this.targetPos = new Point(this.width - 80, this.height - 80);
    this.targetRadius = 15;

    // Düşman (Enemy) Sınıflarının Başlatılması
    this.enemies = [
        new Enemy(this.width - 80, 85, 80),
        new Enemy(85, this.height - 85, 85),
        new Enemy(this.width - 180, this.height - 180, 75)
    ];

    // Işın İzleme (Raycasting) ve Görüş Alanı (FOV) Modülleri
    this.raycaster = new Raycaster(this.bspRoot);
    this.fov = new FOV(this.raycaster);
    this.fov.showRays = false;
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

  // Matematiksel Doğru Kesişim Algoritması
  _linesIntersect(p1, p2, p3, p4) {
      const d = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
      if (d === 0) return false;
      const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / d;
      const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / d;
      return (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1);
  }

  // Görüş Hattı (Line of Sight - LOS) Kontrolü
  _hasLineOfSight(enemyPos, playerPos) {
      for (let wall of this.walls) {
          if (this._linesIntersect(enemyPos, playerPos, wall.a, wall.b)) {
              return false;
          }
      }
      return true;
  }

  // Dairesel Gövde ile Çizgi Segmenti (Duvar) Çarpışma Testi
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

  update(dt) {
      this.animationTimer += dt;
      this.player.update(dt, this.keys, this.walls);

      for (let enemy of this.enemies) {
          const dxToPlayer = this.player.pos.x - enemy.pos.x;
          const dyToPlayer = this.player.pos.y - enemy.pos.y;
          const hasLOS = this._hasLineOfSight(enemy.pos, this.player.pos);
          
          enemy.state = "CHASE";
          enemy.pathUpdateTimer += dt;

          // --- ASENKRON MİKROSERVİS (A*) ENTEGRASYONU ---
          // Gereksiz ağ trafiğini (spam) önlemek için kilit (Mutex) mekanizması kullanılmıştır.
          if (!enemy.isCalculatingPath && (enemy.pathUpdateTimer > 0.3 || enemy.path.length === 0)) {
              enemy.pathUpdateTimer = 0;
              enemy.isCalculatingPath = true; 

              fetch('http://127.0.0.1:5000/get-path', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      start: { x: enemy.pos.x, y: enemy.pos.y },
                      target: { x: this.player.pos.x, y: this.player.pos.y }
                  })
              })
              .then(response => response.json())
              .then(data => {
                  if (data.status === "success" && data.path) {
                      enemy.path = data.path; 
                  }
                  enemy.isCalculatingPath = false;
              })
              .catch(error => {
                  console.error("Mikroservis Bağlantı Hatası:", error);
                  enemy.isCalculatingPath = false;
              });
          }

          let eMoveX = 0, eMoveY = 0;
          const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);

          if (distToPlayer < 130 && hasLOS) {
              // Görüş hattında (LOS) ise doğrudan hedef takibi
              eMoveX = dxToPlayer / distToPlayer;
              eMoveY = dyToPlayer / distToPlayer;
          } else if (enemy.path && enemy.path.length > 0) {
              // Python A* algoritmasının döndürdüğü rota düğümlerinin (Waypoint) takibi
              const nextNodePos = enemy.path[0]; 
              if (nextNodePos) {
                  const dx = nextNodePos.x - enemy.pos.x;
                  const dy = nextNodePos.y - enemy.pos.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  
                  if (dist < 15) { 
                      enemy.path.shift();
                  } else { 
                      eMoveX = dx / dist;
                      eMoveY = dy / dist; 
                  }
              }
          }

          // Görüş konisinin hareket yönüne göre güncellenmesi
          if (eMoveX !== 0 || eMoveY !== 0) {
              enemy.angle = Math.atan2(eMoveY, eMoveX);
          } else {
              enemy.angle += 1.5 * dt;
          }

          const currentSpeed = enemy.speed * 0.75;
          
          // X ve Y eksenlerindeki hareketin ayrı değerlendirilmesi (Sliding effect)
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

          // Çarpışma ve Yakalanma Kontrolü (Oyun Bitişi)
          if (Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer) < (this.player.radius + enemy.radius)) {
              this.gameState = "LOSE";
          }
      }

      // Hedefe Ulaşma Kontrolü (Oyun Kazanımı)
      const tDx = this.player.pos.x - this.targetPos.x;
      const tDy = this.player.pos.y - this.targetPos.y;
      if (Math.sqrt(tDx * tDx + tDy * tDy) < (this.player.radius + this.targetRadius)) {
          this.gameState = "WIN";
      }
  }

  // Düşmanların görüş alanı (FOV) poligonlarının hesaplanması
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

  // Sahne Çizim (Render) İşlemleri
  render() {
      this.renderer.clear(this.width, this.height);
      
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.90)"; 
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.globalCompositeOperation = "lighter";
      
      for (let enemy of this.enemies) {
          let lookAngle = enemy.angle || 0; 
          
          if (enemy.state === "CHASE") {
              lookAngle = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
          }

          let enemyViewAngle = 1.0; 

          const visibilityPoints = this._computeRestrictedFOVPoints(enemy.pos, lookAngle, enemyViewAngle);
          this.renderer.drawRealisticFlashlight(enemy.pos, visibilityPoints);
      }
      
      this.ctx.globalCompositeOperation = "source-over";

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