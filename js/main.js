import { createTrees } from './trees.js';
import { setupRacingHud } from './racing-hud.js';
import { setupRadioMenu } from './radio-menu.js';
import { createRallyCar } from './rally-car.js';
import { surfaceMaterial } from './surface-materials.js';
import { PORTFOLIO_DATA } from './portfolio-data.js';
import { Environment } from './environment.js';
import { applyQuality as configureQuality } from './quality.js';
import { Discoveries } from './discoveries.js';
import { setupTouchInput } from './touch-input.js';
import { Diagnostics } from './diagnostics.js';
const safeStorage = { getItem(key) { try { return window.localStorage.getItem(key); } catch { return null; } }, setItem(key, value) { try { window.localStorage.setItem(key, value); } catch {} } };

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// ============================================
// CUSTOM SHADERS FOR ENHANCED GRAPHICS
// ============================================

// Vignette Shader - Darkens edges for cinematic look
const VignetteShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'offset': { value: 1.0 },
        'darkness': { value: 1.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float offset;
        uniform float darkness;
        varying vec2 vUv;
        void main() {
            vec4 texel = texture2D(tDiffuse, vUv);
            vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
            float vignetteAmount = 1.0 - dot(uv, uv);
            vignetteAmount = clamp(pow(vignetteAmount, darkness), 0.0, 1.0);
            texel.rgb *= vignetteAmount;
            gl_FragColor = texel;
        }
    `
};

// Color Grading Shader - Adjusts contrast, saturation, brightness
const ColorGradingShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'brightness': { value: 0.0 },
        'contrast': { value: 1.0 },
        'saturation': { value: 1.0 },
        'gamma': { value: 1.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float brightness;
        uniform float contrast;
        uniform float saturation;
        uniform float gamma;
        varying vec2 vUv;

        vec3 adjustSaturation(vec3 color, float sat) {
            float gray = dot(color, vec3(0.2126, 0.7152, 0.0722));
            return mix(vec3(gray), color, sat);
        }

        void main() {
            vec4 texel = texture2D(tDiffuse, vUv);

            // Brightness
            texel.rgb += brightness;

            // Contrast
            texel.rgb = (texel.rgb - 0.5) * contrast + 0.5;

            // Saturation
            texel.rgb = adjustSaturation(texel.rgb, saturation);

            // Gamma correction
            texel.rgb = pow(texel.rgb, vec3(1.0 / gamma));

            gl_FragColor = texel;
        }
    `
};

// Film Grain Shader - Subtle noise for cinematic feel
const FilmGrainShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'time': { value: 0.0 },
        'intensity': { value: 0.05 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float intensity;
        varying vec2 vUv;

        float rand(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec4 texel = texture2D(tDiffuse, vUv);
            float noise = rand(vUv + time) * 2.0 - 1.0;
            texel.rgb += noise * intensity;
            gl_FragColor = texel;
        }
    `
};

// Motion Blur Shader - Adds subtle blur based on movement
const MotionBlurShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'velocity': { value: 0.0 },
        'maxBlur': { value: 0.02 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float velocity;
        uniform float maxBlur;
        varying vec2 vUv;

        void main() {
            float blur = velocity * maxBlur;
            vec4 color = vec4(0.0);

            // Radial blur from center
            vec2 dir = vUv - vec2(0.5);

            for(float i = -4.0; i <= 4.0; i += 1.0) {
                vec2 offset = dir * blur * (i / 4.0);
                color += texture2D(tDiffuse, vUv + offset);
            }

            gl_FragColor = color / 9.0;
        }
    `
};

// ============================================
// CAMERA SHAKE SYSTEM
// ============================================

class CameraShake {
    constructor() {
        this.trauma = 0;           // Current trauma level (0-1)
        this.decay = 2.5;          // How fast trauma decays
        this.maxOffset = 0.3;      // Max position offset
        this.maxAngle = 0.02;      // Max rotation offset
        this.frequency = 15;       // Shake frequency

        this.offsetX = 0;
        this.offsetY = 0;
        this.offsetZ = 0;
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = 0;
    }

    // Add trauma (0-1 range, accumulates)
    addTrauma(amount) {
        this.trauma = Math.min(1, this.trauma + amount);
    }

    // Update shake values
    update(delta, time) {
        if (this.trauma <= 0) {
            this.offsetX = this.offsetY = this.offsetZ = 0;
            this.rotationX = this.rotationY = this.rotationZ = 0;
            return;
        }

        // Trauma squared for more dramatic falloff
        const shake = this.trauma * this.trauma;

        // Perlin-like noise using sin waves at different frequencies
        const t = time * this.frequency;

        this.offsetX = this.maxOffset * shake * Math.sin(t * 1.1 + 0.3);
        this.offsetY = this.maxOffset * shake * Math.sin(t * 1.3 + 1.7);
        this.offsetZ = this.maxOffset * shake * Math.sin(t * 0.9 + 2.9);

        this.rotationX = this.maxAngle * shake * Math.sin(t * 1.4 + 0.5);
        this.rotationY = this.maxAngle * shake * Math.sin(t * 1.2 + 1.2);
        this.rotationZ = this.maxAngle * shake * Math.sin(t * 1.5 + 2.1);

        // Decay trauma
        this.trauma = Math.max(0, this.trauma - this.decay * delta);
    }

    // Apply shake to camera
    apply(camera, basePosition, baseRotation) {
        camera.position.x = basePosition.x + this.offsetX;
        camera.position.y = basePosition.y + this.offsetY;
        camera.position.z = basePosition.z + this.offsetZ;

        camera.rotation.x = baseRotation.x + this.rotationX;
        camera.rotation.y = baseRotation.y + this.rotationY;
        camera.rotation.z = baseRotation.z + this.rotationZ;
    }
}

// ============================================
// COMBO SCORING SYSTEM
// ============================================

class ComboSystem {
    constructor() {
        this.score = parseInt(safeStorage.getItem('portfolio_score') || '0');
        this.multiplier = 1;
        this.comboTimer = 0;
        this.comboDecay = 3.0; // seconds before combo resets
        this.lastDriftTime = 0;
        this.driftAccum = 0;
        this.scoreEl = null;
        this.multiplierEl = null;
        this.floatContainer = null;
    }

    init() {
        this.scoreEl = document.getElementById('comboScore');
        this.multiplierEl = document.getElementById('comboMultiplier');
        this.floatContainer = document.getElementById('floatingScores');
        this.updateDisplay();
    }

    addScore(points, label, x, y) {
        const actual = Math.round(points * this.multiplier);
        this.score += actual;
        this.comboTimer = this.comboDecay;
        this.multiplier = Math.min(this.multiplier + 0.2, 5);

        // Save periodically
        if (this.score % 100 < actual) {
            safeStorage.setItem('portfolio_score', this.score.toString());
        }

        this.updateDisplay();
        this.showFloatingScore(`+${actual} ${label}`, x, y);
    }

    update(delta) {
        if (this.comboTimer > 0) {
            this.comboTimer -= delta;
            if (this.comboTimer <= 0) {
                this.multiplier = 1;
                this.updateDisplay();
            }
        }
    }

    updateDisplay() {
        if (this.scoreEl) this.scoreEl.textContent = this.score;
        if (this.multiplierEl) {
            if (this.multiplier > 1) {
                this.multiplierEl.style.display = 'block';
                this.multiplierEl.textContent = `x${this.multiplier.toFixed(1)}`;
            } else {
                this.multiplierEl.style.display = 'none';
            }
        }
    }

    showFloatingScore(text, x, y) {
        if (!this.floatContainer) return;
        const el = document.createElement('div');
        el.className = 'floating-score';
        el.textContent = text;
        el.style.left = (x || (window.innerWidth - 100)) + 'px';
        el.style.top = (y || (window.innerHeight - 100)) + 'px';
        this.floatContainer.appendChild(el);
        setTimeout(() => el.remove(), 1300);
    }
}

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    // Physics - Earth-like (scaled for game units where 1 unit ≈ 1 meter)
    GRAVITY: 9.81,
    CAR_MASS: 1500,              // kg (typical sedan)

    // Movement
    MAX_SPEED: 35,               // ~126 km/h top speed
    ACCELERATION: 12,            // m/s² (sporty car ~0-100 in 8s)
    BRAKE_FORCE: 20,             // m/s² (strong braking)
    REVERSE_MAX_SPEED: 8,        // ~29 km/h reverse

    // Jump (Bruno Simon style!)
    JUMP_FORCE: 12,              // Initial upward velocity
    JUMP_COOLDOWN: 500,          // ms between jumps
    AIR_CONTROL: 0.3,            // Steering control while airborne

    // Friction & Grip
    ROAD_FRICTION: 0.85,         // Asphalt grip
    GRASS_FRICTION: 0.4,         // Much less grip on grass
    ROLLING_RESISTANCE: 0.015,   // Constant drag
    AIR_RESISTANCE: 0.4,         // Drag coefficient

    // Steering
    MAX_STEER_ANGLE: 0.6,        // radians (~35 degrees)
    STEER_SPEED: 3.5,            // How fast steering responds
    STEER_RETURN_SPEED: 5,       // How fast wheel centers

    // Suspension feel
    BODY_ROLL_FACTOR: 0.08,      // How much car leans in turns
    PITCH_FACTOR: 0.04,          // How much car pitches on accel/brake
    SUSPENSION_STIFFNESS: 15,    // Spring rate
    SUSPENSION_DAMPING: 4,       // Damping rate

    // Collision
    CAR_COLLISION_RADIUS: 2.5,   // Bounding sphere for car
    CAR_LENGTH: 4.5,
    CAR_WIDTH: 2.0,
    BUILDING_COLLISION_PADDING: 2,
    TREE_COLLISION_RADIUS: 1.5,
    WORLD_BOUNDARY: 300,         // Invisible wall distance
    COLLISION_BOUNCE: 0.3,       // How much car bounces back

    // Camera
    DEFAULT_CAMERA_DISTANCE: 18,
    DEFAULT_CAMERA_HEIGHT: 8,
    CAMERA_LERP_FACTOR: 0.08,
    CAMERA_SHAKE_DECAY: 0.9,     // How fast shake diminishes

    // Gameplay
    SECTION_DETECTION_RADIUS: 25,
    BOOST_MULTIPLIER: 1.8,

    // Ramps
    RAMP_BOOST: 1.5,             // Speed multiplier when hitting ramp

    // Performance
    TARGET_FPS: 60,
    AUTO_QUALITY_THRESHOLD: 30,

    // Frustum Culling & LOD
    CULLING_ENABLED: true,
    LOD_ENABLED: true,
    LOD_DISTANCES: [30, 60, 120],  // Near, medium, far thresholds
    CHUNK_SIZE: 50,                 // World chunk size for spatial partitioning
    VIEW_DISTANCE: 180,             // Max render distance (reduced for perf)
    BEHIND_CAMERA_CULL: true        // Cull objects behind camera
};

// ============================================
// FRUSTUM CULLING & SPATIAL PARTITIONING
// ============================================

class SpatialPartition {
    constructor(chunkSize = CONFIG.CHUNK_SIZE) {
        this.chunkSize = chunkSize;
        this.chunks = new Map(); // Map<chunkKey, Set<object>>
        this.objectChunks = new Map(); // Map<object, chunkKey>
    }

    getChunkKey(x, z) {
        const cx = Math.floor(x / this.chunkSize);
        const cz = Math.floor(z / this.chunkSize);
        return `${cx},${cz}`;
    }

    add(object, x, z) {
        const key = this.getChunkKey(x, z);
        if (!this.chunks.has(key)) {
            this.chunks.set(key, new Set());
        }
        this.chunks.get(key).add(object);
        this.objectChunks.set(object, key);
    }

    remove(object) {
        const key = this.objectChunks.get(object);
        if (key && this.chunks.has(key)) {
            this.chunks.get(key).delete(object);
        }
        this.objectChunks.delete(object);
    }

    update(object, x, z) {
        const newKey = this.getChunkKey(x, z);
        const oldKey = this.objectChunks.get(object);
        if (newKey !== oldKey) {
            this.remove(object);
            this.add(object, x, z);
        }
    }

    // Get objects in chunks within radius
    getNearbyChunks(x, z, radius) {
        const results = [];
        const chunkRadius = Math.ceil(radius / this.chunkSize);
        const cx = Math.floor(x / this.chunkSize);
        const cz = Math.floor(z / this.chunkSize);

        for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
            for (let dz = -chunkRadius; dz <= chunkRadius; dz++) {
                const key = `${cx + dx},${cz + dz}`;
                if (this.chunks.has(key)) {
                    results.push(...this.chunks.get(key));
                }
            }
        }
        return results;
    }
}

class FrustumCuller {
    constructor(camera) {
        this.camera = camera;
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
        this.cameraDirection = new THREE.Vector3();
        this.tempVector = new THREE.Vector3();
        this.tempSphere = new THREE.Sphere();
    }

    update() {
        this.projScreenMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
        this.camera.getWorldDirection(this.cameraDirection);
    }

    // Check if object is in frustum
    isVisible(object, boundingRadius = 5) {
        if (!CONFIG.CULLING_ENABLED) return true;

        // Get world position
        this.tempVector.setFromMatrixPosition(object.matrixWorld);

        // Create bounding sphere
        this.tempSphere.center.copy(this.tempVector);
        this.tempSphere.radius = boundingRadius;

        return this.frustum.intersectsSphere(this.tempSphere);
    }

    // Check if object is behind camera (more aggressive culling)
    isBehindCamera(objectPosition, cameraPosition, margin = 10) {
        if (!CONFIG.BEHIND_CAMERA_CULL) return false;

        this.tempVector.subVectors(objectPosition, cameraPosition);
        const dot = this.tempVector.dot(this.cameraDirection);

        // Object is behind camera if dot product is negative (with margin)
        return dot < -margin;
    }

    // Get distance from camera
    getDistanceToCamera(objectPosition, cameraPosition) {
        return objectPosition.distanceTo(cameraPosition);
    }

    // Get LOD level based on distance
    getLODLevel(distance) {
        if (!CONFIG.LOD_ENABLED) return 0;

        if (distance < CONFIG.LOD_DISTANCES[0]) return 0; // High detail
        if (distance < CONFIG.LOD_DISTANCES[1]) return 1; // Medium detail
        if (distance < CONFIG.LOD_DISTANCES[2]) return 2; // Low detail
        return 3; // Very low / culled
    }
}

// ============================================
// LOD MANAGER - Manages level of detail for objects
// ============================================

class LODManager {
    constructor() {
        this.lodObjects = new Map(); // Map<object, { levels: [], currentLevel: number }>
    }

    // Register an object with multiple LOD levels
    register(object, levels) {
        // levels = [{ distance: 0, detail: 'high' }, { distance: 60, detail: 'low' }, ...]
        this.lodObjects.set(object, {
            levels: levels,
            currentLevel: 0,
            visible: true
        });
    }

    // Update visibility and detail level
    update(object, distance, isInFrustum) {
        const lodData = this.lodObjects.get(object);
        if (!lodData) return;

        // Determine if should be visible
        const shouldBeVisible = isInFrustum && distance < CONFIG.VIEW_DISTANCE;

        if (lodData.visible !== shouldBeVisible) {
            lodData.visible = shouldBeVisible;
            object.visible = shouldBeVisible;
        }

        if (!shouldBeVisible) return;

        // Determine LOD level
        let newLevel = 0;
        for (let i = 0; i < lodData.levels.length; i++) {
            if (distance >= lodData.levels[i].distance) {
                newLevel = i;
            }
        }

        // Apply LOD changes if level changed
        if (newLevel !== lodData.currentLevel) {
            this.applyLOD(object, lodData.levels[newLevel]);
            lodData.currentLevel = newLevel;
        }
    }

    applyLOD(object, levelConfig) {
        // Apply LOD-specific settings
        object.traverse(child => {
            if (child.isMesh) {
                // Reduce shadow casting at distance
                if (levelConfig.shadows !== undefined) {
                    child.castShadow = levelConfig.shadows;
                    child.receiveShadow = levelConfig.shadows;
                }

                // Simplify materials at distance
                if (levelConfig.simpleMaterial && child.material) {
                    if (!child.userData.originalMaterial) {
                        child.userData.originalMaterial = child.material;
                    }
                    // Could swap to simpler material here
                }
            }
        });
    }
}

// ============================================
// OBJECT POOL - Reuse objects instead of creating/destroying
// ============================================

class ObjectPool {
    constructor(createFn, resetFn, initialSize = 20) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = new Set();

        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    get() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        this.active.add(obj);
        return obj;
    }

    release(obj) {
        if (this.active.has(obj)) {
            this.active.delete(obj);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }

    releaseAll() {
        this.active.forEach(obj => {
            this.resetFn(obj);
            this.pool.push(obj);
        });
        this.active.clear();
    }

    getActiveCount() {
        return this.active.size;
    }
}

// ============================================
// ADAPTIVE QUALITY MANAGER
// ============================================

class AdaptiveQualityManager {
    constructor(engine) {
        this.engine = engine;
        this.fpsHistory = [];
        this.historySize = 60; // Track last 60 FPS readings
        this.lastAdjustTime = 0;
        this.adjustCooldown = 3000; // Wait 3 seconds between adjustments

        // Quality levels with their settings
        this.qualityLevels = {
            ultra: {
                shadowMapSize: 4096,
                pixelRatio: Math.min(window.devicePixelRatio, 2),
                shadowsEnabled: true,
                postProcessing: true,
                particleCount: 1.0,
                viewDistance: 300,
                lodBias: 0
            },
            high: {
                shadowMapSize: 2048,
                pixelRatio: Math.min(window.devicePixelRatio, 1.5),
                shadowsEnabled: true,
                postProcessing: true,
                particleCount: 0.7,
                viewDistance: 250,
                lodBias: 0.5
            },
            medium: {
                shadowMapSize: 1024,
                pixelRatio: Math.min(window.devicePixelRatio, 1),
                shadowsEnabled: true,
                postProcessing: false,
                particleCount: 0.4,
                viewDistance: 180,
                lodBias: 1
            },
            low: {
                shadowMapSize: 512,
                pixelRatio: 1,
                shadowsEnabled: false,
                postProcessing: false,
                particleCount: 0.2,
                viewDistance: 120,
                lodBias: 2
            }
        };
    }

    recordFPS(fps) {
        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > this.historySize) {
            this.fpsHistory.shift();
        }
    }

    getAverageFPS() {
        if (this.fpsHistory.length === 0) return 60;
        return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    }

    shouldDowngrade() {
        const avgFPS = this.getAverageFPS();
        const now = performance.now();

        // Check cooldown
        if (now - this.lastAdjustTime < this.adjustCooldown) return false;

        // Downgrade if average FPS below threshold
        return avgFPS < CONFIG.AUTO_QUALITY_THRESHOLD;
    }

    shouldUpgrade() {
        const avgFPS = this.getAverageFPS();
        const now = performance.now();

        // Check cooldown (longer for upgrades)
        if (now - this.lastAdjustTime < this.adjustCooldown * 2) return false;

        // Upgrade if average FPS consistently high
        return avgFPS > 55 && this.fpsHistory.length >= 30;
    }

    applyQuality(quality) { this.lastAdjustTime = performance.now(); configureQuality(this.engine, quality); }

}

class CollisionSystem {
    constructor() {
        this.buildings = [];
        this.trees = [];
        this.worldBoundary = CONFIG.WORLD_BOUNDARY;
    }

    addBuilding(position, width, depth) {
        this.buildings.push({
            x: position.x,
            z: position.z,
            halfWidth: (width / 2) + CONFIG.BUILDING_COLLISION_PADDING,
            halfDepth: (depth / 2) + CONFIG.BUILDING_COLLISION_PADDING,
            type: 'building'
        });
    }

    addTree(position) {
        this.trees.push({
            x: position.x,
            z: position.z,
            radius: CONFIG.TREE_COLLISION_RADIUS,
            type: 'tree'
        });
    }

    // Open world - no roads, uniform surface everywhere
    isOnRoad(x, z) { return true; }

    pointToSegmentDistance(px, pz, x1, z1, x2, z2) {
        const dx = x2 - x1;
        const dz = z2 - z1;
        const lengthSq = dx * dx + dz * dz;

        if (lengthSq === 0) return Math.sqrt((px - x1) ** 2 + (pz - z1) ** 2);

        let t = Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / lengthSq));
        const nearestX = x1 + t * dx;
        const nearestZ = z1 + t * dz;

        return Math.sqrt((px - nearestX) ** 2 + (pz - nearestZ) ** 2);
    }

    // Check collision and return push-back vector
    checkCollision(x, z, radius) {
        let pushX = 0;
        let pushZ = 0;
        let collided = false;

        // World boundary
        if (x < -this.worldBoundary) { pushX = (-this.worldBoundary - x) + 1; collided = true; }
        if (x > this.worldBoundary) { pushX = (this.worldBoundary - x) - 1; collided = true; }
        if (z < -this.worldBoundary) { pushZ = (-this.worldBoundary - z) + 1; collided = true; }
        if (z > this.worldBoundary) { pushZ = (this.worldBoundary - z) - 1; collided = true; }

        // Building collisions (AABB)
        for (const building of this.buildings) {
            const dx = x - building.x;
            const dz = z - building.z;

            const overlapX = building.halfWidth + radius - Math.abs(dx);
            const overlapZ = building.halfDepth + radius - Math.abs(dz);

            if (overlapX > 0 && overlapZ > 0) {
                collided = true;
                // Push out along the axis with least overlap
                if (overlapX < overlapZ) {
                    pushX += (dx > 0 ? overlapX : -overlapX);
                } else {
                    pushZ += (dz > 0 ? overlapZ : -overlapZ);
                }
            }
        }

        // Tree collisions (circle)
        for (const tree of this.trees) {
            const dx = x - tree.x;
            const dz = z - tree.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const minDist = tree.radius + radius;

            if (dist < minDist && dist > 0) {
                collided = true;
                const overlap = minDist - dist;
                pushX += (dx / dist) * overlap;
                pushZ += (dz / dist) * overlap;
            }
        }

        return { collided, pushX, pushZ };
    }
}

