export const soilPatches = [
    { x: -20, z: 68, rx: 10, rz: 13, kind: 'mud' },
    { x: 23, z: 66, rx: 13, rz: 11, kind: 'sand' },
    { x: -33, z: -24, rx: 12, rz: 9, kind: 'mud' },
    { x: 43, z: 7, rx: 16, rz: 12, kind: 'sand' }
];
export function soilEdge(angle) { return 1 + .065 * Math.sin(angle * 5) + .035 * Math.cos(angle * 9); }
export function surfaceAt(x, z) {
    for (const p of soilPatches) {
        const dx = (x - p.x) / p.rx, dz = (z - p.z) / p.rz;
        if (Math.hypot(dx, dz) <= soilEdge(Math.atan2(dz, dx))) return p.kind;
    }
    if ((Math.abs(x) < 6 && z > -130 && z < 80) || (Math.abs(z - 50) < 6 && Math.abs(x) < 85) || (Math.abs(z + 50) < 6 && x > 0 && x < 72)) return 'road';
    return 'grass';
}

export function accumulateDirt(dirt, surface, distance) {
    if (surface === 'mud') dirt.mud = Math.min(1, dirt.mud + distance * .006);
    if (surface === 'sand') dirt.sand = Math.min(1, dirt.sand + distance * .004);
    return dirt;
}
