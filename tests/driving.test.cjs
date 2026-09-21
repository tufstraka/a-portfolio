const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/main.js'), 'utf8');
async function fixture() {
    const driving = await import('../js/driving.js');
    const config = source.slice(source.indexOf('const CONFIG ='), source.indexOf('};', source.indexOf('const CONFIG =')) + 2);
    const physics = source.slice(source.indexOf('class VehiclePhysics'), source.indexOf('// SHADERS -'));
    const engine = source.slice(source.indexOf('class PortfolioEngine'), source.indexOf('const engine = new PortfolioEngine'));
    const ctx = { THREE: require('three'), performance, ...driving };
    vm.createContext(ctx);
    vm.runInContext(config + '\n' + physics + '\n' + engine.replaceAll('import.meta.url', "'file:///portfolio/js/main.js'") + '\nthis.Physics = VehiclePhysics; this.Engine = PortfolioEngine;', ctx);
    return { ...driving, physics: new ctx.Physics(), engine: Object.create(ctx.Engine.prototype) };
}
test('signposts leave the approach and gap open but block actual wood', async () => {
    const { CollisionSystem } = await fixture();
    const world = new CollisionSystem();
    world.addTree({ x: -2.2, z: 0 }, .18, 8); world.addTree({ x: 2.2, z: 0 }, .18, 8);
    for (let z = -12; z <= 12; z += .2) assert.equal(world.checkCollision(0, z, 0).collided, false);
    assert.equal(world.checkCollision(2.2, 2, 0).collided, true);
});
test('tree clearance follows the rotated chassis and jumping clears short props', async () => {
    const { CollisionSystem } = await fixture();
    const world = new CollisionSystem(); world.addTree({ x: 0, z: 0 }, .6, 6);
    assert.equal(world.checkCollision(1.9, 0, 0).collided, false);
    assert.equal(world.checkCollision(1.8, 0, 0).collided, true);
    assert.equal(world.checkCollision(1.9, 0, Math.PI / 2).collided, true);
    assert.equal(world.checkCollision(0, 0, 0, 7).collided, false);
    const hit = world.checkCollision(0, 0, 0);
    assert.ok(Number.isFinite(hit.pushX + hit.pushZ));
    assert.equal(world.checkCollision(hit.pushX, hit.pushZ, 0).collided, false);
});
test('glancing contacts retain tangent speed and moving away is not penalized', async () => {
    const { slideVelocity } = await fixture();
    const contact = [{ nx: 1, nz: 0 }];
    assert.deepEqual(slideVelocity(-3, 20, contact), { vx: 0, vz: 20, impact: 3 });
    assert.deepEqual(slideVelocity(3, -20, contact), { vx: 3, vz: -20, impact: 0 });
});
test('workshop collision follows walls without padding and resolves rotated corners', async () => {
    const { CollisionSystem } = await fixture();
    const world = new CollisionSystem(); world.addBuilding({ x: 0, z: 0 }, 15, 9, 7);
    assert.equal(world.checkCollision(8.8, 0, 0).collided, false);
    assert.equal(world.checkCollision(8.6, 0, 0).collided, true);
    for (const yaw of [0, .3, .8, Math.PI / 2]) {
        const hit = world.checkCollision(7.8, 4.8, yaw);
        assert.equal(hit.collided, true);
        assert.equal(world.checkCollision(7.8 + hit.pushX, 4.8 + hit.pushZ, yaw).collided, false);
    }
    assert.equal(world.checkCollision(0, 0, 0, 8).collided, false);
});
test('boost cannot tunnel through a signpost, and reverse can escape contact', async () => {
    const { physics, CollisionSystem, PHYSICS_STEP } = await fixture();
    const world = new CollisionSystem(); world.addTree({ x: 0, z: 0 }, .18, 8);
    physics.z = -8; physics.speed = 80;
    for (let i = 0; i < 100; i++) physics.update(PHYSICS_STEP, { throttle: 1, brake: 0, steer: 0, boost: true }, world);
    assert.ok(physics.z < -2.4 && Math.abs(physics.speed) < .1);
    const contactZ = physics.z;
    for (let i = 0; i < 120; i++) physics.update(PHYSICS_STEP, { throttle: 0, brake: 1, steer: 0, boost: false }, world);
    assert.ok(physics.z < contactZ - 1 && physics.speed < 0);
});
test('render interpolation progresses smoothly at 60, 90, 144 Hz and across yaw wrap', async () => {
    const { MotionInterpolator, PHYSICS_STEP } = await fixture();
    for (const hz of [60, 90, 144]) {
        const p = { x: 0, y: 0, z: 0, rotation: 0, bodyRoll: 0, bodyPitch: 0 };
        const motion = new MotionInterpolator(); motion.reset(p);
        let accumulator = 0, previous = 0;
        for (let frame = 0; frame < hz; frame++) {
            accumulator += 1 / hz;
            while (accumulator + 1e-12 >= PHYSICS_STEP) { p.z += 20 * PHYSICS_STEP; motion.capture(p); accumulator -= PHYSICS_STEP; }
            const z = motion.sample(accumulator / PHYSICS_STEP).z;
            if (frame > 1) assert.ok(Math.abs((z - previous) - 20 / hz) < 1e-8, `${hz} Hz frame ${frame}`);
            previous = z;
        }
    }
    const motion = new MotionInterpolator();
    const p = { x: 0, y: 0, z: 0, rotation: Math.PI - .1, bodyRoll: 0, bodyPitch: 0 };
    motion.reset(p); p.rotation = -Math.PI + .1; motion.capture(p);
    assert.ok(Math.abs(motion.sample(.5).yaw - Math.PI) < 1e-8);
    p.z = 100; motion.reset(p); assert.equal(motion.sample(.2).z, 100);
});
test('a movable prop slows the car once per contact, not once every frame', async () => {
    const { engine } = await fixture();
    const prop = { position: { x: 0, y: 0, z: 2.4 }, rotation: { x: 0, z: 0 }, userData: { type: 'barrel', collisionRadius: .6, mass: 3, grounded: true, velocityX: 0, velocityY: 0, velocityZ: 0 } };
    engine.interactiveObjects = [prop]; engine.vehiclePhysics = { x: 0, y: 0, z: 0, speed: 20 };
    engine.spawnDustBurst = () => {};
    for (let i = 0; i < 10; i++) engine.updateInteractiveObjects(0, 0, 0, engine.vehiclePhysics.speed, 0);
    assert.ok(Math.abs(engine.vehiclePhysics.speed - 18.8) < 1e-10);
    assert.equal(engine.vehiclePhysics.z, 0);
});
