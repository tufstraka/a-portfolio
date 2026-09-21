export const PHYSICS_STEP = 1 / 120;
const HALF_WIDTH = 1.22;
const HALF_LENGTH = 2.24;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Circle against the actual oriented footprint, rather than a large car sphere.
export function carContact(x, z, yaw, obstacle) {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    const dx = obstacle.x - x, dz = obstacle.z - z;
    const lx = c * dx - s * dz, lz = s * dx + c * dz;
    const qx = clamp(lx, -HALF_WIDTH, HALF_WIDTH), qz = clamp(lz, -HALF_LENGTH, HALF_LENGTH);
    const ex = lx - qx, ez = lz - qz, distance = Math.hypot(ex, ez);
    if (distance >= obstacle.radius) return null;
    let nx, nz, depth;
    if (distance > 1e-8) {
        nx = -ex / distance; nz = -ez / distance; depth = obstacle.radius - distance;
    } else if (HALF_WIDTH - Math.abs(lx) < HALF_LENGTH - Math.abs(lz)) {
        nx = lx >= 0 ? -1 : 1; nz = 0; depth = obstacle.radius + HALF_WIDTH - Math.abs(lx);
    } else {
        nx = 0; nz = lz >= 0 ? -1 : 1; depth = obstacle.radius + HALF_LENGTH - Math.abs(lz);
    }
    return { nx: c * nx + s * nz, nz: -s * nx + c * nz, depth };
}

export class CollisionSystem {
    constructor(boundary = 300) { this.obstacles = []; this.buildings = []; this.worldBoundary = boundary; }
    addTree(position, radius = .62, height = 6) { this.obstacles.push({ ...position, radius, height }); }
    addBuilding(position, width, depth, height = 10) { this.buildings.push({ ...position, halfWidth: width / 2, halfDepth: depth / 2, height }); }
    isOnRoad() { return true; }
    checkCollision(x, z, yaw = 0, height = 0) {
        const startX = x, startZ = z, contacts = [];
        // Sequential correction handles touching obstacles without cancelling their normals.
        for (let pass = 0; pass < 3; pass++) {
            let changed = false;
            for (const box of this.buildings) {
                if (height >= box.height) continue;
                const hit = carBoxContact(x, z, yaw, box);
                if (!hit) continue;
                x += hit.nx * (hit.depth + .001); z += hit.nz * (hit.depth + .001);
                contacts.push(hit); changed = true;
            }
            for (const obstacle of this.obstacles) {
                if (height >= obstacle.height || Math.abs(x - obstacle.x) > 4 || Math.abs(z - obstacle.z) > 4) continue;
                const hit = carContact(x, z, yaw, obstacle);
                if (!hit) continue;
                x += hit.nx * (hit.depth + .001); z += hit.nz * (hit.depth + .001);
                contacts.push(hit); changed = true;
            }
            if (!changed) break;
        }
        const extentX = Math.abs(Math.cos(yaw)) * HALF_WIDTH + Math.abs(Math.sin(yaw)) * HALF_LENGTH;
        const extentZ = Math.abs(Math.sin(yaw)) * HALF_WIDTH + Math.abs(Math.cos(yaw)) * HALF_LENGTH;
        const bx = clamp(x, -this.worldBoundary + extentX, this.worldBoundary - extentX);
        const bz = clamp(z, -this.worldBoundary + extentZ, this.worldBoundary - extentZ);
        if (bx !== x) contacts.push({ nx: Math.sign(bx - x), nz: 0 });
        if (bz !== z) contacts.push({ nx: 0, nz: Math.sign(bz - z) });
        return { collided: contacts.length > 0, pushX: bx - startX, pushZ: bz - startZ, contacts };
    }
}

// Separating-axis test: exact rectangular walls, including diagonal approaches.
function carBoxContact(x, z, yaw, box) {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    const axes = [[1, 0], [0, 1], [c, -s], [s, c]];
    let best = null;
    for (const [ax, az] of axes) {
        const carExtent = HALF_WIDTH * Math.abs(ax * c - az * s) + HALF_LENGTH * Math.abs(ax * s + az * c);
        const boxExtent = box.halfWidth * Math.abs(ax) + box.halfDepth * Math.abs(az);
        const center = (x - box.x) * ax + (z - box.z) * az;
        const depth = carExtent + boxExtent - Math.abs(center);
        if (depth <= 0) return null;
        if (!best || depth < best.depth) { const sign = center >= 0 ? 1 : -1; best = { nx: ax * sign, nz: az * sign, depth }; }
    }
    return best;
}

export function slideVelocity(vx, vz, contacts) {
    let impact = 0;
    for (const { nx, nz } of contacts) {
        const inward = vx * nx + vz * nz;
        if (inward >= 0) continue;
        impact = Math.max(impact, -inward);
        vx -= inward * nx; vz -= inward * nz;
    }
    return { vx, vz, impact };
}

const pose = p => ({ x: p.x, y: p.y + .5, z: p.z, yaw: p.rotation, roll: p.bodyRoll, pitch: p.bodyPitch });
export class MotionInterpolator {
    reset(p) { this.previous = this.current = pose(p); }
    capture(p) { this.previous = this.current || pose(p); this.current = pose(p); }
    sample(alpha) {
        const a = this.previous, b = this.current, t = clamp(alpha, 0, 1);
        const mix = key => a[key] + (b[key] - a[key]) * t;
        const yawDelta = Math.atan2(Math.sin(b.yaw - a.yaw), Math.cos(b.yaw - a.yaw));
        return { x: mix('x'), y: mix('y'), z: mix('z'), yaw: a.yaw + yawDelta * t, roll: mix('roll'), pitch: mix('pitch') };
    }
}
