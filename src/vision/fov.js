import { Raycaster } from "./raycaster.js";
import { intersectRaySegment } from "../physics/intersection.js";
import Point from "../utils/classes/point.js";

export class FOV {
    /**
     * 
     * @param {Raycaster} raycaster 
     */
    constructor(raycaster) {
        this.raycaster = raycaster;

        this.debug = false;
        this.showRays = false;
    }

    /**
     *
     * @param {Point} origin 
     * @returns {Array<{point: Point, dist: number}>}
     */
    compute(origin) {
        const points = this.raycaster.computeVisibility(origin);

        // duplicate / jitter fix
        return this._filter(points);
    }

    draw(ctx, origin, points) {
        if (!points || points.length === 0) return;

        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);

        for (let p of points) {
            ctx.lineTo(p.point.x, p.point.y);
        }

        ctx.closePath();

        ctx.fillStyle = "rgba(255,255,0,0.2)";
        ctx.fill();

        // debug rays
        if (this.showRays) {
            ctx.strokeStyle = "rgba(255,255,0,0.3)";
            for (let p of points) {
                ctx.beginPath();
                ctx.moveTo(origin.x, origin.y);
                ctx.lineTo(p.point.x, p.point.y);
                ctx.stroke();
            }
        }
    }

    // SHADOW
    drawShadow(ctx, origin, points, width, height) {
        // tüm ekranı karart
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, width, height);

        // ışık alanını kes
        ctx.globalCompositeOperation = "destination-out";

        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);

        for (let p of points) {
            ctx.lineTo(p.point.x, p.point.y);
        }

        ctx.closePath();
        ctx.fill();

        // geri al
        ctx.globalCompositeOperation = "source-over";
    }

    _filter(points) {
        const result = [];

        for (let i = 0; i < points.length; i++) {
            const p = points[i];

            // aynı noktaya çok yakın olanları at
            if (i > 0) {
                const prev = points[i - 1];

                const dx = p.point.x - prev.point.x;
                const dy = p.point.y - prev.point.y;

                if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
                    continue;
                }
            }

            result.push(p);
        }

        return result;
    }
}