export function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

export function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

export function length(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalize(v) {
  const len = length(v);
  return { x: v.x / len, y: v.y / len };
}

export function distance(a, b) {
  return length({ x: a.x - b.x, y: a.y - b.y });
}

export function intersectRaySegment(origin, dir, seg) {
  const v1 = {
    x: origin.x - seg.a.x,
    y: origin.y - seg.a.y
  };

  const v2 = {
    x: seg.b.x - seg.a.x,
    y: seg.b.y - seg.a.y
  };

  const v3 = { x: -dir.y, y: dir.x };

  const dotProd = dot(v2, v3);

  if (Math.abs(dotProd) < 0.000001) return null;

  const t1 = cross(v2, v1) / dotProd;
  const t2 = dot(v1, v3) / dotProd;

  if (t1 >= 0 && t2 >= 0 && t2 <= 1) {
    return {
      x: origin.x + dir.x * t1,
      y: origin.y + dir.y * t1,
      dist: t1
    };
  }

  return null;
}