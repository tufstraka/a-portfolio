const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('every texture and radio URL resolves to a checked-in binary from raw module paths', async () => {
    const { textureUrls, radioUrl } = await import('../js/asset-urls.js');
    assert.equal(Object.keys(textureUrls).length, 13);
    for (const url of [...Object.values(textureUrls), radioUrl]) {
        const bytes = fs.readFileSync(new URL(url));
        assert.ok(bytes.length > 1000);
        if (url.endsWith('.webp')) assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
        const rawModule = new URL('js/asset-urls.js', 'https://example.github.io/a-portfolio/');
        const asset = new URL('../assets/' + url.split('/assets/')[1], rawModule);
        assert.ok(asset.pathname.startsWith('/a-portfolio/assets/'));
    }
});
test('mud and sand regions match their geometry and leave the road clear', async () => {
    const { surfaceAt, soilPatches, soilEdge } = await import('../js/terrain-surfaces.js');
    for (const p of soilPatches) {
        assert.equal(surfaceAt(p.x, p.z), p.kind);
        const angle = .7, r = soilEdge(angle);
        assert.equal(surfaceAt(p.x + Math.cos(angle) * p.rx * r * .99, p.z + Math.sin(angle) * p.rz * r * .99), p.kind);
        assert.notEqual(surfaceAt(p.x + Math.cos(angle) * p.rx * r * 1.1, p.z + Math.sin(angle) * p.rz * r * 1.1), p.kind);
    }
    for (const z of [-120, -30, 0, 50, 70]) assert.equal(surfaceAt(0, z), 'road');
});
test('dirt accumulation depends on distance and surface, and stays bounded', async () => {
    const { accumulateDirt } = await import('../js/terrain-surfaces.js');
    const dirt = { mud: 0, sand: 0 };
    accumulateDirt(dirt, 'road', 100); assert.deepEqual(dirt, { mud: 0, sand: 0 });
    accumulateDirt(dirt, 'mud', 50); assert.equal(dirt.mud, .3); assert.equal(dirt.sand, 0);
    accumulateDirt(dirt, 'sand', 50); assert.equal(dirt.sand, .2);
    accumulateDirt(dirt, 'mud', 10000); accumulateDirt(dirt, 'sand', 10000); assert.deepEqual(dirt, { mud: 1, sand: 1 });
});
test('terrain spray, exhaust and tire marks stay bounded and honor comfort mode', async () => {
    const THREE = await import('three');
    const { TrailEffects } = await import('../js/trail-effects.js');
    const car = new THREE.Group(); car.position.set(-20, .5, 68);
    car.userData.dirt = { mud: { value: 0 }, sand: { value: 0 } }; car.userData.exhaust = new THREE.Vector3(-.78, .24, -2.38);
    const engine = { car, scene: new THREE.Scene(), vehiclePhysics: { x: -20, z: 68, speed: 15, isGrounded: true, rotation: 0 }, state: { quality: 'medium' }, reducedMotion: false };
    const effects = new TrailEffects(engine), positions = effects.positions;
    for (let i = 0; i < 600; i++) effects.update(1 / 60);
    assert.ok(car.userData.dirt.mud.value > .8);
    assert.equal(effects.positions, positions);
    assert.equal(effects.particles.length, 240);
    assert.ok(effects.particles.some(p => p.kind === 'smoke' && p.life > 0));
    assert.ok(effects.particles.some(p => p.kind === 'mud' && p.life > 0));
    assert.equal(effects.tracks.count, 160);
    engine.reducedMotion = true; effects.update(1 / 60);
    assert.ok(effects.alpha.every(a => a === 0));
});
