export class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
    }

    clear(width, height) {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, width, height);
    }

    drawWalls(walls) {
        this.ctx.strokeStyle = "#00f0ff";
        this.ctx.lineWidth = 4;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = "#00f0ff";
        
        for (let seg of walls) {
            this.ctx.beginPath();
            this.ctx.moveTo(seg.a.x, seg.a.y);
            this.ctx.lineTo(seg.b.x, seg.b.y);
            this.ctx.stroke();
        }
        this.ctx.shadowBlur = 0;
    }

    drawTargetGate(targetPos, targetRadius, animationTimer) {
        const pulse = Math.sin(animationTimer * 5) * 3;
        const radius = targetRadius + pulse;

        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = "#00ff66";
        this.ctx.fillStyle = "rgba(0, 255, 102, 0.2)";
        this.ctx.beginPath();
        this.ctx.arc(targetPos.x, targetPos.y, radius + 5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = "#00ff66";
        this.ctx.beginPath();
        this.ctx.arc(targetPos.x, targetPos.y, targetRadius - 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();
        this.ctx.arc(targetPos.x, targetPos.y, radius, animationTimer, animationTimer + Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawRealisticFlashlight(origin, points) {
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

    drawPlayer(player) {
        this.ctx.shadowBlur = 12;
        this.ctx.shadowColor = "#ffffff";
        this.ctx.fillStyle = "#ffffff";
        this.ctx.beginPath();
        this.ctx.arc(player.pos.x, player.pos.y, player.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    drawEnemies(enemies, animationTimer) {
        for (let enemy of enemies) {
            const isChasing = enemy.state === "CHASE";
            
            if (isChasing) {
                const radarPulse = (animationTimer * 40) % 35;
                this.ctx.strokeStyle = `rgba(255, 34, 34, ${1 - radarPulse / 35})`;
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
    }

    drawGameEnd(width, height, isWin) {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        this.ctx.fillRect(0, 0, width, height);

        this.ctx.fillStyle = isWin ? "#00ff66" : "#ff2222";
        this.ctx.font = "bold 54px Arial";
        this.ctx.textAlign = "center";
        
        const mainText = isWin ? "HEDEF NOKTAYA ULASTINIZ!" : "DUSMANA YAKALANDINIZ!";
        this.ctx.fillText(mainText, width / 2, height / 2 - 20);

        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "20px Arial";
        const subText = isWin ? "Basariyla tamamlandi. Yeni bir harita uretmek icin F5 tusuna basiniz." : "Yeniden denemek icin klavyeden F5 tusuna basiniz.";
        this.ctx.fillText(subText, width / 2, height / 2 + 50);
    }
}