// ============================================
// REALISTIC VEHICLE PHYSICS
// ============================================

class VehiclePhysics {
    constructor() {
        this.reset();
    }

    reset() {
        // Position & rotation
        this.x = 0;
        this.z = 60;
        this.rotation = 0;        // Yaw (heading)
        this.y = 0;               // Height (for suspension/jump)

        // Velocity
        this.velocityX = 0;
        this.velocityZ = 0;
        this.velocityY = 0;       // Vertical velocity for jump
        this.speed = 0;           // Signed speed (+ forward, - backward)
        this.angularVelocity = 0;

        // Drift / slip-angle state
        this.slipAngle = 0;
        this.rearGrip = 1.0;
        this.isDrifting = false;
        this.driftAngle = 0;
        this.velocityHeading = 0; // Direction velocity is actually moving

        // Steering
        this.steerAngle = 0;
        this.targetSteerAngle = 0;

        // Suspension state
        this.bodyRoll = 0;
        this.bodyPitch = 0;

        // Jump state
        this.isGrounded = true;
        this.lastJumpTime = 0;
        this.jumpCount = 0;

        // State
        this.isOnRoad = true;
        this.isColliding = false;
        this.landingImpact = 0;
    }

    // Get terrain height at position
    getTerrainHeight(x, z) {
        // Flat ground - no height variation
        // Visual variation is handled by the shader only
        return 0;
    }

    jump() {
        const now = performance.now();
        if (this.isGrounded && (now - this.lastJumpTime) > CONFIG.JUMP_COOLDOWN) {
            this.velocityY = CONFIG.JUMP_FORCE;
            this.isGrounded = false;
            this.lastJumpTime = now;
            this.jumpCount++;
            return true; // Jump successful
        }
        return false;
    }

    update(delta, input, collisionSystem) {
        // Cap delta to prevent physics explosion
        delta = Math.min(delta, 0.05);

        // Get surface friction (reduced in air)
        this.isOnRoad = collisionSystem.isOnRoad(this.x, this.z);
        const baseFriction = this.isOnRoad ? CONFIG.ROAD_FRICTION : CONFIG.GRASS_FRICTION;
        const friction = this.isGrounded ? baseFriction : baseFriction * CONFIG.AIR_CONTROL;

        // --- SPEED-ADAPTIVE STEERING ---
        const speedNorm = Math.min(Math.abs(this.speed) / CONFIG.MAX_SPEED, 1.0);
        const maxAngle = CONFIG.MAX_STEER_ANGLE * (1.0 - speedNorm * 0.55);
        this.targetSteerAngle = input.steer * maxAngle;

        // Instant response at low speed, damped at high speed
        const steerResponse = THREE.MathUtils.lerp(12.0, 3.5, speedNorm);
        this.steerAngle = THREE.MathUtils.lerp(
            this.steerAngle, 
            this.targetSteerAngle, 
            steerResponse * delta
        );

        // Instant return to center when no input
        if (Math.abs(input.steer) < 0.01) {
            this.steerAngle *= Math.pow(0.001, delta);
        }

        const airFactor = this.isGrounded ? 1 : CONFIG.AIR_CONTROL;
        const effectiveSteer = this.steerAngle * airFactor;

        // --- NON-LINEAR ACCELERATION & BRAKING ---
        let accelerationForce = 0;
        const isMovingForward = this.speed > 0.1;
        const isMovingBackward = this.speed < -0.1;

        const accelMultiplier = this.isGrounded ? 1 : 0.2;

        if (input.throttle > 0) {
            const maxSpeed = input.boost ? CONFIG.MAX_SPEED * CONFIG.BOOST_MULTIPLIER : CONFIG.MAX_SPEED;
            // Non-linear power curve: explosive start, tapering at top
            const powerCurve = 1.0 - Math.pow(Math.abs(this.speed) / maxSpeed, 1.8);
            if (this.speed < maxSpeed) {
                accelerationForce = CONFIG.ACCELERATION * input.throttle * friction * accelMultiplier * Math.max(powerCurve, 0.1);
                if (input.boost) accelerationForce *= 1.5;
            }
        } else if (input.brake > 0) {
            if (isMovingForward) {
                accelerationForce = -CONFIG.BRAKE_FORCE * input.brake * friction * accelMultiplier;
            } else if (this.speed > -CONFIG.REVERSE_MAX_SPEED) {
                accelerationForce = -CONFIG.ACCELERATION * 0.5 * input.brake * friction * accelMultiplier;
            }
        }

        // --- RESISTANCE FORCES ---
        const rollingResistance = this.isGrounded 
            ? -Math.sign(this.speed) * CONFIG.ROLLING_RESISTANCE * CONFIG.CAR_MASS * CONFIG.GRAVITY
            : 0;
        const airResistance = -CONFIG.AIR_RESISTANCE * this.speed * Math.abs(this.speed);

        const totalAcceleration = accelerationForce + (rollingResistance + airResistance) / CONFIG.CAR_MASS;
        this.speed += totalAcceleration * delta;

        // Natural stop at very low speeds
        if (Math.abs(this.speed) < 0.1 && input.throttle === 0 && input.brake === 0 && this.isGrounded) {
            this.speed *= 0.9;
            if (Math.abs(this.speed) < 0.01) this.speed = 0;
        }

        // --- TURNING WITH SLIP-ANGLE DRIFT ---
        if (Math.abs(this.speed) > 0.5 && Math.abs(effectiveSteer) > 0.001) {
            const wheelBase = CONFIG.CAR_LENGTH * 0.6;
            const tanSteer = Math.tan(Math.abs(effectiveSteer));
            const turnRadius = tanSteer > 0.001 ? wheelBase / tanSteer : 1000;
            const angularVel = this.speed / turnRadius * Math.sign(effectiveSteer);

            const turnMultiplier = this.isGrounded ? 1 : CONFIG.AIR_CONTROL;
            this.angularVelocity = angularVel * turnMultiplier;
            this.rotation += this.angularVelocity * delta;
        } else {
            this.angularVelocity *= 0.9; // Decay
        }

        // --- SLIP-ANGLE DRIFT PHYSICS ---
        if (this.isGrounded && Math.abs(this.speed) > 3) {
            // Calculate velocity heading vs car heading
            this.velocityHeading = Math.atan2(this.velocityX, this.velocityZ);
            let rawSlip = this.rotation - this.velocityHeading;
            // Normalize to -PI..PI
            while (rawSlip > Math.PI) rawSlip -= Math.PI * 2;
            while (rawSlip < -Math.PI) rawSlip += Math.PI * 2;
            this.slipAngle = rawSlip;

            // Rear grip loss: speed × steer = less grip
            const gripLoss = speedNorm * Math.abs(this.steerAngle / CONFIG.MAX_STEER_ANGLE) * 1.8;
            // Grass has much less grip
            const surfaceGrip = this.isOnRoad ? 1.0 : 0.5;
            this.rearGrip = Math.max(0.15, (1.0 - gripLoss) * surfaceGrip);

            // Countersteer recovers grip
            if (Math.abs(this.slipAngle) > 0.1 && Math.sign(input.steer) !== Math.sign(this.slipAngle)) {
                this.rearGrip = Math.min(1.0, this.rearGrip + 0.4);
            }

            // Drift threshold
            this.isDrifting = Math.abs(this.slipAngle) > 0.15 && this.rearGrip < 0.7;
            this.driftAngle = this.slipAngle;

            // Apply lateral slide when grip is low
            if (this.rearGrip < 0.9) {
                const slideForce = Math.sin(this.slipAngle) * Math.abs(this.speed) * (1 - this.rearGrip) * 0.4;
                this.x += Math.cos(this.rotation) * slideForce * delta;
                this.z -= Math.sin(this.rotation) * slideForce * delta;
            }
        } else {
            this.slipAngle *= 0.9;
            this.rearGrip = 1.0;
            this.isDrifting = false;
            this.driftAngle = 0;
        }

        // --- STRONGER BODY PITCH ON BRAKE ---
        const brakePitchTarget = (input.brake > 0 && isMovingForward) 
            ? -0.1 * Math.min(Math.abs(this.speed) / 15, 1)
            : (input.throttle > 0 ? 0.03 * input.throttle : 0);

        // --- GRAVITY & VERTICAL PHYSICS ---
        if (!this.isGrounded) {
            this.velocityY -= CONFIG.GRAVITY * delta;
            this.velocityY = Math.max(this.velocityY, -50);
        }

        this.y += this.velocityY * delta;

        const terrainHeight = this.getTerrainHeight(this.x, this.z);

        if (this.y <= terrainHeight) {
            this.y = terrainHeight;
            if (this.velocityY < -2) {
                this.landingImpact = Math.abs(this.velocityY);
                this.velocityY = Math.abs(this.velocityY) * 0.15;
                this.speed *= 0.9;
            } else {
                this.velocityY = 0;
                this.landingImpact = 0;
            }
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
            this.landingImpact = 0;
        }

        this.y = Math.max(this.y, Math.max(0, terrainHeight));

        // --- UPDATE HORIZONTAL POSITION ---
        const prevX = this.x;
        const prevZ = this.z;

        this.velocityX = Math.sin(this.rotation) * this.speed;
        this.velocityZ = Math.cos(this.rotation) * this.speed;

        this.x += this.velocityX * delta;
        this.z += this.velocityZ * delta;

        // --- COLLISION DETECTION WITH REFLECTION BOUNCE ---
        const collision = collisionSystem.checkCollision(this.x, this.z, CONFIG.CAR_COLLISION_RADIUS);

        if (collision.collided) {
            this.isColliding = true;

            // Push car out
            this.x += collision.pushX;
            this.z += collision.pushZ;

            // Reflection bounce: deflect velocity off collision normal
            const normalLen = Math.sqrt(collision.pushX * collision.pushX + collision.pushZ * collision.pushZ);
            if (normalLen > 0.001) {
                const nx = collision.pushX / normalLen;
                const nz = collision.pushZ / normalLen;
                const dot = this.velocityX * nx + this.velocityZ * nz;
                if (dot < 0) {
                    this.velocityX -= 2 * dot * nx * CONFIG.COLLISION_BOUNCE;
                    this.velocityZ -= 2 * dot * nz * CONFIG.COLLISION_BOUNCE;
                    // Recalculate speed and rotation from reflected velocity
                    this.speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityZ * this.velocityZ) * Math.sign(this.speed);
                    this.speed *= (1 - CONFIG.COLLISION_BOUNCE);
                    this.rotation = Math.atan2(this.velocityX, this.velocityZ);
                }
            } else {
                this.speed *= (1 - CONFIG.COLLISION_BOUNCE);
            }

            // Larger rotation on impact
            this.rotation += (Math.random() - 0.5) * 0.25 * Math.min(Math.abs(this.speed) / CONFIG.MAX_SPEED, 1);
        } else {
            this.isColliding = false;
        }

        // --- SUSPENSION / BODY DYNAMICS ---
        const airPitch = this.isGrounded ? 0 : -0.1;

        // Body roll (enhanced during drift)
        const lateralG = this.speed * this.angularVelocity;
        const driftRoll = this.isDrifting ? this.slipAngle * 0.15 : 0;
        const targetRoll = -lateralG * CONFIG.BODY_ROLL_FACTOR + driftRoll;
        this.bodyRoll = THREE.MathUtils.lerp(this.bodyRoll, targetRoll, CONFIG.SUSPENSION_DAMPING * delta);
        this.bodyRoll = THREE.MathUtils.clamp(this.bodyRoll, -0.2, 0.2);

        // Body pitch (stronger nose-dive on brake)
        const targetPitch = this.isGrounded ? brakePitchTarget : airPitch;
        this.bodyPitch = THREE.MathUtils.lerp(this.bodyPitch, targetPitch, 8 * delta);
        this.bodyPitch = THREE.MathUtils.clamp(this.bodyPitch, -0.15, 0.15);

        return {
            x: this.x,
            z: this.z,
            y: this.y + 0.5,
            rotation: this.rotation,
            steerAngle: this.steerAngle,
            bodyRoll: this.bodyRoll,
            bodyPitch: this.bodyPitch,
            speed: this.speed,
            speedKmh: Math.abs(this.speed * 3.6),
            isOnRoad: this.isOnRoad,
            isColliding: this.isColliding,
            isGrounded: this.isGrounded,
            isAirborne: !this.isGrounded,
            landingImpact: this.landingImpact,
            angularVelocity: this.angularVelocity,
            isDrifting: this.isDrifting,
            slipAngle: this.slipAngle,
            rearGrip: this.rearGrip,
            driftAngle: this.driftAngle
        };
    }
}

// ============================================
// SHADERS - PUBG-Style Realistic
// ============================================

