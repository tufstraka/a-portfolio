import * as THREE from 'three';
import { soilPatches, soilEdge, surfaceAt } from './terrain-surfaces.js';
import { clearForGrass } from './grass.js';
import { surfaceMaterial } from './surface-materials.js';

export function createTrailScenery(engine) {
    for (const p of soilPatches) {
        const positions = [0, .045, 0], uv = [.5, .5], indices = [];
        for (let i = 0; i <= 64; i++) {
            const a = i / 64 * Math.PI * 2, r = soilEdge(a), x = Math.cos(a) * r, z = Math.sin(a) * r;
            positions.push(x * p.rx, .045, z * p.rz); uv.push(x * .5 + .5, z * .5 + .5);
            if (i < 64) indices.push(0, i + 2, i + 1);
        }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(indices); geo.computeVertexNormals();
        const patch = new THREE.Mesh(geo, surfaceMaterial(p.kind, engine.renderer)); patch.name = p.kind + ' trail'; patch.position.set(p.x, 0, p.z); patch.receiveShadow = true; engine.scene.add(patch);
    }
    // Interleaved sizes, tints and orientations avoid identical repeated scenery.
    const rockGeo = new THREE.IcosahedronGeometry(1, 1);
    const pos = rockGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), f = 1 + .13 * Math.sin(x * 11 + z * 7 + y * 3); pos.setXYZ(i, x * f, y * f, z * f); }
    rockGeo.computeVertexNormals();
    const rocks = new THREE.InstancedMesh(rockGeo, surfaceMaterial('stone', engine.renderer), 64);
    const logs = new THREE.InstancedMesh(new THREE.CylinderGeometry(.3, .38, 3.6, 10), surfaceMaterial('bark', engine.renderer), 14);
    const ends = new THREE.InstancedMesh(new THREE.CircleGeometry(.3, 10), surfaceMaterial('wood', engine.renderer), 28);
    const leaf = new THREE.Shape(); leaf.moveTo(0, 0); leaf.quadraticCurveTo(.45, .5, 0, 1.3); leaf.quadraticCurveTo(-.45, .5, 0, 0);
    const ferns = new THREE.InstancedMesh(new THREE.ShapeGeometry(leaf), new THREE.MeshStandardMaterial({ color: 0x527439, roughness: .88, side: THREE.DoubleSide }), 480);
    const dummy = new THREE.Object3D(), color = new THREE.Color(); let seed = 914, nr = 0, nl = 0, nf = 0;
    const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    for (let attempt = 0; attempt < 500 && (nr < 64 || nl < 14 || nf < 480); attempt++) {
        const x = (rand() - .5) * 260, z = (rand() - .5) * 210;
        if (!clearForGrass(x, z, engine.sections) || surfaceAt(x, z) !== 'grass' || Math.hypot(x + 58, z + 57) < 30) continue;
        const yaw = rand() * Math.PI * 2;
        if (nr < 64) {
            const size = .35 + rand() * 1.05;
            dummy.position.set(x, size * .32, z); dummy.rotation.set(.1, yaw, .15); dummy.scale.set(size, size * .65, size * .8); dummy.updateMatrix(); rocks.setMatrixAt(nr, dummy.matrix);
            color.setHSL(.13 + rand() * .08, .05 + rand() * .13, .55 + rand() * .3); rocks.setColorAt(nr++, color);
            engine.collisionSystem.addTree({ x, z }, size * .83, size);
        }
        if (nl < 14 && attempt % 4 === 0) {
            const lx = x + 3, lz = z + 3;
            dummy.position.set(lx, .35, lz); dummy.rotation.set(Math.PI / 2, 0, yaw); dummy.scale.setScalar(1); dummy.updateMatrix(); logs.setMatrixAt(nl, dummy.matrix);
            // The cylinder's axis after X/Z rotation lies in the XZ plane.
            const dx = -Math.sin(yaw), dz = Math.cos(yaw);
            for (const side of [-1, 1]) { dummy.position.set(lx + dx * 1.81 * side, .35, lz + dz * 1.81 * side); dummy.rotation.set(0, -yaw + (side < 0 ? Math.PI : 0), 0); dummy.updateMatrix(); ends.setMatrixAt(nl * 2 + (side > 0 ? 1 : 0), dummy.matrix); }
            for (const t of [-1.4, -.7, 0, .7, 1.4]) engine.collisionSystem.addTree({ x: lx + dx * t, z: lz + dz * t }, .35, .7);
            nl++;
        }
        if (nf < 480) for (let i = 0; i < 6; i++) {
            dummy.position.set(x + 1.5, .06, z - 1.2); dummy.rotation.set(-.65, yaw + i * Math.PI / 3, .2); dummy.scale.setScalar(.7 + rand() * .7); dummy.updateMatrix(); ferns.setMatrixAt(nf++, dummy.matrix);
        }
    }
    rocks.count = nr; logs.count = nl; ends.count = nl * 2; ferns.count = nf;
    for (const mesh of [rocks, logs, ends, ferns]) { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.castShadow = mesh !== ferns; mesh.receiveShadow = true; engine.scene.add(mesh); }
}