// High-quality terrain shader with realistic grass and lighting
const TerrainShader = {
    uniforms: {
        time: { value: 0 },
        grassColor1: { value: new THREE.Color(0x2E5A1C) },  // Dark rich grass
        grassColor2: { value: new THREE.Color(0x4A8F3C) },  // Bright grass
        grassColor3: { value: new THREE.Color(0x6BAF5B) },  // Highlight grass
        dirtColor: { value: new THREE.Color(0x5D4E37) },    // Rich brown dirt
        pathColor: { value: new THREE.Color(0x7A6B5A) },    // Worn path color
        noiseScale: { value: 35.0 },
        sunDirection: { value: new THREE.Vector3(0.4, 0.7, 0.5).normalize() },
        sunColor: { value: new THREE.Color(0xFFFBE8) },
        skyColor: { value: new THREE.Color(0x87CEEB) },
        shadowColor: { value: new THREE.Color(0x2A3A4A) }
    },
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying float vDistanceFromCenter;

        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPos.xyz;
            vDistanceFromCenter = length(worldPos.xz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 grassColor1;
        uniform vec3 grassColor2;
        uniform vec3 grassColor3;
        uniform vec3 dirtColor;
        uniform vec3 pathColor;
        uniform float noiseScale;
        uniform vec3 sunDirection;
        uniform vec3 sunColor;
        uniform vec3 skyColor;
        uniform vec3 shadowColor;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying float vDistanceFromCenter;

        // High quality noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                               -0.577350269189626, 0.024390243902439);
            vec2 i = floor(v + dot(v, C.yy));
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m*m*m;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
            vec3 g;
            g.x = a0.x * x0.x + h.x * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        // Multi-octave noise
        float fbm(vec2 p, int octaves) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            for (int i = 0; i < 6; i++) {
                if (i >= octaves) break;
                value += amplitude * snoise(p * frequency);
                amplitude *= 0.5;
                frequency *= 2.0;
            }
            return value;
        }

        // Voronoi for grass clumps
        float voronoi(vec2 p) {
            vec2 n = floor(p);
            vec2 f = fract(p);
            float md = 8.0;
            for (int j = -1; j <= 1; j++) {
                for (int i = -1; i <= 1; i++) {
                    vec2 g = vec2(float(i), float(j));
                    vec2 o = vec2(snoise(n + g) * 0.5 + 0.5, snoise((n + g) * 1.3) * 0.5 + 0.5);
                    vec2 r = g + o - f;
                    float d = dot(r, r);
                    md = min(md, d);
                }
            }
            return sqrt(md);
        }

        void main() {
            vec2 pos = vWorldPosition.xz;

            // Multi-scale noise layers
            float largeNoise = fbm(pos / noiseScale, 4) * 0.5 + 0.5;
            float mediumNoise = fbm(pos / (noiseScale * 0.4), 3) * 0.5 + 0.5;
            float smallNoise = snoise(pos / 8.0) * 0.5 + 0.5;
            float microNoise = snoise(pos / 2.0) * 0.5 + 0.5;

            // Grass clump pattern using voronoi
            float grassClumps = voronoi(pos / 4.0);

            // Three-tone grass blending
            vec3 grass = mix(grassColor1, grassColor2, smallNoise);
            grass = mix(grass, grassColor3, smoothstep(0.3, 0.7, grassClumps) * 0.4);

            // Add grass blade micro-detail
            float bladeDetail = microNoise * 0.2;
            grass *= (0.85 + bladeDetail);

            // Dirt patches (natural distribution)
            float dirtPattern = smoothstep(0.45, 0.55, largeNoise);
            dirtPattern *= smoothstep(0.4, 0.6, mediumNoise);
            vec3 baseColor = mix(grass, dirtColor, dirtPattern * 0.5);

            // Worn paths near center (where car drives)
            float pathDist = smoothstep(15.0, 8.0, vDistanceFromCenter);
            baseColor = mix(baseColor, pathColor, pathDist * 0.3);

            // Lighting
            float NdotL = max(dot(vNormal, sunDirection), 0.0);
            float shadow = smoothstep(0.0, 0.3, NdotL);

            // Diffuse with soft shadow
            vec3 diffuse = sunColor * NdotL * 0.65;

            // Ambient from sky
            vec3 ambient = mix(shadowColor, skyColor, 0.3) * 0.4;

            // Subsurface scattering approximation for grass
            float sss = pow(max(0.0, dot(-sunDirection, vNormal) + 0.5), 2.0) * 0.15;
            vec3 subsurface = grassColor2 * sss;

            // Final color composition
            vec3 finalColor = baseColor * (ambient + diffuse) + subsurface;

            // Distance fade to horizon color
            float dist = length(vWorldPosition.xz);
            float fogFactor = smoothstep(150.0, 400.0, dist);
            vec3 horizonColor = mix(skyColor, vec3(0.85, 0.9, 0.95), 0.5);
            finalColor = mix(finalColor, horizonColor, fogFactor * 0.6);

            // Slight vignette for depth
            float vignette = 1.0 - smoothstep(200.0, 600.0, dist) * 0.2;
            finalColor *= vignette;

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
};

// ============================================
// GAME ENGINE CLASS
// ============================================

class PortfolioEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.clock = new THREE.Clock();

        this.car = null;
        this.character = null;
        this.sections = [];
        this.buildings = [];
        this.decorations = [];
        this.treePositions = []; // Store tree positions for collision

        this.sunLight = null;
        this.sky = null;

        // Physics & Collision Systems
        this.collisionSystem = new CollisionSystem();
        this.vehiclePhysics = new VehiclePhysics();

        // Performance Optimization Systems
        this.frustumCuller = null; // Initialized after camera
        this.spatialPartition = new SpatialPartition();
        this.lodManager = new LODManager();
        this.cullableObjects = []; // Objects that can be culled
        this.adaptiveQuality = null; // Initialized after engine setup

        // Camera shake system
        this.cameraShake = new CameraShake();

        // Combo scoring system
        this.combo = new ComboSystem();

        // Object pools for particles
        this.dustParticlePool = null;
        this.smokeParticlePool = null;

        // Skid marks system
        this.skidMarks = [];
        this.maxSkidMarks = this.state ? (this.state.quality === 'low' ? 20 : 50) : 50;

        // Day/night cycle
        this.dayTime = 0.35; // Start at mid-morning (0-1, 0.5 = noon)
        this.daySpeed = 1 / 420; // Full cycle in ~100 seconds

        // Ambient sounds
        this.ambientPlaying = false;

        this.state = {
            playerMode: 'driving',
            cameraMode: 'follow',
            cameraDistance: CONFIG.DEFAULT_CAMERA_DISTANCE,
            cameraHeight: CONFIG.DEFAULT_CAMERA_HEIGHT,
            carSpeed: 0,
            currentSection: null,
            keys: {},
            isMobile: this.detectMobile(),
            quality: this.detectQuality(),
            time: 0,
            // Input state
            input: {
                throttle: 0,
                brake: 0,
                steer: 0,
                boost: false
            },
            // Game Feel State
            isBoosting: false,
            wasBoostingLastFrame: false,
            sectionsVisited: new Set(),
            totalDistance: 0,
            lastPosition: null,
            boostStartTime: 0,
            holdingSpaceTime: 0,
            tutorialComplete: safeStorage.getItem('portfolioTutorialComplete') === 'true'
        };

        this.frameCount = 0;
        this.lastFpsTime = performance.now();
        this.fps = 60;

        this.animate = this.animate.bind(this);
        this.onResize = this.onResize.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    detectQuality() {
        if (this.detectMobile()) return 'low';
        // Be aggressive for low-end machines (3GB = reported as 4)
        if (navigator.deviceMemory && navigator.deviceMemory <= 4) return 'low';
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return 'low';
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return 'medium';
        // Check GPU via WebGL renderer info
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
                    // Detect integrated/low-end GPUs
                    if (renderer.includes('intel') || renderer.includes('swiftshader') || renderer.includes('mesa')) {
                        return 'medium';
                    }
                }
            }
        } catch(e) {}
        return 'high';
    }

    async init() {
        try {
            this.updateLoadingProgress(5);

            await this.initRenderer();
            this.updateLoadingProgress(20);

            await this.createScene();
            this.updateLoadingProgress(40);

            await this.createVehicle();
            this.updateLoadingProgress(55);

            this.createPortfolioSections();
            this.updateLoadingProgress(80);

            this.setupEventListeners();
            this.combo.init();
            this.createSidebar();
            this.initDeepLinks();

            this.initRadio();
            this.initMuteButton();
            this.initAnalytics();
            this.initCockpit();
            this.environment = new Environment(this);
            this.discoveries = new Discoveries(this);
            this.diagnostics = new Diagnostics(); setupRadioMenu(this); setupRacingHud(this);
            this.applyQuality(this.state.quality);
            this.updateLoadingProgress(90);

            // Position car at start
            this.car.position.set(0, 0.5, 60);
            this.camera.position.set(0, 12, 80);

            // Initialize physics position
            this.vehiclePhysics.x = 0;
            this.vehiclePhysics.z = 60;
            this.vehiclePhysics.rotation = Math.PI;
            this.car.rotation.y = Math.PI;

            this.renderer.render(this.scene, this.camera);
            this.updateMinimap();
            this.updateLoadingProgress(100);

            // Hide loading screen with style
            setTimeout(() => {
                document.getElementById('loadingScreen').classList.add('hidden');

                // Show tutorial for first-time visitors
                if (!this.state.tutorialComplete) {
                    this.showTutorial();
                } else {
                    this.startLoop();
                    this.showToast('🚗', 'Welcome Back!', 'Drive to any building to explore');
                }
            }, 600);

            // Load non-critical assets progressively
            requestAnimationFrame(() => this.loadEnvironmentDetails());

            // Performance: downgrade materials on low quality

        } catch (error) {
            console.error('Portfolio initialization failed:', error);
            // Show error message to user
            const loadingContent = document.querySelector('.loading-content');
            if (loadingContent) {
                loadingContent.innerHTML = `
                    <div class="loading-logo">⚠️</div>
                    <h1 class="loading-title">Oops!</h1>
                    <p class="loading-subtitle">This world could not start on your device.</p><a href="mailto:keithkadima@gmail.com">Email Keith</a><br><a href="https://github.com/tufstraka">Explore my projects on GitHub</a><br><button onclick="location.reload()">Try again</button>

                `;
            }
        }
    }

    updateLoadingProgress(percent) {
        document.getElementById('loadingBar').style.width = `${percent}%`;

        // Show random loading tips
        const tips = [
            '💡 Use SHIFT for turbo boost!',
            '🎮 Press J to jump over obstacles',
            '🏢 Drive to buildings to see my work',
            '🌅 Watch the day/night cycle',
            '🎨 Graphics adapt to your device',
            '🚗 Drift by turning sharply at speed',
            '🗺️ Check the minimap for directions',
            '⏎ Press SPACE near buildings to enter'
        ];

        const tipEl = document.querySelector('.loading-subtitle');
        if (tipEl && percent < 100) {
            const tip = tips[Math.floor(Math.random() * tips.length)];
            tipEl.textContent = tip;
        }
    }

    // ============================================
    // GAME FEEL & UX METHODS
    // ============================================

    showTutorial() {
        const overlay = document.getElementById('tutorialOverlay');
        overlay.classList.add('active');
        document.getElementById('tutorialStartBtn').focus();

        document.getElementById('tutorialStartBtn').onclick = () => this.closeTutorial();

        document.getElementById('tutorialSkipBtn').onclick = () => this.closeTutorial();
    }

    closeTutorial() {
        const overlay = document.getElementById('tutorialOverlay');
        overlay.classList.remove('active');

        // Mark tutorial as complete
        this.state.tutorialComplete = true;
        safeStorage.setItem('portfolioTutorialComplete', 'true');

        // Start the game
        this.startLoop();
        document.getElementById('gameContainer').focus();

        // Welcome message
        setTimeout(() => {
            this.showToast('🎉', 'Let\'s Go!', 'Drive to the glowing buildings to explore');
        }, 500);
    }

    showToast(icon, title, subtitle, duration = 3500) {
        const toast = document.getElementById('notificationToast');
        const toastIcon = document.getElementById('toastIcon');
        const toastTitle = document.getElementById('toastTitle');
        const toastSubtitle = document.getElementById('toastSubtitle');

        toastIcon.textContent = icon;
        toastTitle.textContent = title;
        toastSubtitle.textContent = subtitle;

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    triggerScreenShake(intensity = 1) {
        if (this.reducedMotion) return;
        if (this.cameraShake) {
            this.cameraShake.addTrauma(intensity * 0.4);
        }
    }

    setBoostLines(active) {
        const lines = document.getElementById('boostLines');
        if (active) {
            lines.classList.add('active');
        } else {
            lines.classList.remove('active');
        }
    }

    updateProgressBar(progress) {
        const bar = document.getElementById('progressBar');
        const fill = document.getElementById('progressBarFill');

        if (progress > 0 && progress < 1) {
            bar.classList.add('active');
            fill.style.width = `${progress * 100}%`;
        } else {
            bar.classList.remove('active');
            fill.style.width = '0%';
        }
    }

    checkAchievements() {
        // First boost achievement
        if (this.state.isBoosting && !this.state.wasBoostingLastFrame) {
            this.state.boostStartTime = this.state.time;
        }

        // Speed demon achievement (boost for 3 seconds)
        if (this.state.isBoosting && 
            this.state.time - this.state.boostStartTime > 3 &&
            !safeStorage.getItem('achievement_speedDemon')) {
            safeStorage.setItem('achievement_speedDemon', 'true');
            this.showToast('🔥', 'Speed Demon!', 'Boosted for 3 seconds straight');
            // Achievement unlocked - subtle celebration
        }

        // Explorer achievement (visit all sections)
        if (this.state.sectionsVisited.size === 5 && 
            !safeStorage.getItem('achievement_explorer')) {
            safeStorage.setItem('achievement_explorer', 'true');
            this.showToast('🏆', 'Explorer!', 'You\'ve visited every section');
            // Achievement unlocked - subtle celebration
        }

        // Track distance for road warrior achievement
        if (this.state.lastPosition && this.car) {
            const dx = this.car.position.x - this.state.lastPosition.x;
            const dz = this.car.position.z - this.state.lastPosition.z;
            this.state.totalDistance += Math.sqrt(dx * dx + dz * dz);

            // Road warrior achievement (drive 1000 units)
            if (this.state.totalDistance > 1000 &&
                !safeStorage.getItem('achievement_roadWarrior')) {
                safeStorage.setItem('achievement_roadWarrior', 'true');
                this.showToast('🛣️', 'Road Warrior!', 'Drove over 1000 units');
            }
        }

        if (this.car) {
            this.state.lastPosition = { 
                x: this.car.position.x, 
                z: this.car.position.z 
            };
        }

        this.state.wasBoostingLastFrame = this.state.isBoosting;
    }

    async initRenderer() {
        const container = document.getElementById('gameContainer');

        // Scene
        this.scene = new THREE.Scene();

        // Camera - Increased near plane to reduce z-fighting
        this.camera = new THREE.PerspectiveCamera(
            65,
            window.innerWidth / window.innerHeight,
            0.5,  // Increased from 0.1 to reduce z-fighting
            this.state.quality === 'ultra' ? 1500 : this.state.quality === 'high' ? 1000 : 500
        );

        // Initialize Frustum Culler after camera is created
        this.frustumCuller = new FrustumCuller(this.camera);

        // Initialize Adaptive Quality Manager
        this.adaptiveQuality = new AdaptiveQualityManager(this);

        // Renderer with PBR support and logarithmic depth buffer for z-fighting fix
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.state.quality !== 'low',
            powerPreference: 'high-performance',
            precision: this.state.isMobile || this.state.quality === 'low' ? 'mediump' : 'highp',
            stencil: false,
            alpha: false,
            logarithmicDepthBuffer: this.state.quality !== 'low'
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Adaptive pixel ratio: aggressive cap for performance
        const maxPixelRatio = this.state.isMobile ? 1.0 : 
            (this.state.quality === 'low' ? 1.0 : 
             this.state.quality === 'medium' ? 1.5 : 2);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));

        // Shadow mapping: quality-dependent
        this.renderer.shadowMap.enabled = (this.state.quality === 'high' || this.state.quality === 'ultra');
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // Don't auto-update shadow map every frame - huge perf save
        this.renderer.shadowMap.autoUpdate = false;
        this.renderer.shadowMap.needsUpdate = true; // Update once on start

        // Better color management
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;  // Slightly reduced from 1.4

        container.appendChild(this.renderer.domElement);

        // CSS2D Renderer for crisp HTML sign labels
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0';
        this.labelRenderer.domElement.style.left = '0';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        this.labelRenderer.domElement.style.zIndex = '5';
        container.appendChild(this.labelRenderer.domElement);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), .15, .3, .95);
        this.composer.addPass(this.bloomPass);
        this.colorGradingPass = new ShaderPass(ColorGradingShader);
        this.colorGradingPass.uniforms['brightness'].value = 0;
        this.colorGradingPass.uniforms['contrast'].value = 1.02;
        this.colorGradingPass.uniforms['saturation'].value = 1.02;
        this.colorGradingPass.uniforms['gamma'].value = 1;
        this.composer.addPass(this.colorGradingPass);
        this.composer.addPass(new OutputPass());
        this.renderer.info.autoReset = false;
    }

    async createScene() {
        // Bruno Simon style: warm, playful open world
        this.scene.background = new THREE.Color(0x88c3e8);

        // Simple warm sky gradient
        const skySegs = this.state.quality === 'low' ? 12 : 24;
        const skyGeo = new THREE.SphereGeometry(800, skySegs, Math.ceil(skySegs / 2));
        this.skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor:    { value: new THREE.Color(0x5ba3d9) }, // soft blue
                bottomColor: { value: new THREE.Color(0xf5deb3) }, // sandy horizon
                offset:  { value: 30 },
                exponent: { value: 0.5 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h,0.0),exponent),0.0)),1.0);
                    #include <tonemapping_fragment>
                    #include <colorspace_fragment>
                }
            `,
            side: THREE.BackSide
        });
        this.scene.add(new THREE.Mesh(skyGeo, this.skyMaterial));

        // Minimal warm fog
        this.scene.fog = new THREE.FogExp2(0xd4b896, this.state.quality === 'low' ? 0.004 : 0.0018);

        // Sun — warm directional light
        this.sunLight = new THREE.DirectionalLight(0xffeecc, this.state.quality === 'low' ? 0 : 1.8);
        this.sunLight.position.set(80, 120, 60);
        if (this.state.quality === 'high' || this.state.quality === 'ultra') {
            this.sunLight.castShadow = true;
            const sz = this.state.quality === 'ultra' ? 1024 : 512;
            this.sunLight.shadow.mapSize.set(sz, sz);
            this.sunLight.shadow.camera.near = 0.5;
            this.sunLight.shadow.camera.far = 300;
            const d = 120;
            Object.assign(this.sunLight.shadow.camera, {left:-d,right:d,top:d,bottom:-d});
            this.sunLight.shadow.bias = -0.0001;
        }
        this.scene.add(this.sunLight);

        // Warm ambient
        const ambIntensity = this.state.quality === 'low' ? 2.0 : 0.9;
        this.ambientLight = new THREE.AmbientLight(0xfff5e0, ambIntensity);
        this.scene.add(this.ambientLight);

        // Hemisphere: warm sky / sandy ground bounce
        if (this.state.quality !== 'low') {
            this.hemiLight = new THREE.HemisphereLight(0x88c3e8, 0xd4a96a, 0.6);
            this.scene.add(this.hemiLight);
        }

        // Flat sandy ground
        this.createGround();
    }

    createGround() {
        const ground=new THREE.Mesh(new THREE.PlaneGeometry(1200,1200),surfaceMaterial('terrain',this.renderer));
        ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;this.scene.add(ground);
    }
    // stub — terrain replaced by flat ground above
    async createTerrain() {}

    createClouds() {
        // Create fluffy clouds using sprites
        const cloudGroup = new THREE.Group();

        // Cloud texture (procedural)
        const cloudCanvas = document.createElement('canvas');
        cloudCanvas.width = 256;
        cloudCanvas.height = 256;
        const ctx = cloudCanvas.getContext('2d');

        // Create soft cloud shape
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);

        const cloudTexture = new THREE.CanvasTexture(cloudCanvas);

        // Create multiple clouds at different positions
        const cloudPositions = [
            { x: 100, y: 200, z: -200, scale: 80 },
            { x: -150, y: 180, z: -300, scale: 100 },
            { x: 200, y: 220, z: -100, scale: 60 },
            { x: -100, y: 190, z: 100, scale: 90 },
            { x: 50, y: 210, z: -400, scale: 120 },
            { x: -200, y: 200, z: -150, scale: 70 },
            { x: 300, y: 230, z: -250, scale: 110 },
            { x: -300, y: 195, z: 50, scale: 85 },
            { x: 150, y: 185, z: 200, scale: 75 },
            { x: -50, y: 215, z: -350, scale: 95 },
        ];

        cloudPositions.forEach(pos => {
            // Each cloud: fewer sprites on lower quality
            const cloudCluster = new THREE.Group();
            const spriteCount = this.state.quality === 'low' ? 2 : (this.state.quality === 'medium' ? 3 : 5);

            for (let i = 0; i < spriteCount; i++) {
                const spriteMaterial = new THREE.SpriteMaterial({
                    map: cloudTexture,
                    transparent: true,
                    opacity: 0.7 + Math.random() * 0.2,
                    depthWrite: false
                });

                const sprite = new THREE.Sprite(spriteMaterial);
                sprite.position.set(
                    (Math.random() - 0.5) * pos.scale * 0.5,
                    (Math.random() - 0.5) * pos.scale * 0.2,
                    (Math.random() - 0.5) * pos.scale * 0.5
                );
                sprite.scale.setScalar(pos.scale * (0.5 + Math.random() * 0.5));
                cloudCluster.add(sprite);
            }

            cloudCluster.position.set(pos.x, pos.y, pos.z);
            cloudGroup.add(cloudCluster);
        });

        this.clouds = cloudGroup;
        this.scene.add(cloudGroup);

        // Add visible sun
        const sunSegments = this.state.quality === 'low' ? 12 : 24;
        const sunGeo = new THREE.SphereGeometry(30, sunSegments, sunSegments);
        const sunMat = new THREE.MeshBasicMaterial({
            color: 0xFFFAE3,
            fog: false
        });
        this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
        this.sunMesh.position.set(400, 300, -200); // Far away in the sky
        this.scene.add(this.sunMesh);

        // Sun glow (larger, transparent)
        const glowGeo = new THREE.SphereGeometry(50, sunSegments, sunSegments);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xFFFFCC,
            transparent: true,
            opacity: 0.3,
            fog: false
        });
        this.sunGlow = new THREE.Mesh(glowGeo, glowMat);
        this.sunGlow.position.copy(this.sunMesh.position);
        this.scene.add(this.sunGlow);
    }

    // Generate realistic procedural grass texture
    createGrassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Base grass green with variation
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 400);
        gradient.addColorStop(0, '#4a7c3f');
        gradient.addColorStop(0.5, '#3d6b34');
        gradient.addColorStop(1, '#2d5a28');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);

        // Add grass blade details
        const grassBladeCount = this.state.quality === 'low' ? 3000 : (this.state.quality === 'medium' ? 8000 : 15000);
        for (let i = 0; i < grassBladeCount; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const length = 3 + Math.random() * 8;
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;

            // Vary grass color
            const brightness = 0.7 + Math.random() * 0.5;
            const hue = 90 + Math.random() * 30; // Green range
            ctx.strokeStyle = `hsl(${hue}, 50%, ${30 * brightness}%)`;
            ctx.lineWidth = 0.5 + Math.random() * 1;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            ctx.stroke();
        }

        // Add some dirt patches
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const radius = 5 + Math.random() * 20;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(101, 78, 50, 0.4)');
            gradient.addColorStop(1, 'rgba(101, 78, 50, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add small flowers/details
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const colors = ['#fff', '#ffeb3b', '#e91e63', '#9c27b0'];
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.beginPath();
            ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        return canvas;
    }

    // Generate realistic asphalt texture
    createAsphaltTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Dark asphalt base
        ctx.fillStyle = '#1a1a1f';
        ctx.fillRect(0, 0, 512, 512);

        // Add aggregate (small stones)
        const aggregateCount = this.state.quality === 'low' ? 5000 : (this.state.quality === 'medium' ? 10000 : 20000);
        for (let i = 0; i < aggregateCount; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = 0.5 + Math.random() * 2.5;
            const brightness = 20 + Math.random() * 50;
            ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness + Math.random() * 10})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add darker patches (oil stains, wear)
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const radiusX = 20 + Math.random() * 60;
            const radiusY = 15 + Math.random() * 40;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(radiusX, radiusY));
            gradient.addColorStop(0, 'rgba(10, 10, 15, 0.5)');
            gradient.addColorStop(1, 'rgba(10, 10, 15, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(x, y, radiusX, radiusY, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add subtle cracks
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            let x = Math.random() * 512;
            let y = Math.random() * 512;
            ctx.moveTo(x, y);
            for (let j = 0; j < 5 + Math.random() * 10; j++) {
                x += (Math.random() - 0.5) * 30;
                y += (Math.random() - 0.5) * 30;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Add lighter worn areas (tire tracks)
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40);
            gradient.addColorStop(0, 'rgba(60, 60, 65, 0.3)');
            gradient.addColorStop(1, 'rgba(60, 60, 65, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 40, 0, Math.PI * 2);
            ctx.fill();
        }

        return canvas;
    }

    // Generate concrete/stone texture for buildings
    createConcreteTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Concrete base color
        ctx.fillStyle = '#8a8a8a';
        ctx.fillRect(0, 0, 256, 256);

        // Add noise/grain
        for (let i = 0; i < 10000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const brightness = 100 + Math.random() * 80;
            ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
            ctx.fillRect(x, y, 1, 1);
        }

        // Add some darker spots
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const radius = 5 + Math.random() * 15;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(60, 60, 60, 0.3)');
            gradient.addColorStop(1, 'rgba(60, 60, 60, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        return canvas;
    }


    // Simple normal map for grass
    createGrassNormalMap() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Base normal (pointing up = rgb(128, 128, 255))
        ctx.fillStyle = 'rgb(128, 128, 255)';
        ctx.fillRect(0, 0, 256, 256);

        // Add random normal variations for grass texture
        const normalGrassCount = this.state.quality === 'low' ? 500 : 2000;
        for (let i = 0; i < normalGrassCount; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const nx = 128 + (Math.random() - 0.5) * 60;
            const ny = 128 + (Math.random() - 0.5) * 60;
            ctx.fillStyle = `rgb(${nx}, ${ny}, 255)`;
            ctx.fillRect(x, y, 2, 2);
        }

        return canvas;
    }

    // Normal map for asphalt bumps
    createAsphaltNormalMap() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Base normal (pointing up)
        ctx.fillStyle = 'rgb(128, 128, 255)';
        ctx.fillRect(0, 0, 256, 256);

        // Add aggregate bump variations
        const normalAsphaltCount = this.state.quality === 'low' ? 1000 : 3000;
        for (let i = 0; i < normalAsphaltCount; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const size = 1 + Math.random() * 3;
            const nx = 128 + (Math.random() - 0.5) * 40;
            const ny = 128 + (Math.random() - 0.5) * 40;
            ctx.fillStyle = `rgb(${nx}, ${ny}, 255)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        return canvas;
    }

    // Modern building facade texture (concrete panels with subtle details)
    createBuildingTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Concrete panel base
        ctx.fillStyle = '#d4d4d8';
        ctx.fillRect(0, 0, 256, 256);

        // Add concrete texture noise
        const concreteCount = this.state.quality === 'low' ? 2000 : 5000;
        for (let i = 0; i < concreteCount; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const brightness = 180 + Math.random() * 50;
            ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness + 5})`;
            ctx.fillRect(x, y, 1, 1);
        }

        // Panel grid lines (horizontal and vertical)
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 2;

        // Horizontal panel lines
        for (let y = 64; y < 256; y += 64) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(256, y);
            ctx.stroke();
        }

        // Vertical panel lines
        for (let x = 64; x < 256; x += 64) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 256);
            ctx.stroke();
        }

        // Add weathering/stains
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const radius = 10 + Math.random() * 25;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(120, 120, 120, 0.2)');
            gradient.addColorStop(1, 'rgba(120, 120, 120, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        return canvas;
    }

    // Normal map for building panels depth
    createBuildingNormalMap() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Base normal
        ctx.fillStyle = 'rgb(128, 128, 255)';
        ctx.fillRect(0, 0, 256, 256);

        // Add panel edge normals (creates inset panel look)
        ctx.fillStyle = 'rgb(100, 128, 255)'; // Left edges
        for (let x = 0; x < 256; x += 64) {
            ctx.fillRect(x, 0, 3, 256);
        }

        ctx.fillStyle = 'rgb(156, 128, 255)'; // Right edges
        for (let x = 61; x < 256; x += 64) {
            ctx.fillRect(x, 0, 3, 256);
        }

        ctx.fillStyle = 'rgb(128, 100, 255)'; // Top edges
        for (let y = 0; y < 256; y += 64) {
            ctx.fillRect(0, y, 256, 3);
        }

        ctx.fillStyle = 'rgb(128, 156, 255)'; // Bottom edges
        for (let y = 61; y < 256; y += 64) {
            ctx.fillRect(0, y, 256, 3);
        }

        // Add surface variation
        for (let i = 0; i < 2000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const nx = 128 + (Math.random() - 0.5) * 20;
            const ny = 128 + (Math.random() - 0.5) * 20;
            ctx.fillStyle = `rgb(${nx}, ${ny}, 255)`;
            ctx.fillRect(x, y, 2, 2);
        }

        return canvas;
    }

    createRoads() {
        // No roads in Bruno Simon style — open sandy world
        // Dirt paths are just visual on the ground texture
    }

    createRoadSegment(from, to, width, height, material, texture, fromRadius = 8, toRadius = 8) {
        const dx = to.x - from.x;
        const dz = to.z - from.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);

        // Direction unit vector
        const dirX = dx / length;
        const dirZ = dz / length;

        // Road extends INTO intersections for seamless connection
        // No shortening - let the road go all the way
        const roadLength = length;

        // Calculate center
        const centerX = from.x + dx / 2;
        const centerZ = from.z + dz / 2;

        // Set texture repeat based on road length
        const textureCopy = texture.clone();
        textureCopy.repeat.set(width / 10, roadLength / 10);
        textureCopy.needsUpdate = true;

        const roadMat = material.clone();
        roadMat.map = textureCopy;

        // Road is slightly below intersections so they blend on top
        const roadGeom = new THREE.BoxGeometry(width, height, roadLength);
        const road = new THREE.Mesh(roadGeom, roadMat);

        road.position.set(centerX, height / 2, centerZ);
        road.rotation.y = -angle;
        road.receiveShadow = true;
        this.scene.add(road);

        // Add road markings (skip the parts under intersections)
        this.addRoadMarkings(from, to, length, angle, roadLength, width, fromRadius, toRadius);
    }

    addRoadMarkings(from, to, length, angle, roadLength, roadWidth, fromRadius = 8, toRadius = 8) {
        const dx = to.x - from.x;
        const dz = to.z - from.z;
        const dirX = dx / length;
        const dirZ = dz / length;

        // Markings only in the middle section (not under intersections)
        const markingStart = fromRadius + 2;
        const markingEnd = length - toRadius - 2;
        const markingLength = markingEnd - markingStart;

        if (markingLength <= 0) return; // Too short for markings

        // White dashed center line
        const dashLength = 4;
        const gapLength = 4;
        const numDashes = Math.floor(markingLength / (dashLength + gapLength));

        const lineMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.9,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2
        });

        // Start position for markings
        const startX = from.x + dirX * markingStart;
        const startZ = from.z + dirZ * markingStart;

        for (let i = 0; i < numDashes; i++) {
            const progress = (i * (dashLength + gapLength) + dashLength / 2) / markingLength;
            if (progress > 1) break;

            const dashGeom = new THREE.BoxGeometry(0.2, 0.02, dashLength);
            const dash = new THREE.Mesh(dashGeom, lineMaterial);

            dash.position.set(
                startX + dirX * progress * markingLength,
                0.08,
                startZ + dirZ * progress * markingLength
            );
            dash.rotation.y = -angle;
            this.scene.add(dash);
        }

        // Edge lines - also shortened to avoid intersections
        const edgeLength = markingLength;
        const edgeCenterX = from.x + dirX * (markingStart + markingLength / 2);
        const edgeCenterZ = from.z + dirZ * (markingStart + markingLength / 2);

        [-1, 1].forEach(side => {
            const edgeGeom = new THREE.BoxGeometry(0.15, 0.02, edgeLength);
            const edge = new THREE.Mesh(edgeGeom, lineMaterial);

            const offset = (roadWidth / 2 - 0.3) * side;

            edge.position.set(
                edgeCenterX + Math.cos(angle) * offset,
                0.08,
                edgeCenterZ - Math.sin(angle) * offset
            );
            edge.rotation.y = -angle;
            this.scene.add(edge);
        });
    }

    createIntersection(x, z, radius, material) {
        // Flat circle that sits on top of roads for smooth blending
        const geometry = new THREE.CircleGeometry(radius, 48);

        const intersectionMat = material ? material.clone() : new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.9,
            metalness: 0.0
        });

        // Intersection sits slightly above roads
        intersectionMat.polygonOffset = true;
        intersectionMat.polygonOffsetFactor = -2;
        intersectionMat.polygonOffsetUnits = -2;

        const intersection = new THREE.Mesh(geometry, intersectionMat);
        intersection.rotation.x = -Math.PI / 2; // Lay flat
        intersection.position.set(x, 0.06, z);
        intersection.receiveShadow = true;
        this.scene.add(intersection);
    }

    createRoadTexture() {
        const canvas = document.createElement('canvas');
        const texSize = this.state.quality === 'low' ? 512 : (this.state.quality === 'medium' ? 1024 : 2048);
        canvas.width = texSize;
        canvas.height = texSize;
        const ctx = canvas.getContext('2d');

        // Dark asphalt base with slight blue tint
        const gradient = ctx.createLinearGradient(0, 0, texSize, 0);
        gradient.addColorStop(0, '#2a2a2f');
        gradient.addColorStop(0.5, '#303035');
        gradient.addColorStop(1, '#2a2a2f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, texSize, texSize);

        // Add realistic asphalt texture - particle count scales with texture size
        const particleCount = Math.round((texSize / 2048) * (texSize / 2048) * 60000);
        for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * texSize;
            const y = Math.random() * 2048;
            const size = Math.random() * 3 + 1;
            const brightness = 35 + Math.random() * 40;
            ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness + Math.random() * 5})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add occasional lighter patches (repaired sections)
        for (let i = 0; i < 12; i++) {
            const x = Math.random() * 1800 + 100;
            const y = Math.random() * 1800 + 100;
            const w = Math.random() * 120 + 60;
            const h = Math.random() * 120 + 60;
            ctx.fillStyle = `rgba(60, 60, 65, ${Math.random() * 0.3 + 0.2})`;
            ctx.fillRect(x, y, w, h);
        }

        // Add tire marks (subtle)
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.15)';
        ctx.lineWidth = 6;
        for (let i = 0; i < 7; i++) {
            ctx.beginPath();
            const startX = 600 + Math.random() * 200;
            ctx.moveTo(startX, 0);
            ctx.bezierCurveTo(
                startX + Math.random() * 100 - 50, 600,
                startX + Math.random() * 100 - 50, 1400,
                startX + Math.random() * 200 - 100, 2048
            );
            ctx.stroke();
        }

        // Center line (dashed yellow/white)
        ctx.strokeStyle = '#E8E8E0';
        ctx.lineWidth = 18;
        ctx.setLineDash([100, 80]);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(1024, 0);
        ctx.lineTo(1024, 2048);
        ctx.stroke();

        // Edge lines (solid white)
        ctx.setLineDash([]);
        ctx.strokeStyle = '#F0F0E8';
        ctx.lineWidth = 15;

        // Left edge
        ctx.beginPath();
        ctx.moveTo(120, 0);
        ctx.lineTo(120, 2048);
        ctx.stroke();

        // Right edge
        ctx.beginPath();
        ctx.moveTo(1928, 0);
        ctx.lineTo(1928, 2048);
        ctx.stroke();

        // Add subtle wear on lines
        ctx.strokeStyle = 'rgba(42, 42, 42, 0.3)';
        ctx.lineWidth = 3;
        for (let y = 0; y < 2048; y += 30) {
            if (Math.random() > 0.7) {
                ctx.beginPath();
                ctx.moveTo(110 + Math.random() * 20, y);
                ctx.lineTo(110 + Math.random() * 20, y + 20);
                ctx.stroke();
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy(); // Sharp at angles
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;

        return texture;
    }

    async createVehicle() {
        const {car:carGroup,wheels}=createRallyCar(this.renderer);
        this.wheels=wheels;

        carGroup.position.set(0, 0.6, 60);

        // Initialize engine sound
        this.initializeSound();

        this.car = carGroup;
        this.scene.add(this.car);

        // Add headlights to car
        // Headlights only on high/ultra (spotlights are expensive)
        if (this.state.quality === 'high' || this.state.quality === 'ultra') {
            this.createHeadlights();
        }

        // Start ambient sounds
        this.startAmbientSounds();
    }

    initializeSound() {
        // Create Audio Context (Web Audio API)
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterAudio = this.audioContext.createGain();
        this.masterAudio.gain.value = Number(safeStorage.getItem('keith_volume') || .45);
        this.masterAudio.connect(this.audioContext.destination);

        // Realistic engine sound using multiple oscillators (harmonics)
        // Real engines have multiple cylinder firings creating complex waveforms
        this.engineOscillators = [];
        this.engineGains = [];

        // Create master gain and compressor for overall engine volume
        this.engineMasterGain = this.audioContext.createGain();
        this.engineMasterGain.gain.value = 0;

        // Add dynamics compressor to prevent clipping
        this.engineCompressor = this.audioContext.createDynamicsCompressor();
        this.engineCompressor.threshold.value = -20;
        this.engineCompressor.knee.value = 10;
        this.engineCompressor.ratio.value = 4;

        // Main engine filter (low-pass to simulate muffler)
        this.engineFilter = this.audioContext.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.value = 800;
        this.engineFilter.Q.value = 2;

        // Create 4 harmonics for a 4-cylinder engine feel
        const harmonicRatios = [1, 2, 3, 4]; // Fundamental + harmonics
        const harmonicVolumes = [0.5, 0.3, 0.15, 0.05]; // Decreasing volume
        const waveTypes = ['sawtooth', 'square', 'triangle', 'sine'];

        harmonicRatios.forEach((ratio, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = waveTypes[i];
            osc.frequency.value = 40 * ratio; // Base 40Hz (idle)
            gain.gain.value = harmonicVolumes[i];

            osc.connect(gain);
            gain.connect(this.engineFilter);
            osc.start();

            this.engineOscillators.push(osc);
            this.engineGains.push(gain);
        });

        // Add subtle noise for engine rumble texture
        this.engineNoise = this.audioContext.createBufferSource();
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 2, this.audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * 0.1;
        }
        this.engineNoise.buffer = noiseBuffer;
        this.engineNoise.loop = true;

        this.noiseGain = this.audioContext.createGain();
        this.noiseGain.gain.value = 0;
        this.noiseFilter = this.audioContext.createBiquadFilter();
        this.noiseFilter.type = 'bandpass';
        this.noiseFilter.frequency.value = 200;
        this.noiseFilter.Q.value = 5;

        this.engineNoise.connect(this.noiseFilter);
        this.noiseFilter.connect(this.noiseGain);
        this.noiseGain.connect(this.engineFilter);
        this.engineNoise.start();

        // Connect everything
        this.engineFilter.connect(this.engineCompressor);
        this.engineCompressor.connect(this.engineMasterGain);
        this.engineMasterGain.connect(this.masterAudio || this.audioContext.destination);

        this.engineStarted = false;
        this.lastCollisionSound = 0;
    }

    playCollisionSound(intensity = 1) {
        if (!this.audioContext || this.muted) return;

        const now = Date.now();
        if (now - this.lastCollisionSound < 200) return;
        this.lastCollisionSound = now;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Create impact sound using white noise burst
        const duration = 0.15;
        const audioBuffer = this.audioContext.createBuffer(
            1,
            this.audioContext.sampleRate * duration,
            this.audioContext.sampleRate
        );
        const data = audioBuffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const decay = 1 - (i / data.length);
            data[i] = (Math.random() * 2 - 1) * decay * decay;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;

        const impactGain = this.audioContext.createGain();
        const impactFilter = this.audioContext.createBiquadFilter();

        impactFilter.type = 'bandpass';
        impactFilter.frequency.value = 400 + intensity * 300;
        impactFilter.Q.value = 2;

        impactGain.gain.value = Math.min(intensity * 0.4, 0.6);

        source.connect(impactFilter);
        impactFilter.connect(impactGain);
        impactGain.connect(this.masterAudio || this.audioContext.destination);

        source.start();
        source.stop(this.audioContext.currentTime + duration);
    }

    playLandingSound(intensity = 1) {
        if (!this.audioContext || this.muted) return;

        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Low thud for landing
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.value = 60;

        gain.gain.value = Math.min(intensity * 0.3, 0.5);
        gain.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + 0.3
        );

        osc.connect(gain);
        gain.connect(this.masterAudio || this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    // ⚡ GAME FEEL: Particle system for landing dust/sparks
    spawnLandingParticles(count = 8) {
        if (!this.car || this.state.quality === 'low') return;

        // Limit active particles for performance
        if (!this.particlePool) {
            this.particlePool = [];
            this.activeParticles = [];
        }

        // Cap max active particles
        if (this.activeParticles.length > 30) return;

        const carPos = this.car.position;
        const spawnCount = this.state.quality === 'medium' ? Math.ceil(count / 2) : count;

        for (let i = 0; i < spawnCount; i++) {
            let particle;

            // Object pooling - reuse particles
            if (this.particlePool.length > 0) {
                particle = this.particlePool.pop();
                particle.visible = true;
            } else {
                const geometry = new THREE.SphereGeometry(0.15, 6, 6);
                const material = new THREE.MeshBasicMaterial({
                    color: 0xD4A373,
                    transparent: true,
                    opacity: 0.8
                });
                particle = new THREE.Mesh(geometry, material);
                this.scene.add(particle);
            }

            // Position around car wheels
            const angle = Math.random() * Math.PI * 2;
            const radius = 1.5 + Math.random() * 1;
            particle.position.set(
                carPos.x + Math.cos(angle) * radius,
                carPos.y + 0.2,
                carPos.z + Math.sin(angle) * radius
            );

            // Random velocity
            particle.userData.velocity = {
                x: (Math.random() - 0.5) * 8,
                y: 2 + Math.random() * 4,
                z: (Math.random() - 0.5) * 8
            };
            particle.userData.life = 1.0;
            particle.userData.decay = 0.02 + Math.random() * 0.02;

            this.activeParticles.push(particle);
        }
    }

    updateParticles(delta) {
        if (!this.activeParticles) return;

        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];

            // Update position
            p.position.x += p.userData.velocity.x * delta;
            p.position.y += p.userData.velocity.y * delta;
            p.position.z += p.userData.velocity.z * delta;

            // Apply gravity
            p.userData.velocity.y -= 15 * delta;

            // Fade out
            p.userData.life -= p.userData.decay;
            p.material.opacity = p.userData.life * 0.8;
            p.scale.setScalar(p.userData.life);

            // Remove dead particles (return to pool)
            if (p.userData.life <= 0) {
                p.visible = false;
                this.particlePool.push(p);
                this.activeParticles.splice(i, 1);
            }
        }
    }

    updateEngineSound() {
        if (!this.audioContext || !this.vehiclePhysics || !this.engineOscillators) return;

        const speed = Math.abs(this.vehiclePhysics.speed);
        const speedKmh = speed * 3.6;
        const throttle = this.state.input.throttle;

        // Resume audio context if needed (browser autoplay policy)
        if (this.audioContext.state === 'suspended' && throttle > 0 && !this.muted) {
            this.audioContext.resume();
        }

        // Simulate realistic RPM based on speed and throttle
        // Idle: 800 RPM, Redline: ~6500 RPM
        // For audio, we map this to frequencies (divide by ~100)
        const idleFreq = 35;  // ~800 RPM
        const maxFreq = 120;  // ~6500 RPM at high speed

        // RPM increases with speed but also responds to throttle
        const speedFactor = Math.min(speedKmh / 140, 1); // Max at 140 km/h
        const baseFreq = idleFreq + speedFactor * (maxFreq - idleFreq);

        // Throttle adds extra revs (like pressing gas while not fully accelerating)
        const throttleBoost = throttle * 15;
        const targetFreq = baseFreq + throttleBoost;

        // Smooth frequency transition (engine doesn't instantly change RPM)
        const freqSmoothing = 0.08;

        // Update all harmonics
        const harmonicRatios = [1, 2, 3, 4];
        this.engineOscillators.forEach((osc, i) => {
            const currentFreq = osc.frequency.value;
            const targetHarmonicFreq = targetFreq * harmonicRatios[i];
            osc.frequency.value = currentFreq + (targetHarmonicFreq - currentFreq) * freqSmoothing;
        });

        // Volume based on throttle, speed, and boost
        let targetVolume = 0.04; // Idle volume (subtle)

        if (throttle > 0) {
            // Accelerating: louder
            targetVolume = 0.08 + throttle * 0.1 + speedFactor * 0.05;
        } else if (speed > 2) {
            // Coasting at speed: medium volume
            targetVolume = 0.05 + speedFactor * 0.04;
        }

        // Boost: significantly louder and higher filter cutoff
        if (this.state.input.boost && throttle > 0) {
            targetVolume = 0.18;
            this.engineFilter.frequency.value = 1500 + speedFactor * 1000;
            this.noiseGain.gain.value = 0.03; // More rumble during boost
        } else {
            // Normal filter follows speed
            this.engineFilter.frequency.value = 600 + speedFactor * 600 + throttle * 200;
            this.noiseGain.gain.value = 0.01 + throttle * 0.015;
        }

        // Smooth volume change
        const currentVol = this.engineMasterGain.gain.value;
        this.engineMasterGain.gain.value = currentVol + (targetVolume - currentVol) * 0.12;
    }

    createPortfolioSections() {
        // Bruno Simon style: billboard signs on posts, not buildings
        // Each section gets: colored ground zone + billboard post + sign face with content

        const postMat = surfaceMaterial('wood',this.renderer); // wood
        const frameMat = new THREE.MeshLambertMaterial({ color: 0xf0ece0 }); // off-white board

        Object.entries(PORTFOLIO_DATA).forEach(([title, data]) => {
            const group = new THREE.Group();

            // ── Ground zone marker (flat colored circle)
            const zoneGeo = new THREE.CylinderGeometry(8, 8, 0.08, 32);
            const zoneMat = new THREE.MeshLambertMaterial({
                color: data.color,
                transparent: true, opacity: 0.35
            });
            const zone = new THREE.Mesh(zoneGeo, zoneMat);
            zone.position.y = 0.05;
            group.add(zone);

            // ── Two wooden posts
            const postGeo = new THREE.CylinderGeometry(0.15, 0.18, 8, 8);
            [-2.2, 2.2].forEach(x => {
                const post = new THREE.Mesh(postGeo, postMat);
                post.position.set(x, 4, 0);
                post.castShadow = true;
                group.add(post);
            });

            // ── Sign board
            const boardW = 7, boardH = 4.5;
            const boardGeo = new THREE.BoxGeometry(boardW, boardH, 0.22);
            const board = new THREE.Mesh(boardGeo, frameMat);
            board.position.set(0, 7, 0);
            board.castShadow = true;
            group.add(board);

            // ── Sign face: painted canvas texture
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 320;
            const ctx = canvas.getContext('2d');

            // Background — section color
            const hex = '#' + new THREE.Color(data.color).getHexString();
            ctx.fillStyle = hex;
            ctx.fillRect(0, 0, 512, 320);

            // Slight vignette border
            ctx.strokeStyle = 'rgba(0,0,0,0.25)';
            ctx.lineWidth = 12;
            ctx.strokeRect(6, 6, 500, 308);

            // Icon
            ctx.font = '64px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(data.icon, 256, 90);

            // Title
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 52px Arial, sans-serif';
            ctx.fillText(title.toUpperCase(), 256, 160);

            // Intro subtitle (truncated)
            ctx.font = '22px Arial, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            const intro = data.content.intro;
            const maxW = 460;
            // Word-wrap into 2 lines max
            const words = intro.split(' ');
            let line = '', lines = [];
            for (const w of words) {
                const test = line + (line ? ' ' : '') + w;
                if (ctx.measureText(test).width > maxW && line) {
                    lines.push(line); line = w;
                    if (lines.length >= 2) break;
                } else { line = test; }
            }
            if (lines.length < 2 && line) lines.push(line);
            lines.forEach((l, i) => ctx.fillText(l, 256, 210 + i * 30));

            // "HOLD SPACE" hint
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '18px Arial, sans-serif';
            ctx.fillText('Hold SPACE to explore ▸', 256, 298);

            const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
            const faceMat = new THREE.MeshBasicMaterial({ map: tex });
            const faceGeo = new THREE.PlaneGeometry(boardW - 0.3, boardH - 0.3);
            const face = new THREE.Mesh(faceGeo, faceMat);
            face.position.set(0, 7, 0.12);
            group.add(face);

            // ── Small accent decorations: colored cube stack
            const accentMat = new THREE.MeshLambertMaterial({ color: data.color });
            for (let i = 0; i < 3; i++) {
                const size = 0.6 - i * 0.15;
                const cube = new THREE.Mesh(
                    new THREE.BoxGeometry(size, size, size),
                    accentMat
                );
                cube.position.set(4.5 - i * 0.1, 0.3 + i * 0.65, 0.3);
                cube.rotation.y = i * 0.4;
                group.add(cube);
            }

            // ── Position
            group.position.set(data.position.x, 0, data.position.z);
            group.userData = {
                title,
                content: data.content,
                color: data.color,
                icon: data.icon,
                buildingHeight: 9  // used by camera collision
            };

            // ── CSS2D overlay label (crisp HTML text, fades in when close)
            const labelDiv = document.createElement('div');
            labelDiv.className = 'sign-label';
            const hexColor = '#' + new THREE.Color(data.color).getHexString();
            const introShort = data.content.intro.slice(0, 80) + (data.content.intro.length > 80 ? '…' : '');
            labelDiv.innerHTML = `
                <div class="sign-label-title">${data.icon} ${title}</div>
                <div class="sign-label-sub">${introShort}</div>
            `;
            labelDiv.style.cssText = `
                background: rgba(15,15,25,0.82);
                border: 1px solid ${hexColor}55;
                border-radius: 8px;
                padding: 8px 14px;
                color: #fff;
                text-align: center;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
                white-space: nowrap;
                max-width: 260px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.4);
            `;
            labelDiv.querySelector('.sign-label-title').style.cssText = `
                font-size: 15px; font-weight: 700; margin-bottom: 4px;
                color: ${hexColor}; letter-spacing: 0.5px;
            `;
            labelDiv.querySelector('.sign-label-sub').style.cssText = `
                font-size: 11px; color: rgba(255,255,255,0.75); line-height: 1.4;
                white-space: normal; max-width: 240px;
            `;
            const labelObj = new CSS2DObject(labelDiv);
            labelObj.position.set(0, 11, 0); // Float above the sign board
            group.add(labelObj);
            group.userData.labelDiv = labelDiv;

            this.collisionSystem.addBuilding(data.position, 10, 10);
            this.sections.push(group);
            this.buildings.push(group);
            this.scene.add(group);
        });

        // ── Secret hidden area
        this.createSecretArea();

        // ── "KEITH KADIMA" name sign near spawn
        this.createNameSign();
    }

    createSecretArea() {
        // Hidden area at (200, 0, 200) with spinning cubes and a fun sign
        const group = new THREE.Group();
        group.position.set(200, 0, 200);

        // Spinning colorful cubes
        const cubeColors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0xa855f7, 0x06b6d4];
        this.secretCubes = [];
        cubeColors.forEach((color, i) => {
            const geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
            const mat = new THREE.MeshLambertMaterial({ color });
            const cube = new THREE.Mesh(geo, mat);
            const angle = (i / cubeColors.length) * Math.PI * 2;
            cube.position.set(Math.cos(angle) * 5, 1.5 + i * 0.3, Math.sin(angle) * 5);
            cube.userData.dynamic = true;
            group.add(cube);
            this.secretCubes.push(cube);
        });

        // Secret sign
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 512, 256);
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 42px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('\u{1F389} You found the secret!', 256, 80);
        ctx.fillStyle = '#ffffff';
        ctx.font = '28px Arial';
        ctx.fillText("Here's a cookie: \u{1F36A}", 256, 140);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '18px Arial';
        ctx.fillText('Not many make it this far.', 256, 200);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const signMat = new THREE.MeshBasicMaterial({ map: tex });
        const signGeo = new THREE.PlaneGeometry(7, 3.5);
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, 5, 0);
        group.add(sign);

        // Post
        const postGeo = new THREE.CylinderGeometry(0.15, 0.18, 5, 8);
        const postMat = surfaceMaterial('wood',this.renderer);
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(0, 2.5, 0);
        group.add(post);

        this.scene.add(group);
        this.buildings.push(group);
    }

    createNameSign() {
        // Large welcome sign near player spawn
        const canvas = document.createElement('canvas');
        canvas.width = 1024; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#2c1810';
        ctx.fillRect(0, 0, 1024, 256);
        ctx.fillStyle = '#f5deb3';
        ctx.font = 'bold 110px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('KEITH KADIMA', 512, 128);
        ctx.font = '36px Arial, sans-serif';
        ctx.fillStyle = '#c9a96e';
        ctx.fillText('ENGINEER / FOUNDER / EXPLORER', 512, 215);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.MeshBasicMaterial({ map: tex });
        const geo = new THREE.PlaneGeometry(18, 4.5);
        const sign = new THREE.Mesh(geo, mat);
        sign.position.set(-24, 5, 42); // just in front of spawn
        this.scene.add(sign);

        // Posts for name sign
        const postMat = new THREE.MeshLambertMaterial({ color: 0x2c1810 });
        [-8, 8].forEach(x => {
            const post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.25, 7, 8),
                postMat
            );
            post.position.set(x - 24, 3.5, 42);
            this.scene.add(post);
        });
    }

    loadEnvironmentDetails() {
        const treeCount = this.state.quality === 'low' ? 8 : this.state.quality === 'medium' ? 18 : 35;
        this.createStylizedTrees(treeCount);
        this.createScatteredProps();
        this.createInteractiveObjects(); // always — core gameplay
        this.freezeStaticObjects();
    }

    createStylizedTrees(count) { createTrees(this,count); }

    createScatteredProps() {
        // Bruno Simon style: random rocks, low-poly cactus, small blocks scattered around
        const rockMat = surfaceMaterial('stone',this.renderer);
        const cactusMat = new THREE.MeshLambertMaterial({ color: 0x5a8a3c });

        const propPositions = [
            // Rocks
            { x: 20, z: 25 },  { x: -30, z: 15 }, { x: 40, z: 30 },
            { x: -50, z: -20 }, { x: 55, z: -35 }, { x: -25, z: -40 },
            { x: 15, z: -55 },  { x: -45, z: 35 }, { x: 60, z: 10 },
            { x: -60, z: -10 }, { x: 30, z: -70 }, { x: -35, z: 70 },
        ];

        propPositions.forEach(({ x, z }, i) => {
            if (this.state.quality === 'low' && i > 5) return;

            const isRock = i % 3 !== 2;
            if (isRock) {
                // Low-poly rock: scaled icosahedron
                const s = 0.5 + Math.random() * 1.2;
                const geo = new THREE.IcosahedronGeometry(s, 0); // low poly
                const mesh = new THREE.Mesh(geo, rockMat);
                mesh.position.set(x + Math.random()*4-2, s * 0.5, z + Math.random()*4-2);
                mesh.rotation.set(Math.random(), Math.random(), Math.random());
                mesh.castShadow = true;
                this.scene.add(mesh);
                this.decorations.push(mesh);
            } else {
                // Simple cactus: tall box + two side arms
                const h = 2.5 + Math.random();
                const body = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, h, 0.5), cactusMat
                );
                body.position.set(x, h/2, z);
                body.castShadow = true;
                this.scene.add(body);

                const arm = new THREE.Mesh(
                    new THREE.BoxGeometry(1.2, 0.4, 0.4), cactusMat
                );
                arm.position.set(x + 0.5, h * 0.65, z);
                this.scene.add(arm);
                this.decorations.push(body, arm);
            }
        });

        // Stacked coloured cubes near centre (Bruno Simon playground vibe)
        const colors = [0xe17055, 0x00b894, 0xfdcb6e, 0x636e72, 0xd63031];
        colors.forEach((color, i) => {
            if (this.state.quality === 'low' && i > 2) return;
            const mat = new THREE.MeshLambertMaterial({ color });
            const size = 1.2;
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat);
            mesh.position.set(
                Math.sin(i / colors.length * Math.PI * 2) * 18,
                size / 2,
                Math.cos(i / colors.length * Math.PI * 2) * 18 + 30
            );
            mesh.rotation.y = i * 0.7;
            mesh.castShadow = true;
            this.scene.add(mesh);
            this.decorations.push(mesh);
        });
    }

    freezeStaticObjects() {
        // Only explicitly static decoration is frozen. Never traverse animated rigs.
        for (const object of this.decorations) {
            if (object.userData.dynamic) continue;
            object.updateMatrix(); object.matrixAutoUpdate = false;
        }
    }



    createDecorations() {
        // Street lamps using InstancedMesh for massive draw call reduction
        const lampMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.3
        });
        const lightMat = new THREE.MeshStandardMaterial({
            color: 0xFFFFAA,
            emissive: 0xFFFFAA,
            emissiveIntensity: 0.5
        });

        // Collect all lamp positions first
        const lampPositions = [];
        const positions = Object.values(PORTFOLIO_DATA).map(d => d.position);

        positions.forEach((pos, i) => {
            const nextPos = positions[(i + 1) % positions.length];
            const dx = nextPos.x - pos.x;
            const dz = nextPos.z - pos.z;
            const length = Math.sqrt(dx * dx + dz * dz);
            const steps = Math.floor(length / 30);

            for (let j = 1; j < steps; j++) {
                const t = j / steps;
                const x = pos.x + dx * t;
                const z = pos.z + dz * t;
                const perpX = -dz / length * 8;
                const perpZ = dx / length * 8;
                const angle = Math.atan2(dx, dz);

                [-1, 1].forEach(side => {
                    lampPositions.push({
                        x: x + perpX * side,
                        z: z + perpZ * side,
                        angle
                    });
                });
            }
        });

        const count = lampPositions.length;
        if (count === 0) return;

        // Instanced pole (1 draw call for all poles)
        const poleGeom = new THREE.CylinderGeometry(0.15, 0.2, 8, 6, 1);
        const poleInstances = new THREE.InstancedMesh(poleGeom, lampMaterial, count);
        poleInstances.castShadow = this.state.quality !== 'low';

        // Instanced light fixtures
        const lightGeom = new THREE.SphereGeometry(0.4, 8, 6);
        const lightInstances = new THREE.InstancedMesh(lightGeom, lightMat, count);

        const matrix = new THREE.Matrix4();

        for (let i = 0; i < count; i++) {
            const p = lampPositions[i];
            // Pole
            matrix.makeTranslation(p.x, 4, p.z);
            poleInstances.setMatrixAt(i, matrix);
            // Light fixture at top
            matrix.makeTranslation(p.x, 7.8, p.z);
            lightInstances.setMatrixAt(i, matrix);
        }

        poleInstances.instanceMatrix.needsUpdate = true;
        lightInstances.instanceMatrix.needsUpdate = true;

        this.scene.add(poleInstances);
        this.scene.add(lightInstances);
    }

    createParticles() {
        // Floating particles - reduced count for performance
        const count = this.state.quality === 'low' ? 50 : (this.state.quality === 'medium' ? 150 : 300);
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 200;

            positions[i * 3] = Math.sin(angle) * radius;
            positions[i * 3 + 1] = 2 + Math.random() * 30;
            positions[i * 3 + 2] = Math.cos(angle) * radius;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.15,
            transparent: true,
            opacity: 0.4,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);

        // Dust particle system for car (landing/drifting)
        this.createDustParticles();
    }

    createDustParticles() {
        // Pool of dust particles for landing/drifting effects
        const dustCount = 100;
        const dustPositions = new Float32Array(dustCount * 3);
        const dustVelocities = new Float32Array(dustCount * 3);
        const dustLifetimes = new Float32Array(dustCount);

        for (let i = 0; i < dustCount; i++) {
            dustPositions[i * 3] = 0;
            dustPositions[i * 3 + 1] = -100; // Hidden below ground
            dustPositions[i * 3 + 2] = 0;
            dustLifetimes[i] = 0;
        }

        const dustGeometry = new THREE.BufferGeometry();
        dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

        const dustMaterial = new THREE.PointsMaterial({
            color: 0xC4A76C, // Sandy/dusty color
            size: 0.8,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true
        });

        this.dustParticles = new THREE.Points(dustGeometry, dustMaterial);
        this.dustVelocities = dustVelocities;
        this.dustLifetimes = dustLifetimes;
        this.dustIndex = 0;
        this.scene.add(this.dustParticles);
    }

    spawnDustBurst(x, y, z, intensity = 1) {
        if (!this.dustParticles) return;

        const positions = this.dustParticles.geometry.attributes.position.array;
        const count = Math.floor(10 * intensity);

        for (let i = 0; i < count; i++) {
            const idx = (this.dustIndex % 100) * 3;

            // Random position around spawn point
            positions[idx] = x + (Math.random() - 0.5) * 3;
            positions[idx + 1] = y + Math.random() * 0.5;
            positions[idx + 2] = z + (Math.random() - 0.5) * 3;

            // Random velocity (outward and up)
            this.dustVelocities[idx] = (Math.random() - 0.5) * 8;
            this.dustVelocities[idx + 1] = Math.random() * 5 + 2;
            this.dustVelocities[idx + 2] = (Math.random() - 0.5) * 8;

            this.dustLifetimes[this.dustIndex % 100] = 1.0;
            this.dustIndex++;
        }

        this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    updateDustParticles(delta) {
        if (!this.dustParticles) return;

        const positions = this.dustParticles.geometry.attributes.position.array;

        for (let i = 0; i < 100; i++) {
            if (this.dustLifetimes[i] > 0) {
                const idx = i * 3;

                // Update position
                positions[idx] += this.dustVelocities[idx] * delta;
                positions[idx + 1] += this.dustVelocities[idx + 1] * delta;
                positions[idx + 2] += this.dustVelocities[idx + 2] * delta;

                // Apply gravity
                this.dustVelocities[idx + 1] -= 15 * delta;

                // Fade lifetime
                this.dustLifetimes[i] -= delta * 2;

                // Hide when dead
                if (this.dustLifetimes[i] <= 0) {
                    positions[idx + 1] = -100;
                }
            }
        }

        this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    createInteractiveObjects() {
        this.interactiveObjects = [];

        // ── Wooden crates (breakable) ──────────────────────────────────
        const cratePositions = [
            { x: 10, z: 52 }, { x: -10, z: 52 },
            { x: 15, z: 46 }, { x: -15, z: 46 },
            { x: 30, z: 20 }, { x: -30, z: 20 },
            { x: 0, z: -28 }, { x: 6, z: -32 }, { x: -6, z: -32 },
        ];
        cratePositions.forEach(pos => {
            this.spawnCrate(pos.x, pos.z);
        });

        // ── Oil barrels (heavy, roll) ───────────────────────────────────
        const barrelPositions = [
            { x: 25, z: 38 }, { x: 28, z: 38 },
            { x: -25, z: 38 }, { x: -28, z: 38 },
            { x: 40, z: -18 }, { x: -40, z: -18 },
        ];
        barrelPositions.forEach(pos => {
            this.spawnBarrel(pos.x, pos.z);
        });

        // ── Bowling pins cluster ────────────────────────────────────────
        const pinBase = { x: 0, z: -55 };
        const pinOffsets = [
            {x:0,z:0},{x:-1.2,z:1.4},{x:1.2,z:1.4},
            {x:-2.4,z:2.8},{x:0,z:2.8},{x:2.4,z:2.8},
        ];
        pinOffsets.forEach(o => {
            this.spawnPin(pinBase.x + o.x, pinBase.z + o.z);
        });
    }

    spawnCrate(x, z) {
        const size = 1.1 + Math.random() * 0.3;
        const group = new THREE.Group();

        const mat = surfaceMaterial('wood',this.renderer);

        const body = new THREE.Mesh(new THREE.BoxGeometry(size,size,size), mat);
        body.position.y = size/2;
        body.castShadow = true;
        group.add(body);

        // Metal corner brackets
        const bracketMat = new THREE.MeshLambertMaterial({ color: 0x888880 });
        const bs = size * 0.18;
        [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([sx,sz]) => {
            const b = new THREE.Mesh(new THREE.BoxGeometry(bs, bs, size * 1.02), bracketMat);
            b.position.set(sx*(size/2 - bs/2 + 0.01), size/2, 0);
            group.add(b);
            const b2 = new THREE.Mesh(new THREE.BoxGeometry(size * 1.02, bs, bs), bracketMat);
            b2.position.set(0, size/2, sz*(size/2 - bs/2 + 0.01));
            group.add(b2);
        });

        group.position.set(x, 0, z);
        group.userData = {
            type: 'crate', breakable: true, broken: false,
            size,
            spawnX: x, spawnZ: z,
            velocityX:0, velocityZ:0, velocityY:0,
            angularVelX:0, angularVelZ:0,
            grounded: true, mass: 1.2,
            collisionRadius: size * 0.7
        };
        group.userData.dynamic = true;
        this.scene.add(group);
        this.interactiveObjects.push(group);
        return group;
    }

    spawnBarrel(x, z) {
        const group = new THREE.Group();

        const bodyMat = surfaceMaterial('metal',this.renderer);
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,1.4,16), bodyMat);
        body.position.y = 0.7;
        body.castShadow = true;
        group.add(body);

        // Metal rings
        const ringMat = new THREE.MeshLambertMaterial({ color: 0x909090 });
        [0.25, 0.7, 1.15].forEach(y => {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.57, 0.05, 8, 20), ringMat
            );
            ring.rotation.x = Math.PI/2;
            ring.position.y = y;
            group.add(ring);
        });

        // Lid
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.57,0.57,0.08,16), ringMat);
        lid.position.y = 1.44;
        group.add(lid);

        group.position.set(x, 0, z);
        group.userData = {
            type: 'barrel', breakable: false, broken: false,
            spawnX: x, spawnZ: z,
            velocityX:0, velocityZ:0, velocityY:0,
            angularVelX:0, angularVelZ:0,
            grounded: true, mass: 3.0,
            collisionRadius: 0.65
        };
        group.userData.dynamic = true;
        this.scene.add(group);
        this.interactiveObjects.push(group);
        return group;
    }

    spawnPin(x, z) {
        const group = new THREE.Group();
        const mat = new THREE.MeshLambertMaterial({ color: 0xf8f8f5 });
        const redMat = new THREE.MeshLambertMaterial({ color: 0xcc2020 });

        // Pin body (lathe-style with segments)
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.1, 12), mat);
        body.position.y = 0.55;
        group.add(body);
        // Neck
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.22, 0.25, 12), mat);
        neck.position.y = 1.1;
        group.add(neck);
        // Head ball
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), mat);
        head.position.y = 1.45;
        group.add(head);
        // Red stripe
        const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 16), redMat);
        stripe.rotation.x = Math.PI/2;
        stripe.position.y = 0.9;
        group.add(stripe);

        group.position.set(x, 0, z);
        group.userData = {
            type: 'pin', breakable: false, broken: false,
            spawnX: x, spawnZ: z,
            velocityX:0, velocityZ:0, velocityY:0,
            angularVelX:0, angularVelZ:0,
            grounded: true, mass: 0.6,
            collisionRadius: 0.3
        };
        group.userData.dynamic = true;
        this.scene.add(group);
        this.interactiveObjects.push(group);
        return group;
    }

    breakCrate(obj) {
        if (obj.userData.broken) return;
        obj.userData.broken = true;

        const pos = obj.position.clone();
        const size = obj.userData.size || 1.1;

        // Spawn 6 debris chunks
        const debrisMat = new THREE.MeshLambertMaterial({ color: 0xb8903a });
        const darkMat  = new THREE.MeshLambertMaterial({ color: 0x7a5030 });
        for (let i = 0; i < 6; i++) {
            const s = size * (0.2 + Math.random() * 0.3);
            const chunk = new THREE.Mesh(
                new THREE.BoxGeometry(s, s * (0.5 + Math.random()), s),
                i % 2 === 0 ? debrisMat : darkMat
            );
            chunk.position.copy(pos);
            chunk.position.y += size * 0.5;
            chunk.userData = {
                type: 'debris', dynamic: true,
                velocityX: (Math.random()-0.5) * 8,
                velocityZ: (Math.random()-0.5) * 8,
                velocityY: 4 + Math.random() * 4,
                angularVelX: (Math.random()-0.5) * 15,
                angularVelZ: (Math.random()-0.5) * 15,
                grounded: false,
                life: 4.0  // seconds before fade
            };
            this.scene.add(chunk);
            this.interactiveObjects.push(chunk);
        }

        // Remove the crate itself
        this.scene.remove(obj);
        const idx = this.interactiveObjects.indexOf(obj);
        if (idx !== -1) this.interactiveObjects.splice(idx, 1);
        obj.traverse(c => { if (c.isMesh) { c.geometry.dispose(); if(!c.material.userData.sharedSurface)c.material.dispose(); }});

        this.spawnDustBurst(pos.x, 0.3, pos.z, 1.0);
        this.triggerScreenShake(0.4);
    }

    updateInteractiveObjects(delta, carX, carZ, carSpeed, carRotation) {
        if (!this.interactiveObjects) return;

        const carRadius = CONFIG.CAR_COLLISION_RADIUS;

        for (let i = this.interactiveObjects.length - 1; i >= 0; i--) {
            const obj = this.interactiveObjects[i];
            const data = obj.userData;

            // ── Debris lifetime fade ────────────────────────────────────
            if (data.type === 'debris') {
                data.life -= delta;
                if (data.life <= 0) {
                    this.scene.remove(obj);
                    this.interactiveObjects.splice(i, 1);
                    obj.traverse(c => { if (c.isMesh) { c.geometry.dispose(); if(!c.material.userData.sharedSurface)c.material.dispose(); }});
                    continue;
                }
                if (data.life < 1.0) {
                    obj.traverse(c => {
                        if (c.isMesh && c.material) c.material.opacity = data.life;
                        if (c.isMesh && c.material) c.material.transparent = true;
                    });
                }
            }

            // ── Car collision ───────────────────────────────────────────
            const dx = obj.position.x - carX;
            const dz = obj.position.z - carZ;
            const distSq = dx*dx + dz*dz;
            const collR = data.collisionRadius || 0.5;
            const minDist = carRadius + collR;

            if (distSq < minDist * minDist && Math.abs(carSpeed) > 1) {
                const dist = Math.sqrt(distSq);
                const nx = dist > 0.001 ? dx/dist : 1;
                const nz = dist > 0.001 ? dz/dist : 0;

                // Break crate on impact
                if (data.breakable && !data.broken && Math.abs(carSpeed) > 4) {
                    this.breakCrate(obj);
                    // Push car back slightly
                    if (this.vehiclePhysics) this.vehiclePhysics.speed *= 0.75;
                    continue;
                }

                // Push object away
                const force = Math.abs(carSpeed) / (data.mass || 1) * 0.6;
                data.velocityX = nx * force + Math.sin(carRotation) * Math.abs(carSpeed) * 0.2;
                data.velocityZ = nz * force + Math.cos(carRotation) * Math.abs(carSpeed) * 0.2;
                data.velocityY = Math.random() * 2 + 0.5;
                data.angularVelX = (Math.random()-0.5) * 12;
                data.angularVelZ = (Math.random()-0.5) * 8;
                data.grounded = false;

                // Push car back (solid collision)
                if (this.vehiclePhysics) {
                    this.vehiclePhysics.x -= nx * 0.15;
                    this.vehiclePhysics.z -= nz * 0.15;
                    this.vehiclePhysics.speed *= 0.85;
                }

                this.spawnDustBurst(obj.position.x, 0.1, obj.position.z, 0.3);
            }

            // ── Physics integration ─────────────────────────────────────
            if (!data.grounded || Math.abs(data.velocityX) > 0.05 ||
                Math.abs(data.velocityZ) > 0.05 || data.velocityY !== 0) {

                obj.position.x += data.velocityX * delta;
                obj.position.z += data.velocityZ * delta;
                obj.position.y += data.velocityY * delta;

                // Gravity
                if (!data.grounded) data.velocityY -= 18 * delta;

                // Ground
                if (obj.position.y <= 0) {
                    obj.position.y = 0;
                    data.velocityY = Math.abs(data.velocityY) * 0.3;
                    if (data.velocityY < 0.5) { data.velocityY = 0; data.grounded = true; }
                }

                // Friction
                const friction = data.grounded ? 0.94 : 0.995;
                data.velocityX *= friction;
                data.velocityZ *= friction;

                // Angular
                obj.rotation.x += data.angularVelX * delta;
                obj.rotation.z += data.angularVelZ * delta;
                data.angularVelX *= 0.96;
                data.angularVelZ *= 0.96;
            }
        }
    }

    setupEventListeners() {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('resize', this.onResize);

        window.addEventListener('wheel', (e) => {
            if (this.isInterfaceOpen() || e.target !== this.renderer.domElement) return;
            this.state.cameraDistance += e.deltaY * 0.02;
            this.state.cameraDistance = Math.max(8, Math.min(40, this.state.cameraDistance));
        }, { passive: true });

        // UI Controls
        document.getElementById('controlsToggle').addEventListener('click', () => {
            const collapsed = document.getElementById('controlsPanel').classList.toggle('collapsed');
            document.getElementById('controlsToggle').setAttribute('aria-expanded', String(!collapsed));
            document.getElementById('gameContainer').focus();
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            const open = document.getElementById('settingsPanel').classList.toggle('active');
            document.getElementById('settingsBtn').setAttribute('aria-expanded', String(open));
            this.resetInput();
        });

        document.getElementById('qualitySelect').addEventListener('change', (e) => {
            this.manualQuality = true;
            this.applyQuality(e.target.value);
        });

        document.getElementById('effectsSelect').addEventListener('change', (e) => {
            this.applyEffects(e.target.value);
        });

        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('modalCloseBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modalOverlay')) {
                this.closeModal();
            }
        });

        document.getElementById('qualitySelect').value = this.state.quality;

        // Mobile touch controls
        if (this.state.isMobile) {
            this.setupMobileControls();
        }

        // Mouse camera control (desktop)
        if (!this.state.isMobile) {
            this.setupMouseCameraControl();
        }
    }

    setupMobileControls() { setupTouchInput(this); }

    setupMouseCameraControl() {
        this.mouseCamera = {
            enabled: false,
            sensitivity: 0.003,
            yaw: 0,
            pitch: 0,
            maxPitch: Math.PI / 3,
            minPitch: -Math.PI / 6
        };

        const canvas = this.renderer.domElement;

        // Right-click drag to rotate camera
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 2 || e.button === 0) { // Right or left click
                this.mouseCamera.enabled = true;
                canvas.style.cursor = 'grabbing';
            }
        });

        window.addEventListener('mouseup', () => {
            this.mouseCamera.enabled = false;
            canvas.style.cursor = 'grab';
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.mouseCamera.enabled) return;

            this.mouseCamera.yaw -= e.movementX * this.mouseCamera.sensitivity;
            this.mouseCamera.pitch -= e.movementY * this.mouseCamera.sensitivity;

            // Clamp pitch
            this.mouseCamera.pitch = Math.max(
                this.mouseCamera.minPitch,
                Math.min(this.mouseCamera.maxPitch, this.mouseCamera.pitch)
            );
        });

        // Scroll to zoom
        canvas.addEventListener('wheel', (e) => {
            this.state.cameraDistance += e.deltaY * 0.02;
            this.state.cameraDistance = Math.max(5, Math.min(50, this.state.cameraDistance));
        }, { passive: true });

        // Set initial cursor
        canvas.style.cursor = 'grab';

        // Prevent context menu on right-click
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    onKeyDown(e) {
        if (e.code === 'Escape') {
            this.closeModal();
            document.getElementById('settingsPanel').classList.remove('active');
            document.getElementById('settingsBtn').setAttribute('aria-expanded', 'false');
            return;
        }
        if (this.isInterfaceOpen() || e.target.closest('button, a, input, select, textarea, [contenteditable]')) return;
        this.state.keys[e.code] = true;
        if (e.code === 'KeyF') { this.discoveries?.open(this.discoveries.near); return; }
        if (e.repeat) return;

        // 🥚 KONAMI CODE EASTER EGG
        this.checkKonamiCode(e.code);

        // Space is now handled by hold-to-enter in checkSectionProximity
        if (e.code === 'Space') {
            e.preventDefault();
        }

        if (e.code === 'KeyC') this.toggleCamera();
        if (e.code === 'KeyH') this.honk();
        if (e.code === 'KeyM') this.toggleMinimap();
        if (e.code === 'KeyT') this.cycleTimeOfDay(); // 🌅 Time of day
        if (e.code === 'KeyN') this.toggleNightMode(); // 🌙 Night mode
        if (e.code === 'KeyR') this.openRadio(); // 📻 Radio
        if (e.code === 'KeyV') this.toggleMute(); // 🔊 Mute

        if (e.code === 'Escape') {
            this.closeModal();
            document.getElementById('settingsPanel').classList.remove('active');
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 
             'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
            e.preventDefault();
        }
    }

    // 🥚 KONAMI CODE: ↑↑↓↓←→←→BA
    checkKonamiCode(code) {
        const konamiSequence = [
            'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
            'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
            'KeyB', 'KeyA'
        ];

        if (!this.konamiIndex) this.konamiIndex = 0;

        if (code === konamiSequence[this.konamiIndex]) {
            this.konamiIndex++;
            if (this.konamiIndex === konamiSequence.length) {
                this.activateKonamiMode();
                this.konamiIndex = 0;
            }
        } else {
            this.konamiIndex = 0;
        }
    }

    activateKonamiMode() {
        // 🎮 SECRET UNLOCKED!
        this.state.konamiActive = true;

        // Rainbow car!
        if (this.car) {
            this.car.traverse(child => {
                if (child.isMesh && child.material && child.material.color) {
                    child.userData.originalColor = child.material.color.getHex();
                }
            });
            this.state.rainbowMode = true;
        }

        // Boost multiplier
        CONFIG.BOOST_MULTIPLIER = 3.0;
        CONFIG.JUMP_FORCE = 20;

        // Epic notification
        this.showToast('🎮', 'KONAMI CODE!', 'Rainbow mode + Super boost activated!');

        // Play victory sound
        if (this.audioContext) {
            const now = this.audioContext.currentTime;
            [523, 659, 784, 1047].forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.frequency.value = freq;
                osc.type = 'square';
                gain.gain.setValueAtTime(0.1, now + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.15);
                osc.connect(gain);
                gain.connect(this.masterAudio || this.audioContext.destination);
                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.2);
            });
        }
    }

    // 🌅 DYNAMIC TIME OF DAY
    cycleTimeOfDay() {
        const times = ['dawn', 'day', 'sunset', 'night'];
        if (this.currentTimeIndex === undefined) this.currentTimeIndex = 1; // Start at day
        this.currentTimeIndex = (this.currentTimeIndex + 1) % times.length;
        this.setTimeOfDay(times[this.currentTimeIndex]);
    }

    toggleNightMode() {
        const isNight = this.currentTimeIndex === 3;
        this.setTimeOfDay(isNight ? 'day' : 'night');
        this.currentTimeIndex = isNight ? 1 : 3;
    }

    setTimeOfDay(time) {
        this.environment?.setTime(time);
        this.showToast('◷', time[0].toUpperCase() + time.slice(1), 'The world is changing around you.');
    }

    honk() {
        // Play realistic car horn sound using dual-tone synthesis
        if (this.audioContext && !this.muted) {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const now = this.audioContext.currentTime;
            const duration = 0.5;

            // Real car horns use two simultaneous frequencies
            // Common pairs: F# + A# (370Hz + 466Hz) or A + D (440Hz + 587Hz)
            const frequencies = [370, 466]; // F# and A# - classic car horn

            frequencies.forEach((freq, i) => {
                // Main tone oscillator
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();

                // Sawtooth wave gives that brassy horn quality
                osc.type = 'sawtooth';
                osc.frequency.value = freq;

                // Add slight vibrato for realism
                const vibrato = this.audioContext.createOscillator();
                const vibratoGain = this.audioContext.createGain();
                vibrato.frequency.value = 6; // 6Hz vibrato
                vibratoGain.gain.value = 3; // ±3Hz variation
                vibrato.connect(vibratoGain);
                vibratoGain.connect(osc.frequency);
                vibrato.start(now);
                vibrato.stop(now + duration);

                // Low-pass filter for that muffled car horn sound
                filter.type = 'lowpass';
                filter.frequency.value = 2000;
                filter.Q.value = 1;

                // Envelope: quick attack, sustain, quick release
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.15, now + 0.02); // Fast attack
                gain.gain.setValueAtTime(0.15, now + duration - 0.05); // Sustain
                gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterAudio || this.audioContext.destination);

                osc.start(now);
                osc.stop(now + duration);
            });

            // Add a subtle sub-bass for body
            const subOsc = this.audioContext.createOscillator();
            const subGain = this.audioContext.createGain();
            subOsc.type = 'sine';
            subOsc.frequency.value = 185; // Sub frequency
            subGain.gain.setValueAtTime(0, now);
            subGain.gain.linearRampToValueAtTime(0.08, now + 0.02);
            subGain.gain.setValueAtTime(0.08, now + duration - 0.05);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            subOsc.connect(subGain);
            subGain.connect(this.masterAudio || this.audioContext.destination);
            subOsc.start(now);
            subOsc.stop(now + duration);
        }

        // Visual honk wave - more subtle
        if (this.car) {
            const honkGeom = new THREE.RingGeometry(1, 1.5, 32);
            const honkMat = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const honkRing = new THREE.Mesh(honkGeom, honkMat);
            honkRing.position.copy(this.car.position);
            honkRing.position.y += 1.5;
            honkRing.rotation.x = -Math.PI / 2;
            this.scene.add(honkRing);

            const startTime = performance.now();
            const animateHonk = () => {
                const elapsed = (performance.now() - startTime) / 1000;
                if (elapsed < 0.4) {
                    honkRing.scale.setScalar(1 + elapsed * 10);
                    honkMat.opacity = 0.3 * (1 - elapsed * 2.5);
                    requestAnimationFrame(animateHonk);
                } else {
                    this.scene.remove(honkRing);
                    honkGeom.dispose();
                    honkMat.dispose();
                }
            };
            animateHonk();
        }
    }

    toggleMinimap() {
        const minimap = document.getElementById('miniMap');
        minimap.classList.toggle('hidden');
    }

    onKeyUp(e) {
        this.state.keys[e.code] = false;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        if (this.labelRenderer) {
            this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    toggleCamera() {
        const modes = ['follow', 'orbit', 'first-person'];
        const current = modes.indexOf(this.state.cameraMode);
        this.state.cameraMode = modes[(current + 1) % modes.length];

        const icons = { 'follow': '📹', 'orbit': '🎬', 'first-person': '👁️' };
        this.showNotification(`Camera: ${this.state.cameraMode} ${icons[this.state.cameraMode]}`);
    }

    showNotification(text, subtext = null, color = null) {
        const indicator = document.getElementById('sectionIndicator');
        const dot = document.getElementById('indicatorDot');
        const title = document.getElementById('indicatorTitle');

        dot.style.backgroundColor = color || 'var(--color-primary)';
        title.textContent = text;

        const hint = indicator.querySelector('.section-indicator-hint');
        if (subtext) {
            hint.textContent = subtext;
            hint.style.display = 'inline';
        } else {
            hint.style.display = 'none';
        }

        indicator.style.display = 'block';

        setTimeout(() => {
            if (!this.state.currentSection) {
                indicator.style.display = 'none';
            }
        }, 3000);
    }

    openModal(data) {
        this.previousFocus = document.activeElement;
        this.resetInput();
        const { title, content, color, icon } = data;

        // Track visited section
        if (!this.state.sectionsVisited.has(title)) {
            this.state.sectionsVisited.add(title);
            this.recordSectionVisit(title);
            if (this.combo) this.combo.addScore(200, '🏢 EXPLORE');

            // Check if this was the first section
            if (this.state.sectionsVisited.size === 1 && 
                !safeStorage.getItem('achievement_firstExplore')) {
                safeStorage.setItem('achievement_firstExplore', 'true');
                setTimeout(() => {
                    this.showToast('🎯', 'First Discovery!', 'Keep exploring to find more');
                }, 500);
            }
        }

        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalIcon').textContent = icon;

        let html = `<p class="modal-intro">${content.intro}</p>`;

        content.sections.forEach(section => {
            html += `
                <div class="modal-section">
                    <h3 class="modal-section-title">${section.title}</h3>
                    <ul class="modal-list">
                        ${section.items.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        });

        document.getElementById('modalContent').innerHTML = html;
        if (title === 'Projects') {
            const link = document.createElement('a'); link.href = 'https://github.com/tufstraka'; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Explore my public repositories ↗'; link.className = 'project-link'; document.getElementById('modalContent').appendChild(link);
        }
        this.diagnostics?.record('open_' + title);
        this.playUiTone?.();
        document.getElementById('modalOverlay').classList.add('active');
        this.linkContactDetails();
        document.getElementById('modalClose').focus();

        // Hide sidebar while modal is open
        this.hideSidebar();

        // Subtle feedback on modal open
        this.triggerScreenShake(0.1);
    }

    closeModal() {
        const overlay = document.getElementById('modalOverlay');
        if (!overlay.classList.contains('active')) return;
        overlay.classList.remove('active');
        document.getElementById('gameContainer').focus();
        // Re-show sidebar if still near a section
        if (this.state.currentSection) {
            this.showSidebar(this.state.currentSection.userData);
        }
    }

    // ============================================
    // SIDEBAR - Auto-reveal content panel
    // ============================================

    createSidebar() {
        // Inject CSS
        const style = document.createElement('style');
        style.textContent = `
            #contentSidebar {
                position: fixed;
                top: 50%;
                right: 0;
                transform: translate(100%, -50%);
                width: 320px;
                max-width: 90vw;
                max-height: 80vh;
                background: rgba(10, 10, 20, 0.88);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border-left: 2px solid rgba(255,255,255,0.12);
                border-top: 1px solid rgba(255,255,255,0.08);
                border-bottom: 1px solid rgba(255,255,255,0.08);
                border-radius: 16px 0 0 16px;
                padding: 24px 20px 24px 24px;
                overflow-y: auto;
                z-index: 800;
                transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-sizing: border-box;
                pointer-events: none;
            }
            #contentSidebar.active {
                transform: translate(0, -50%);
                pointer-events: auto;
            }
            #contentSidebar::-webkit-scrollbar {
                width: 4px;
            }
            #contentSidebar::-webkit-scrollbar-track {
                background: transparent;
            }
            #contentSidebar::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.2);
                border-radius: 2px;
            }
            .sidebar-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
                padding-bottom: 14px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            .sidebar-icon {
                font-size: 2rem;
                line-height: 1;
            }
            .sidebar-title {
                font-family: 'Inter', -apple-system, sans-serif;
                font-size: 1.15rem;
                font-weight: 700;
                color: #fff;
                line-height: 1.2;
            }
            .sidebar-color-bar {
                width: 4px;
                height: 100%;
                min-height: 40px;
                border-radius: 2px;
                flex-shrink: 0;
            }
            .sidebar-intro {
                font-family: 'Inter', -apple-system, sans-serif;
                font-size: 0.82rem;
                color: rgba(255,255,255,0.72);
                line-height: 1.55;
                margin-bottom: 14px;
            }
            .sidebar-section {
                margin-bottom: 14px;
            }
            .sidebar-section-title {
                font-family: 'Inter', -apple-system, sans-serif;
                font-size: 0.72rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: rgba(255,255,255,0.45);
                margin-bottom: 6px;
            }
            .sidebar-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .sidebar-list li {
                font-family: 'Inter', -apple-system, sans-serif;
                font-size: 0.8rem;
                color: rgba(255,255,255,0.78);
                line-height: 1.5;
                padding: 3px 0 3px 12px;
                position: relative;
            }
            .sidebar-list li::before {
                content: '›';
                position: absolute;
                left: 0;
                color: var(--sidebar-accent, #6366f1);
                font-weight: bold;
            }
            .sidebar-hint {
                font-family: 'Inter', -apple-system, sans-serif;
                font-size: 0.7rem;
                color: rgba(255,255,255,0.35);
                text-align: center;
                margin-top: 12px;
                padding-top: 10px;
                border-top: 1px solid rgba(255,255,255,0.07);
            }
        `;
        document.head.appendChild(style);

        // Create element
        const sidebar = document.createElement('div');
        sidebar.id = 'contentSidebar';
        sidebar.innerHTML = '<div id="sidebarInner"></div>';
        document.body.appendChild(sidebar);
    }

    showSidebar(data) {
        const sidebar = document.getElementById('contentSidebar');
        if (!sidebar) return;
        const inner = document.getElementById('sidebarInner');
        const { title, icon, content, color } = data;
        const colorHex = '#' + new THREE.Color(color).getHexString();

        let sectionsHtml = '';
        (content.sections || []).forEach(sec => {
            sectionsHtml += `
                <div class="sidebar-section">
                    <div class="sidebar-section-title">${sec.title}</div>
                    <ul class="sidebar-list">
                        ${sec.items.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        });

        inner.innerHTML = `
            <div class="sidebar-header">
                <div class="sidebar-color-bar" style="background:${colorHex}"></div>
                <span class="sidebar-icon">${icon}</span>
                <span class="sidebar-title">${title}</span>
            </div>
            <p class="sidebar-intro">${content.intro}</p>
            ${sectionsHtml}
            <div class="sidebar-hint">Hold <strong>SPACE</strong> for full view</div>
        `;
        sidebar.style.setProperty('--sidebar-accent', colorHex);
        sidebar.classList.add('active');
    }

    hideSidebar() {
        const sidebar = document.getElementById('contentSidebar');
        if (sidebar) sidebar.classList.remove('active');
    }

    // ============================================
    // DEEP LINKS - Hash-based navigation
    // ============================================

    initDeepLinks() {
        // Hash-to-section title map
        this._hashMap = {
            'about': 'About Me',
            'tech-stack': 'Tech Stack',
            'projects': 'Projects',
            'experience': 'Experience',
            'contact': 'Contact'
        };

        // Check initial hash after a short delay (sections may still be loading)
        setTimeout(() => this.handleInitialHash(), 800);
        window.addEventListener('hashchange', () => this.handleInitialHash());
    }

    handleInitialHash() {
        const hash = window.location.hash.replace('#', '').toLowerCase();
        if (!hash) return;
        const targetTitle = this._hashMap[hash];
        if (!targetTitle) return;

        // Find the matching section
        const section = this.sections.find(s => s.userData && s.userData.title === targetTitle);
        if (!section) return;

        // Teleport car to the section position
        const pos = section.position;
        const offset = 20; // Stand a bit in front
        this.car.position.set(pos.x, 0.5, pos.z + offset);
        if (this.vehiclePhysics) {
            this.resetInput();
            this.vehiclePhysics.reset();
            this.vehiclePhysics.rotation = Math.PI;
            this.car.rotation.y = Math.PI;
            this.vehiclePhysics.x = pos.x;
            this.vehiclePhysics.z = pos.z + offset;
            this.state.carSpeed = 0;
            this.state.lastPosition = null;
        }
        // Point camera toward section
        this.camera.position.set(pos.x, 12, pos.z + offset + 20);
        this.camera.lookAt(pos.x, 0, pos.z);
    }

    updateHashForSection(sectionTitle) {
        if (!this._hashMap) return;
        // Reverse lookup
        const hash = Object.keys(this._hashMap).find(k => this._hashMap[k] === sectionTitle);
        if (hash) {
            window.history.replaceState(null, '', '#' + hash);
        }
    }

    clearHash() {
        if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }

    applyQuality(quality) { configureQuality(this, quality); }



    applyEffects(level) {
        if (!this.bloomPass) return;

        const settings = {
            minimal: { strength: 0.1, radius: 0.3, threshold: 0.95 },
            balanced: { strength: 0.2, radius: 0.4, threshold: 0.85 },
            ultra: { strength: 0.35, radius: 0.5, threshold: 0.75 }
        };

        const s = settings[level];
        this.effectsLevel = level;
        this.bloomPass.enabled = this.useComposer && level !== 'minimal';
        this.bloomPass.strength = s.strength;
        this.bloomPass.radius = s.radius;
        this.bloomPass.threshold = s.threshold;
    }

    animate() {
        this.animationFrame = requestAnimationFrame(this.animate);
        if (document.hidden || this.isInterfaceOpen()) {
            this.clock.getDelta();
            this.lastFpsTime = performance.now();
            if (this.audioContext?.state === 'running') {
                this.audioContext.suspend();
                this.audioPaused = true;
            }
            return;
        }
        if (this.audioPaused) {
            if (!this.muted) this.audioContext?.resume();
            this.audioPaused = false;
        }
        const elapsed = this.clock.getDelta();
        const delta = Math.min(elapsed, 0.05);
        this.frameDelta = delta;
        this.state.time += delta;

        this.physicsAccumulator = Math.min((this.physicsAccumulator || 0) + delta, .1);
        while (this.physicsAccumulator >= 1/60) {
            this.updateMovement(1/60);
            this.physicsAccumulator -= 1/60;
        }
        this.updateCamera();
        this.updateWheels();
        this.checkSectionProximity();
        // Animate particles/signs only on medium+
        if (this.state.quality !== 'low') {
            this.updateAnimations();
        }

        // Frustum culling on medium+ only (low has fewer objects + short view)
        if (this.state.quality !== 'low') {
            this.updateFrustumCulling();
        }

        // Update dust particles (skip on low)
        if (this.state.quality !== 'low') {
            this.updateDustParticles(delta);
            this.updateParticles(delta);
        }

        // 🚗 DRIFT: Check for drifting and update smoke
        this.checkDrift();
        if (this.state.quality !== 'low') {
            this.updateDriftSmoke(delta);
        }

        // 🎯 COMBO: Update scoring
        if (this.combo) {
            this.combo.update(delta);
            // Drift scoring: 10pts/s while drifting
            if (this.vehiclePhysics && this.vehiclePhysics.isDrifting) {
                this.combo.driftAccum += delta;
                if (this.combo.driftAccum >= 0.5) {
                    this.combo.addScore(10, '💨 DRIFT');
                    this.combo.driftAccum = 0;
                }
            } else {
                this.combo.driftAccum = 0;
            }
        }

        // Update interactive objects (cones, barrels)
        if (this.car && this.interactiveObjects) {
            this.updateInteractiveObjects(
                delta,
                this.car.position.x,
                this.car.position.z,
                this.state.carSpeed,
                this.car.rotation.y
            );
        }

        // Game Feel: Check achievements every 10 frames
        if (this.frameCount % 10 === 0) {
            this.checkAchievements();
        }

        if (this.frameCount % 15 === 0) {
            this.updateMinimap();
        }

        if (this.frameCount % 30 === 0) {
            this.updateFPS();
        }

        this.updateDayNightCycle(delta);
        this.updateHeadlights();
        this.discoveries?.update();
        if (this.frameCount % 6 === 0) this.renderer.shadowMap.needsUpdate = true;

        // Update skid marks (fade out)
        if (this.frameCount % 10 === 0) {
            this.updateSkidMarks();
        }

        // 🎨 Update film grain time for animated noise
        if (this.filmGrainPass && this.filmGrainPass.enabled) {
            this.filmGrainPass.uniforms['time'].value = this.state.time;
        }

        // 🎥 Update camera shake
        if (this.cameraShake) {
            this.cameraShake.update(delta, this.state.time);
        }

        // 🎥 Update motion blur based on speed
        if (this.motionBlurPass && this.motionBlurPass.enabled) {
            const normalizedSpeed = Math.abs(this.state.carSpeed) / CONFIG.MAX_SPEED;
            this.motionBlurPass.uniforms['velocity'].value = normalizedSpeed * 0.8;
        }

        this.frameCount++;

        // Update speedometer HUD
        this.updateSpeedometer();

        // Update analytics tracking
        this.updateAnalytics(delta);

        this.renderer.info.reset();
        // Render: bypass composer on low quality for massive FPS gain
        if (this.useComposer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
        this.labelRenderer?.render(this.scene, this.camera);
        this.diagnostics?.frame(elapsed * 1000, this.renderer);
    }

    // 🎯 PERFORMANCE: Frustum Culling - Only render what the camera sees
    updateFrustumCulling() {
        if (!this.frustumCuller || !this.camera || !CONFIG.CULLING_ENABLED) return;

        this.frustumCuller.update();

        const camPos = this.camera.position;

        // Cull decorations only (trees, rocks — not signs or interactive objects)
        this.decorations.forEach(obj => {
            if (obj.userData.cullable === false || obj.userData.dynamic) return;

            const p = obj.position;
            const dx = camPos.x - p.x;
            const dz = camPos.z - p.z;
            const distSq = dx*dx + dz*dz;
            const vd = this.viewDistance || CONFIG.VIEW_DISTANCE;

            if (distSq > vd * vd) {
                obj.visible = false;
            } else {
                // Always restore — frustum culler may have hidden it previously
                const br = obj.userData.boundingRadius || 10;
                obj.visible = this.frustumCuller.isVisible(obj, br);
            }
        });

        // Buildings/signs: never cull — they're landmarks
        this.buildings.forEach(b => { b.visible = true; this.applyBuildingLOD(b, camPos.distanceTo(b.position)); });

        // Interactive objects: never cull — physics needs them visible
        if (this.interactiveObjects) {
            this.interactiveObjects.forEach(o => { o.visible = true; });
        }
    }

    // Apply LOD settings to an object
    applyLODToObject(obj, lodLevel, distance) {
        // Skip if already at this LOD level
        if (obj.userData.currentLOD === lodLevel) return;
        obj.userData.currentLOD = lodLevel;

        obj.traverse(child => {
            if (child.isMesh) {
                switch(lodLevel) {
                    case 0: // High detail (close)
                        child.castShadow = true;
                        child.receiveShadow = true;
                        break;
                    case 1: // Medium detail
                        child.castShadow = distance < 40;
                        child.receiveShadow = true;
                        break;
                    case 2: // Low detail (far)
                        child.castShadow = false;
                        child.receiveShadow = false;
                        break;
                    case 3: // Very low (edge of visibility)
                        child.castShadow = false;
                        child.receiveShadow = false;
                        break;
                }
            }
        });
    }

    // Apply LOD to buildings (windows, details, shadows)
    applyBuildingLOD(building, distance) {
        const lodLevel = this.frustumCuller.getLODLevel(distance);

        if (building.userData.currentLOD === lodLevel) return;
        building.userData.currentLOD = lodLevel;

        building.traverse(child => {
            if (child.isMesh) {
                // Disable shadows on distant buildings
                if (lodLevel >= 2) {
                    child.castShadow = false;
                } else if (lodLevel === 1) {
                    // Medium distance: only main building casts shadow
                    child.castShadow = child.geometry && 
                        child.geometry.parameters && 
                        (child.geometry.parameters.width > 5 || child.geometry.parameters.height > 5);
                } else {
                    child.castShadow = true;
                }

                // Hide small details at distance (window frames, etc.)
                if (child.geometry && child.geometry.parameters) {
                    const size = Math.max(
                        child.geometry.parameters.width || 0,
                        child.geometry.parameters.height || 0,
                        child.geometry.parameters.radius || 0
                    );
                    // Hide tiny details at medium+ distance
                    if (size < 0.2 && lodLevel >= 1) {
                        child.visible = false;
                    } else {
                        child.visible = true;
                    }
                }
            }
        });
    }

    updateMovement(delta) {
        this.updateCar(delta);
    }

    updateCar(delta) {
        const keys = this.state.keys;

        // Build input state
        this.state.input.throttle = Math.max(this.touchInput?.throttle || 0, (keys['KeyW'] || keys['ArrowUp']) ? 1 : 0);
        this.state.input.brake = Math.max(this.touchInput?.brake || 0, (keys['KeyS'] || keys['ArrowDown']) ? 1 : 0);
        this.state.input.boost = keys['ShiftLeft'] || keys['ShiftRight'];

        // Update engine sound
        this.updateEngineSound();

        // Jump! (J key)
        if (keys['KeyJ'] && this.state.playerMode === 'driving') {
            this.state.keys['KeyJ'] = false;
            const jumped = this.vehiclePhysics.jump();
            if (jumped) {
                this.showToast('🦘', 'Jump!', '');
                if (this.combo) this.combo.addScore(50, '⬆️ JUMP');
            }
        }

        // Steering (-1 to 1)
        let steer = this.touchInput?.steer || 0;
        if (keys['KeyA'] || keys['ArrowLeft']) steer = 1;
        if (keys['KeyD'] || keys['ArrowRight']) steer = -1;
        this.state.input.steer = steer;

        // Update physics
        const physicsState = this.vehiclePhysics.update(delta, this.state.input, this.collisionSystem);

        // Apply physics to car mesh
        this.car.position.x = physicsState.x;
        this.car.position.z = physicsState.z;
        this.car.position.y = physicsState.y;
        this.car.rotation.y = physicsState.rotation;
        this.car.rotation.z = physicsState.bodyRoll;
        this.car.rotation.x = physicsState.bodyPitch;

        // Store for other systems
        this.state.carSpeed = physicsState.speed;
        this.state.isBoosting = this.state.input.boost && this.state.input.throttle > 0;
        this.state.isAirborne = physicsState.isAirborne;

        // Update UI
        const speedKmh = Math.round(Math.abs(physicsState.speedKmh)); this.updateRacingHud?.();
        const speedEl = document.getElementById('speedValue');
        const boostEl = document.getElementById('speedBoost');
        const airborneEl = document.getElementById('speedAirborne');

        if (speedEl) {
            speedEl.textContent = speedKmh;
            // ⚡ GAME FEEL: Dynamic speed coloring
            speedEl.classList.remove('fast', 'turbo');
            if (this.state.isBoosting && speedKmh > 80) {
                speedEl.classList.add('turbo');
            } else if (speedKmh > 60) {
                speedEl.classList.add('fast');
            }
        }
        if (boostEl) boostEl.style.display = this.state.isBoosting ? 'inline-flex' : 'none';
        if (airborneEl) airborneEl.style.display = physicsState.isAirborne ? 'inline-flex' : 'none';

        // Visual feedback
        this.setBoostLines(this.state.isBoosting && physicsState.speedKmh > 60);

        // Collision feedback - reflection bounce + sparks
        if (physicsState.isColliding && Math.abs(physicsState.speed) > 5) {
            const intensity = Math.min(Math.abs(physicsState.speed) / 20, 1);
            this.triggerScreenShake(0.3 * intensity);
            this.spawnDustBurst(this.car.position.x, 0.2, this.car.position.z, 0.5);
            this.playCollisionSound(intensity);
        }

        // Landing impact with dust burst
        if (this.state.wasAirborne && physicsState.isGrounded && physicsState.landingImpact > 2) {
            const intensity = Math.min(physicsState.landingImpact / 8, 1);
            this.triggerScreenShake(0.4 * intensity);
            this.spawnDustBurst(this.car.position.x, 0.1, this.car.position.z, intensity);
            this.playLandingSound(intensity);
            this.spawnLandingParticles(Math.ceil(intensity * 12));
            // Score for landing
            if (physicsState.isOnRoad && physicsState.landingImpact > 4) {
                if (this.combo) this.combo.addScore(100, '🎯 PRECISION');
            } else if (physicsState.landingImpact > 3) {
                if (this.combo) this.combo.addScore(50, '🦘 LAND');
            }
        }
        this.state.wasAirborne = physicsState.isAirborne;

        // Spawn dust and skid marks when drifting/skidding
        if (physicsState.isGrounded && Math.abs(physicsState.speed) > 10) {
            const isDrifting = Math.abs(physicsState.angularVelocity) > 0.5 || !physicsState.isOnRoad;

            if (isDrifting) {
                // Skid marks on road
                if (physicsState.isOnRoad && Math.random() < 0.3) {
                    this.createSkidMark(
                        this.car.position.x,
                        this.car.position.z,
                        this.car.rotation.y,
                        Math.min(Math.abs(physicsState.speed) / 20, 1)
                    );
                }

                // Dust on grass
                if (!physicsState.isOnRoad && Math.random() < 0.1) {
                    this.spawnDustBurst(
                        this.car.position.x - Math.sin(this.car.rotation.y) * 2,
                        0.1,
                        this.car.position.z - Math.cos(this.car.rotation.y) * 2,
                        0.3
                    );
                }
            }
        }
    }

    updateWheels() {
        if (!this.wheels || !this.car) return;

        // Calculate wheel rotation based on speed (distance traveled per frame)
        const wheelRadius = 0.48;
        const speed = this.vehiclePhysics.speed;
        const rotationAmount = (speed * (this.frameDelta || 0)) / wheelRadius; // Assuming ~60fps

        // Get steering angle from physics
        const steeringAngle = this.vehiclePhysics.steerAngle;

        this.wheels.forEach((wheel, index) => {
            // Apply steering to front wheels (rotate the entire group around Y)
            if (wheel.userData.steering) {
                wheel.rotation.y = steeringAngle;
            }

            wheel.userData.spinner.rotation.x += rotationAmount;
        });
    }

    updateCamera() {
        const target = this.car;
        if (!target) return;

        let targetPos = new THREE.Vector3();
        let lookPos = new THREE.Vector3();

        const mouseYaw = this.mouseCamera ? this.mouseCamera.yaw : 0;
        const mousePitch = this.mouseCamera ? this.mouseCamera.pitch : 0;

        // Dynamic speed factor for camera effects
        const speedNorm = this.vehiclePhysics ? Math.min(Math.abs(this.vehiclePhysics.speed) / CONFIG.MAX_SPEED, 1.0) : 0;
        const isBoosting = this.state.isBoosting && this.state.input.throttle > 0;

        // Dynamic FOV: 65° at rest → 80° at max, +5° during boost
        const targetFOV = this.reducedMotion ? 65 : 65 + speedNorm * 6 + (isBoosting ? 2 : 0);
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, 1 - Math.exp(-3 * (this.frameDelta || .016)));
        this.camera.updateProjectionMatrix();

        // Adaptive lerp: tighter at speed
        const adaptiveLerp = 1 - Math.exp(-(this.reducedMotion ? 6 : 4 + speedNorm * 4) * (this.frameDelta || .016));

        switch (this.state.cameraMode) {
            case 'follow':
                // Look-ahead: camera leads turns
                const steerLead = this.state.input ? (this.state.input.steer || 0) * speedNorm * 0.3 : 0;
                const baseAngle = target.rotation.y + mouseYaw + steerLead;

                // Camera pulls back during boost, drops at speed
                const boostPullback = isBoosting && !this.reducedMotion ? 1.5 : 0;
                const dynamicDist = this.state.cameraDistance + boostPullback - speedNorm * 2;
                const dynamicHeight = this.state.cameraHeight - speedNorm * 1.5;

                const heightOffset = dynamicHeight + Math.sin(mousePitch) * dynamicDist * 0.5;
                const distanceOffset = dynamicDist * Math.cos(mousePitch * 0.5);

                targetPos.set(
                    target.position.x - Math.sin(baseAngle) * distanceOffset,
                    target.position.y + heightOffset,
                    target.position.z - Math.cos(baseAngle) * distanceOffset
                );
                lookPos.copy(target.position).add(new THREE.Vector3(0, 2, 0));
                break;

            case 'orbit':
                const orbitAngle = (this.reducedMotion ? 0 : this.state.time * 0.15) + mouseYaw;
                targetPos.set(
                    target.position.x + Math.sin(orbitAngle) * this.state.cameraDistance,
                    target.position.y + this.state.cameraHeight + mousePitch * 10,
                    target.position.z + Math.cos(orbitAngle) * this.state.cameraDistance
                );
                lookPos.copy(target.position);
                break;

            case 'first-person':
                if (this.state.playerMode === 'driving') {
                    targetPos.copy(this.car.position).add(
                        new THREE.Vector3(
                            Math.sin(this.car.rotation.y) * 0.3,
                            1.6,
                            Math.cos(this.car.rotation.y) * 0.3
                        )
                    );
                    lookPos.copy(targetPos).add(
                        new THREE.Vector3(
                            Math.sin(this.car.rotation.y + mouseYaw) * 10,
                            -0.5 + mousePitch * 5,
                            Math.cos(this.car.rotation.y + mouseYaw) * 10
                        )
                    );
                } else {
                    targetPos.copy(this.character.position).add(new THREE.Vector3(0, 1.8, 0));
                    lookPos.copy(targetPos).add(
                        new THREE.Vector3(
                            Math.sin(this.character.rotation.y + mouseYaw) * 10,
                            mousePitch * 5,
                            Math.cos(this.character.rotation.y + mouseYaw) * 10
                        )
                    );
                }
                break;
        }

        // Camera collision prevention
        targetPos = this.preventCameraCollision(target.position, targetPos);

        this.camera.position.lerp(targetPos, adaptiveLerp);

        const currentDir = new THREE.Vector3();
        this.camera.getWorldDirection(currentDir);
        const targetDir = new THREE.Vector3().subVectors(lookPos, this.camera.position).normalize();
        currentDir.lerp(targetDir, adaptiveLerp);
        this.camera.lookAt(this.camera.position.clone().add(currentDir));
    }

    // No tall buildings to clip through in open world
    preventCameraCollision(carPos, cameraPos) {
        return cameraPos;
    }

    updateAnimations() {
        // Spin secret cubes
        if (this.secretCubes) {
            this.secretCubes.forEach((cube, i) => {
                cube.rotation.x += 0.02 + i * 0.005;
                cube.rotation.y += 0.03 + i * 0.005;
                cube.position.y = 1.5 + i * 0.3 + Math.sin(this.state.time * 2 + i) * 0.3;
            });
        }

        // 🌈 RAINBOW MODE (Konami code activated)
        if (this.state.rainbowMode && this.car) {
            const hue = (this.state.time * 50) % 360;
            this.car.traverse(child => {
                if (child.isMesh && child.material && child.material.color && child.userData.originalColor !== undefined) {
                    child.material.color.setHSL(hue / 360, 0.8, 0.5);
                }
            });
        }

        // Animate building signs (gentle float)
        this.sections.forEach((section, i) => {
            const sign = section.children.find(c => c.type === 'Group' && c.children && c.children.length > 1);
            if (sign) {
                const buildingHeight = section.userData.buildingHeight || 35;
                const baseY = buildingHeight + 6;
                sign.position.y = baseY + Math.sin(this.state.time * 2 + i) * 0.5;
                sign.rotation.y = Math.sin(this.state.time * 0.5 + i) * 0.1;
            }
        });

        // Animate particles
        if (this.particles && this.particles.geometry && this.particles.geometry.attributes.position) {
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += Math.sin(this.state.time + i * 0.1) * 0.01;
                if (positions[i + 1] > 35) positions[i + 1] = 2;
                if (positions[i + 1] < 2) positions[i + 1] = 2;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
    }

    // 🚗 DRIFT DETECTION - now uses physics slip-angle data
    checkDrift() {
        if (!this.vehiclePhysics || !this.car) return;

        const speed = Math.abs(this.vehiclePhysics.speed);
        const speedKmh = speed * 3.6;

        // Use real drift state from physics
        const isDrifting = this.vehiclePhysics.isDrifting;

        if (isDrifting && !this.state.wasDrifting) {
            // Start drift
            this.playTireScreech();
            this.state.driftStartTime = this.state.time;
        }

        if (isDrifting) {
            // Spawn tire smoke
            if (this.frameCount % 3 === 0) {
                this.spawnDriftSmoke();
            }

            // Continuous tire audio (modulate existing screech)
            if (this.tireScreechGain) {
                const driftIntensity = Math.min(Math.abs(this.vehiclePhysics.slipAngle) / 0.8, 1);
                this.tireScreechGain.gain.value = 0.05 + driftIntensity * 0.1;
            }

            // Check for drift achievement
            const driftDuration = this.state.time - (this.state.driftStartTime || 0);
            if (driftDuration > 2 && !safeStorage.getItem('achievement_driftKing')) {
                safeStorage.setItem('achievement_driftKing', 'true');
                this.showToast('💨', 'Drift King!', 'Held a drift for 2+ seconds');
            }
        } else {
            // Fade out tire audio
            if (this.tireScreechGain) {
                this.tireScreechGain.gain.value *= 0.85;
            }
        }

        this.state.wasDrifting = isDrifting;
    }

    playTireScreech() {
        if (!this.audioContext || this.state.quality === 'low') return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Continuous tire screech with gain control for drift
        const duration = 1.5;
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = false;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2500;
        filter.Q.value = 4;

        const gain = this.audioContext.createGain();
        gain.gain.value = 0.06;

        // Store reference for continuous modulation
        this.tireScreechGain = gain;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterAudio || this.audioContext.destination);

        source.start();
        source.stop(this.audioContext.currentTime + duration);

        // Clear reference after sound ends
        setTimeout(() => {
            if (this.tireScreechGain === gain) {
                this.tireScreechGain = null;
            }
        }, duration * 1000);
    }

    spawnDriftSmoke() {
        if (!this.car || this.state.quality === 'low') return;
        if (!this.driftSmokePool) {
            this.driftSmokePool = [];
            this.activeDriftSmoke = [];
        }

        if (this.activeDriftSmoke.length > 20) return;

        // Spawn at rear wheels
        [-1.1, 1.1].forEach(xOffset => {
            let smoke;
            if (this.driftSmokePool.length > 0) {
                smoke = this.driftSmokePool.pop();
                smoke.visible = true;
            } else {
                const geom = new THREE.SphereGeometry(0.3, 6, 6);
                const mat = new THREE.MeshBasicMaterial({
                    color: 0xCCCCCC,
                    transparent: true,
                    opacity: 0.4
                });
                smoke = new THREE.Mesh(geom, mat);
                this.scene.add(smoke);
            }

            const worldPos = new THREE.Vector3(xOffset, 0.3, -2);
            worldPos.applyMatrix4(this.car.matrixWorld);
            smoke.position.copy(worldPos);
            smoke.scale.setScalar(1);
            smoke.userData.life = 1.0;

            this.activeDriftSmoke.push(smoke);
        });
    }

    updateDriftSmoke(delta) {
        if (!this.activeDriftSmoke) return;

        for (let i = this.activeDriftSmoke.length - 1; i >= 0; i--) {
            const smoke = this.activeDriftSmoke[i];
            smoke.userData.life -= delta * 1.5;
            smoke.position.y += delta * 2;
            smoke.scale.addScalar(delta * 3);
            smoke.material.opacity = smoke.userData.life * 0.4;

            if (smoke.userData.life <= 0) {
                smoke.visible = false;
                this.driftSmokePool.push(smoke);
                this.activeDriftSmoke.splice(i, 1);
            }
        }
    }

    checkSectionProximity() {
        if (document.getElementById('modalOverlay').classList.contains('active')) return;

        const pos = this.state.playerMode === 'driving' ? this.car.position : this.character.position;

        let closest = null;
        let closestDist = CONFIG.SECTION_DETECTION_RADIUS;

        this.sections.forEach(section => {
            const dist = pos.distanceTo(section.position);
            if (dist < closestDist) {
                closest = section;
                closestDist = dist;
            }
        });

        if (closest !== this.state.currentSection) {
            this.state.currentSection = closest;
            this.state.holdingSpaceTime = 0; // Reset hold timer

            const indicator = document.getElementById('sectionIndicator');
            const dot = document.getElementById('indicatorDot');
            const title = document.getElementById('indicatorTitle');
            const hint = indicator.querySelector('.section-indicator-hint');

            if (closest) {
                const color = '#' + new THREE.Color(closest.userData.color).getHexString();
                dot.style.backgroundColor = color;
                dot.style.color = color;
                title.textContent = `${closest.userData.icon} ${closest.userData.title}`;
                hint.textContent = matchMedia('(pointer: coarse), (max-width: 700px)').matches ? 'Tap ↵ to enter' : 'Hold SPACE to enter';
                hint.style.display = 'inline';
                indicator.style.display = 'block';

                // Show toast for first approach to this section
                if (!this.state.sectionsVisited.has(closest.userData.title)) {
                    this.showToast(closest.userData.icon, `Discovered: ${closest.userData.title}`, 'Hold SPACE to explore', 2500);
                }

                // Show sidebar with content
                this.showSidebar(closest.userData);

                // Update URL hash for deep linking
                this.updateHashForSection(closest.userData.title);
            } else {
                indicator.style.display = 'none';
                this.updateProgressBar(0);

                // Hide sidebar
                this.hideSidebar();

                // Clear URL hash
                this.clearHash();
            }
        }

        // Handle hold-to-enter mechanic
        if (this.state.currentSection && this.state.keys['Space']) {
            this.state.holdingSpaceTime += this.frameDelta || 0.016;
            const holdRequired = 0.5; // Half second to enter
            const progress = Math.min(this.state.holdingSpaceTime / holdRequired, 1);

            this.updateProgressBar(progress);

            if (progress >= 1) {
                this.openModal(this.state.currentSection.userData);
                this.state.holdingSpaceTime = 0;
                this.updateProgressBar(0);
            }
        } else {
            if (this.state.holdingSpaceTime > 0) {
                this.state.holdingSpaceTime = Math.max(0, this.state.holdingSpaceTime - 0.032);
                this.updateProgressBar(this.state.holdingSpaceTime / 0.5);
            }
        }
    }

    updateMinimap() {
        const canvas = document.getElementById('miniMapCanvas');
        if (!canvas || !this.car) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear with semi-transparent background
        ctx.fillStyle = 'rgba(248, 250, 252, 0.95)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Stylized grid
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= canvas.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i <= canvas.height; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Use actual car position for tracking
        const carX = this.car.position.x;
        const carZ = this.car.position.z;
        const carAngle = this.car.rotation.y;

        // Scale: map world units to minimap pixels
        // World is roughly -120 to +120 in x, -120 to +120 in z
        // Minimap is ~150px, so scale = 150 / 240 ≈ 0.6
        const scale = 0.55;

        // Draw section positions on minimap (no roads in open world)
        const toMinimap = (worldX, worldZ) => ({
            x: cx + (worldX - carX) * scale,
            y: cy + (worldZ - carZ) * scale
        });
        this.sections.forEach(section => {
            const pos = toMinimap(section.position.x, section.position.z);

            // Skip if off-screen
            if (pos.x < -10 || pos.x > canvas.width + 10 || pos.y < -10 || pos.y > canvas.height + 10) return;

            const color = '#' + new THREE.Color(section.userData.color).getHexString();
            const icon = section.userData.icon || '📍';

            // Glow effect
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;

            // White border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Icon in center
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon, pos.x, pos.y);
        });

        // Draw player (always at center)
        ctx.save();
        ctx.translate(cx, cy);
        // Rotate to match car direction
        // Three.js: +Z is forward, rotation.y is yaw counter-clockwise
        // Canvas: -Y is up, need to add PI/2 to point up when facing +Z
        ctx.rotate(-carAngle + Math.PI);

        // Player indicator with glow
        ctx.shadowColor = '#6366F1';
        ctx.shadowBlur = 15;

        const gradient = ctx.createLinearGradient(-6, -6, 6, 6);
        gradient.addColorStop(0, '#6366F1');
        gradient.addColorStop(1, '#EC4899');
        ctx.fillStyle = gradient;

        // Draw arrow pointing in direction of travel
        ctx.beginPath();
        ctx.moveTo(0, -10);   // Front point
        ctx.lineTo(-6, 8);   // Back left
        ctx.lineTo(0, 4);    // Back center indent
        ctx.lineTo(6, 8);    // Back right
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.restore();
    }

    updateFPS() {
        const now = performance.now();
        const delta = now - this.lastFpsTime;
        // Proper FPS calculation: we update every 30 frames, so multiply by 30
        this.fps = Math.round(30000 / delta);
        if (this.diagnostics) { const d=this.diagnostics.snapshot(); document.getElementById('performanceReadout').textContent = `${this.state.quality} · ${this.fps} fps · p95 ${Math.round(d.p95)}ms · ${d.drawCalls || 0} draws`; }
        this.lastFpsTime = now;

        // Clamp FPS display to reasonable range
        const displayFps = Math.min(Math.max(this.fps, 0), 999);
        document.getElementById('fpsCounter').textContent = `${displayFps} FPS`;

        // 🎯 PERFORMANCE: Record FPS for adaptive quality
        if (this.adaptiveQuality && !this.manualQuality) {
            this.adaptiveQuality.recordFPS(this.fps);

            // Check if we should adjust quality
            if (this.adaptiveQuality.shouldDowngrade() && this.state.quality !== 'low') {
                const levels = ['ultra', 'high', 'medium', 'low'];
                const currentIndex = levels.indexOf(this.state.quality);
                if (currentIndex < levels.length - 1) {
                    const newLevel = levels[currentIndex + 1];
                    document.getElementById('qualitySelect').value = newLevel;
                    this.applyQuality(newLevel);

                    this.showToast('⚙️', 'Quality Adjusted', `Lowered to ${newLevel} for better performance`);
                }
            }
        }
    }

    // ============================================
    // SKID MARKS SYSTEM
    // ============================================

    createSkidMark(x, z, rotation, intensity = 1) {
        if (this.skidMarks.length >= this.maxSkidMarks) {
            // Remove oldest skid mark
            const oldest = this.skidMarks.shift();
            this.scene.remove(oldest);
            oldest.geometry.dispose();
            oldest.material.dispose();
        }

        const skidGeom = new THREE.PlaneGeometry(0.3, 2);
        const skidMat = new THREE.MeshBasicMaterial({
            color: 0x1a1a1a,
            transparent: true,
            opacity: 0.6 * intensity,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const skid = new THREE.Mesh(skidGeom, skidMat);
        skid.rotation.x = -Math.PI / 2;
        skid.rotation.z = rotation;
        skid.position.set(x, 0.02, z);
        skid.userData.createdAt = performance.now();
        skid.userData.fadeTime = 10000; // Fade over 10 seconds

        this.scene.add(skid);
        this.skidMarks.push(skid);
    }

    updateSkidMarks() {
        const now = performance.now();

        for (let i = this.skidMarks.length - 1; i >= 0; i--) {
            const skid = this.skidMarks[i];
            const age = now - skid.userData.createdAt;
            const fadeProgress = age / skid.userData.fadeTime;

            if (fadeProgress >= 1) {
                this.scene.remove(skid);
                skid.geometry.dispose();
                skid.material.dispose();
                this.skidMarks.splice(i, 1);
            } else {
                skid.material.opacity = 0.6 * (1 - fadeProgress);
            }
        }
    }

    // ============================================
    // DAY/NIGHT CYCLE
    // ============================================

    updateDayNightCycle(delta) { this.environment?.update(delta); }

    startAmbientSounds() {
        if (this.ambientPlaying || !this.audioContext) return;

        // Birds chirping (random high-pitched tones)
        this.birdInterval = setInterval(() => {
            if (Math.random() > 0.7) {
                this.playBirdSound();
            }
        }, 3000);

        // Wind (filtered noise)
        this.createWindSound();

        this.ambientPlaying = true;
    }

    playBirdSound() {
        if (!this.audioContext || this.audioContext.state === 'suspended' || this.muted || this.dayTime < .25 || this.dayTime > .8) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000 + Math.random() * 1000, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1500 + Math.random() * 500, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.02, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.masterAudio || this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    createWindSound() {
        if (!this.audioContext || this.muted) return;

        // Create noise buffer for wind
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        this.windNoise = this.audioContext.createBufferSource();
        this.windNoise.buffer = buffer;
        this.windNoise.loop = true;

        const windFilter = this.audioContext.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.value = 400;

        const windGain = this.audioContext.createGain();
        windGain.gain.value = 0.03;

        this.windNoise.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(this.masterAudio || this.audioContext.destination);

        this.windNoise.start();
    }

    // ============================================
    // CAR HEADLIGHTS
    // ============================================

    createHeadlights() {
        if (!this.car) return;

        // Left headlight
        this.leftHeadlight = new THREE.SpotLight(0xffffcc, 0, 50, Math.PI / 6, 0.5);
        this.leftHeadlight.position.set(-0.6, 0.5, 2.5);
        this.car.add(this.leftHeadlight);
        this.leftHeadlight.target.position.set(-0.6, 0, 10);
        this.car.add(this.leftHeadlight.target);

        // Right headlight
        this.rightHeadlight = new THREE.SpotLight(0xffffcc, 0, 50, Math.PI / 6, 0.5);
        this.rightHeadlight.position.set(0.6, 0.5, 2.5);
        this.car.add(this.rightHeadlight);
        this.rightHeadlight.target.position.set(0.6, 0, 10);
        this.car.add(this.rightHeadlight.target);
    }

    updateHeadlights() {
        if (!this.leftHeadlight || !this.rightHeadlight) return;

        // Turn on headlights at night
        const isNight = this.dayTime < 0.25 || this.dayTime > 0.75;
        const intensity = isNight ? 2 : 0;

        this.leftHeadlight.intensity = intensity;
        this.rightHeadlight.intensity = intensity;
    }

    // ============================================
    // BUILDING PREVIEWS (on hover/approach)
    // ============================================

    updateBuildingPreviews() {
        const indicator = document.getElementById('sectionIndicator');
        if (!indicator || !this.car) return;

        // Find nearest building
        let nearest = null;
        let nearestDist = Infinity;

        this.sections.forEach(section => {
            const dx = this.car.position.x - section.position.x;
            const dz = this.car.position.z - section.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < nearestDist && dist < 30) {
                nearestDist = dist;
                nearest = section;
            }
        });

        if (nearest && nearest.userData) {
            indicator.style.display = 'block';
            const titleEl = indicator.querySelector('.section-indicator-title');
            const hintEl = indicator.querySelector('.section-indicator-hint');
            const dotEl = indicator.querySelector('.section-indicator-dot');

            if (titleEl) titleEl.textContent = nearest.userData.icon + ' ' + nearest.userData.title;
            if (hintEl) hintEl.textContent = nearestDist < 15 ? 'Press SPACE to enter' : `${Math.round(nearestDist)}m away`;
            if (dotEl) dotEl.style.color = '#' + new THREE.Color(nearest.userData.color).getHexString();

            this.state.currentSection = nearest;
        } else {
            indicator.style.display = 'none';
            this.state.currentSection = null;
        }
    }

    // 🎯 PERFORMANCE: Get renderer stats for debugging
    getPerformanceStats() {
        if (!this.renderer) return {};

        const info = this.renderer.info;
        return {
            drawCalls: info.render.calls,
            triangles: info.render.triangles,
            points: info.render.points,
            lines: info.render.lines,
            textures: info.memory.textures,
            geometries: info.memory.geometries,
            fps: this.fps,
            quality: this.state.quality
        };
    }

    // ============================================
    // SPEEDOMETER HUD (Item 16)
    // ============================================
    initSpeedometer() {
        const container = document.createElement('div');
        container.id = 'speedHud';
        container.style.cssText = `
            position: fixed; bottom: 20px; left: 20px; z-index: 100;
            background: rgba(0,0,0,0.7); border-radius: 12px; padding: 12px 18px;
            color: white; font-family: 'Space Mono', monospace; font-size: 14px;
            backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.1);
            display: flex; align-items: center; gap: 10px; user-select: none;
            transition: opacity 0.3s;
        `;
        container.innerHTML = `
            <span style="font-size:20px">🏎️</span>
            <div>
                <div id="speedValue" style="font-size:22px;font-weight:bold;line-height:1">0</div>
                <div style="font-size:10px;opacity:0.6">km/h</div>
            </div>
        `;
        document.body.appendChild(container);
    }

    updateSpeedometer() {
        const el = document.getElementById('speedValue');
        if (!el) return;
        const kmh = Math.round(Math.abs(this.state.carSpeed) * 3.6);
        el.textContent = kmh;
        if (kmh < 60) el.style.color = '#4ade80';
        else if (kmh < 100) el.style.color = '#fbbf24';
        else el.style.color = '#ef4444';
    }

    // ============================================
    // RADIO STATIONS (Item 13 - part)
    // ============================================
    initRadio() {
        this.radioStation = 0; // 0=off, 1=lofi, 2=retro
        this.radioOsc = null;
        this.radioGain = null;
        this.radioInterval = null;
    }

    cycleRadio() {
        if (!this.audioContext || this.muted) return;
        this.radioStation = (this.radioStation + 1) % 3;

        // Stop current
        if (this.radioOsc) { try { this.radioOsc.stop(); } catch(e){} this.radioOsc = null; }
        if (this.radioInterval) { clearInterval(this.radioInterval); this.radioInterval = null; }
        if (this.radioGain) { this.radioGain.disconnect(); this.radioGain = null; }

        const names = ['Off', 'Lo-fi Circuit', 'Retro Relay'];
        document.getElementById('radioControl').textContent = this.radioStation ? `♫ ${names[this.radioStation]}` : 'Radio · off';
        this.showToast('📻', `Radio: ${names[this.radioStation]}`, 'Press R to change', 2000);

        if (this.radioStation === 0) return;

        this.radioGain = this.audioContext.createGain();
        this.radioGain.gain.value = 0.08;
        this.radioGain.connect(this.masterAudio || this.audioContext.destination);

        if (this.radioStation === 1) {
            // Lo-fi: slow sine melody
            const notes = [261, 293, 329, 349, 392, 349, 329, 293];
            let noteIdx = 0;
            const playNote = () => {
                if (this.radioStation !== 1) return;
                if (this.radioOsc) try { this.radioOsc.stop(); } catch(e){}
                this.radioOsc = this.audioContext.createOscillator();
                this.radioOsc.type = 'sine';
                this.radioOsc.frequency.value = notes[noteIdx % notes.length];
                this.radioOsc.connect(this.radioGain);
                this.radioOsc.start();
                this.radioOsc.stop(this.audioContext.currentTime + 0.4);
                noteIdx++;
            };
            playNote();
            this.radioInterval = setInterval(playNote, 500);
        } else if (this.radioStation === 2) {
            // Retro synth: square wave arpeggios
            const notes = [523, 659, 784, 1047, 784, 659, 523, 392];
            let noteIdx = 0;
            const playNote = () => {
                if (this.radioStation !== 2) return;
                if (this.radioOsc) try { this.radioOsc.stop(); } catch(e){}
                this.radioOsc = this.audioContext.createOscillator();
                this.radioOsc.type = 'square';
                this.radioOsc.frequency.value = notes[noteIdx % notes.length];
                this.radioOsc.connect(this.radioGain);
                this.radioOsc.start();
                this.radioOsc.stop(this.audioContext.currentTime + 0.15);
                noteIdx++;
            };
            playNote();
            this.radioInterval = setInterval(playNote, 200);
        }
    }

    // ============================================
    // MUTE TOGGLE (Item 5 - supplement)
    // ============================================
    initMuteButton() {
        const btn = document.getElementById('muteBtn');
        btn.addEventListener('click', () => { this.toggleMute(); document.getElementById('gameContainer').focus(); });
    }

    toggleMute() {
        if (!this.audioContext) return;
        const btn = document.getElementById('muteBtn');
        if (!this.muted) {
            this.audioContext.suspend();
            this.muted = true;
            if (btn) { btn.textContent = '🔇'; btn.setAttribute('aria-pressed', 'true'); } this.syncMusic?.();
        } else {
            this.audioContext.resume();
            this.muted = false;
            if (btn) { btn.textContent = '🔊'; btn.setAttribute('aria-pressed', 'false'); } this.syncMusic?.();
        }
    }

    // ============================================
    // ANALYTICS (Item 15)
    // ============================================

    startLoop() {
        if (this.animationFrame) return;
        this.clock.getDelta();
        this.animate();
    }

    isInterfaceOpen() {
        return document.getElementById('modalOverlay').classList.contains('active') ||
            document.getElementById('tutorialOverlay').classList.contains('active') ||
            document.getElementById('settingsPanel').classList.contains('active') ||
            document.getElementById('destinationsDialog').open || document.getElementById('experimentDialog').open || document.getElementById('radioDialog').open;
    }

    resetInput() {
        this.state.keys = {};
        this.touchInput = {throttle:0,brake:0,steer:0};
        this.physicsAccumulator = 0;
        Object.assign(this.state.input, { throttle: 0, brake: 0, steer: 0, boost: false });
        this.state.holdingSpaceTime = 0;
        if (this.mouseCamera) this.mouseCamera.enabled = false;
        document.getElementById('joystickInner').style.transform = '';
    }

    initCockpit() {
        this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (this.reducedMotion) {
            this.applyEffects('minimal');
            document.getElementById('effectsSelect').value = 'minimal';
            if (this.motionBlurPass) this.motionBlurPass.enabled = false;
        }
        const dialog = document.getElementById('destinationsDialog');
        document.getElementById('destinationsBtn').onclick = () => { this.resetInput(); dialog.showModal(); };
        document.getElementById('closeDestinations').onclick = () => dialog.close();
        dialog.addEventListener('close', () => {
            const target = document.getElementById('modalOverlay').classList.contains('active') ? 'modalClose' : 'gameContainer';
            document.getElementById(target).focus();
        });
        dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
        this.initWorldControls();
        document.getElementById('helpBtn').onclick = () => { this.resetInput(); this.showTutorial(); };
        document.querySelectorAll('[data-destination]').forEach(button => {
            button.onclick = () => {
                dialog.close();
                const title = this._hashMap[button.dataset.destination];
                history.replaceState(null, '', '#' + button.dataset.destination);
                this.handleInitialHash();
                this.openModal({ title, ...PORTFOLIO_DATA[title] });
            };
        });
        window.addEventListener('blur', () => this.resetInput());
        document.addEventListener('visibilitychange', () => this.resetInput());
        document.getElementById('mobileControls').addEventListener('touchcancel', () => this.resetInput());
        document.addEventListener('keydown', e => {
            const panel = document.getElementById('modalOverlay').classList.contains('active') ? document.getElementById('modal') : document.getElementById('tutorialOverlay').classList.contains('active') ? document.getElementById('tutorialOverlay') : null;
            if (!panel || e.key !== 'Tab') return;
            const elements = [...panel.querySelectorAll('button, a[href], select, input, [tabindex="0"]')];
            const first = elements[0], last = elements.at(-1);
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
        this.renderer.domElement.addEventListener('webglcontextlost', e => {
            e.preventDefault(); this.resetInput();
            this.showToast('↻', 'Graphics connection lost', 'Reload to restart. You can still use Destinations.', 15000);
        });
        this.renderer.domElement.addEventListener('pointerdown', () => {
            if (!this.isInterfaceOpen()) document.getElementById('gameContainer').focus();
        });
    }

    linkContactDetails() {
        const links = {
            'keithkadima@gmail.com': 'mailto:keithkadima@gmail.com',
            'linkedin.com/in/kadimakeith': 'https://linkedin.com/in/kadimakeith',
            'github.com/tufstraka': 'https://github.com/tufstraka',
            '+254 701 746 774': 'tel:+254701746774'
        };
        document.querySelectorAll('#modalContent li').forEach(item => {
            for (const [label, href] of Object.entries(links)) {
                if (!item.textContent.includes(label)) continue;
                const a = document.createElement('a'); a.href = href; a.textContent = label;
                if (href.startsWith('https:')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
                item.replaceChildren(a);
            }
        });
    }

    initWorldControls() {
        const comfort = document.getElementById('comfortMode');
        comfort.checked = this.reducedMotion;
        comfort.onchange = () => {
            this.reducedMotion = comfort.checked;
            if (this.reducedMotion) this.state.cameraMode = 'follow';
            document.body.classList.toggle('comfort-mode', this.reducedMotion);
            safeStorage.setItem('keith_comfort', String(this.reducedMotion));
        };
        if (safeStorage.getItem('keith_comfort') === 'true') { comfort.checked = true; comfort.onchange(); }
        document.getElementById('timeSelect').onchange = e => this.setTimeOfDay(e.target.value);
        document.getElementById('volumeControl').oninput = e => {
            const value = Number(e.target.value) / 100;
            if (this.masterAudio) this.masterAudio.gain.setTargetAtTime(value, this.audioContext.currentTime, .05);
            safeStorage.setItem('keith_volume', String(value)); this.syncMusic?.();
        };
        document.getElementById('resetCar').onclick = () => {
            this.resetInput(); this.vehiclePhysics.reset(); this.car.position.set(0,.5,60);
            this.car.rotation.set(0,Math.PI,0); this.vehiclePhysics.rotation = Math.PI; this.state.carSpeed = 0; this.state.lastPosition = null;
            this.camera.position.set(0,12,80); this.camera.lookAt(0,0,60);
            document.getElementById('settingsPanel').classList.remove('active');
            document.getElementById('settingsBtn').setAttribute('aria-expanded','false');
            document.getElementById('gameContainer').focus();
            this.showToast('↻','Back on the road','Your discoveries are safe.');
        };
        document.getElementById('radioControl').onclick = () => {
            if (this.muted) this.toggleMute();
            this.audioContext?.resume(); this.cycleRadio();
            document.getElementById('radioControl').textContent = ['Radio · off','♫ Lo-fi Circuit','♫ Retro Relay'][this.radioStation];
            document.getElementById('gameContainer').focus();
        };
        document.querySelector('.pilot-brand').onclick = e => { e.preventDefault(); document.getElementById('resetCar').click(); };
    }

    playUiTone() {
        if (!this.audioContext || this.muted) return;
        const ctx=this.audioContext,osc=ctx.createOscillator(),gain=ctx.createGain();
        osc.frequency.setValueAtTime(520,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(780,ctx.currentTime+.12);
        gain.gain.setValueAtTime(.035,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.22);
        osc.connect(gain);gain.connect(this.masterAudio || ctx.destination);osc.start();osc.stop(ctx.currentTime+.23);
        osc.onended=()=>{osc.disconnect();gain.disconnect();};
    }

    initAnalytics() {
        this.analytics = {
            startTime: Date.now(),
            sectionTimes: {},
            totalVisits: 0
        };

        // Progress badge
        const badge = document.createElement('div');
        badge.id = 'analyticsBadge';
        badge.style.cssText = `
            position: fixed; top: 20px; left: 20px; z-index: 200;
            background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2);
            color: white; font-family: 'Space Mono', monospace; font-size: 12px;
            padding: 8px 12px; border-radius: 8px; backdrop-filter: blur(8px);
            cursor: default; user-select: none;
        `;
        badge.textContent = '0 / 5 DISCOVERED';
        document.body.appendChild(badge);

        // Save/restore from sessionStorage
        try {
            const saved = sessionStorage.getItem('portfolio_analytics');
            if (saved) this.analytics = { ...this.analytics, ...JSON.parse(saved) };
        } catch(e) {}

        window.addEventListener('beforeunload', () => this.saveAnalytics());
    }

    updateAnalytics(delta) {
        if (!this.analytics || !this.state.currentSection) return;
        const title = this.state.currentSection.userData.title;
        if (!this.analytics.sectionTimes[title]) this.analytics.sectionTimes[title] = 0;
        this.analytics.sectionTimes[title] += delta;
    }

    recordSectionVisit(title) {
        if (!this.analytics) return;
        this.analytics.totalVisits++;
        const badge = document.getElementById('analyticsBadge');
        if (badge) {
            const count = this.state.sectionsVisited.size;
            badge.textContent = `${count} / 5 DISCOVERED`;
            document.getElementById('missionText').textContent = count === 5 ? 'World explored. Let’s build the next one together.' : `${5 - count} stops left. Keep following your curiosity.`;
            if (count === 5) badge.textContent = '✨ All explored!';
        }
        this.saveAnalytics();
    }

    saveAnalytics() {
        try {
            const data = {
                sections: Object.keys(this.analytics.sectionTimes),
                timeSpent: this.analytics.sectionTimes,
                totalVisits: this.analytics.totalVisits,
                sessionDuration: (Date.now() - this.analytics.startTime) / 1000
            };
            sessionStorage.setItem('portfolio_analytics', JSON.stringify(data));
            console.log('📊 Portfolio Analytics:', data);
        } catch(e) {}
    }
}

// ============================================
// INITIALIZE
// ============================================

const engine = new PortfolioEngine();
engine.init();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    engine.car?.userData.environmentTarget?.dispose();
    if (engine.renderer) {
        engine.renderer.dispose();
    }
    if (engine.composer) {
        engine.composer.dispose();
    }
});

// Expose engine for debugging (optional)
window.portfolioEngine = engine;
