
        import * as THREE from 'three';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
        import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
        import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
        import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
        import { Sky } from 'three/addons/objects/Sky.js';

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
            AUTO_QUALITY_THRESHOLD: 30
        };

        // ============================================
        // PORTFOLIO DATA - Fun & Engaging
        // ============================================
        
        const PORTFOLIO_DATA = {
            'About Me': {
                color: 0xE17055,
                icon: '👋',
                position: { x: 0, z: 0 },
                content: {
                    intro: "Software engineer with a founder mindset. I design, scale, and maintain production systems — fintech, AI, logistics. Based in Nairobi 🇰🇪",
                    sections: [
                        {
                            title: "What I Build",
                            items: [
                                "Real-time systems with WebSockets & low latency",
                                "Scalable microservices handling high concurrency",
                                "CI/CD pipelines with 95%+ test coverage",
                                "Production systems at telecom scale (millions of users)"
                            ]
                        },
                        {
                            title: "Beyond Code",
                            items: [
                                "♟️ Chess player — always thinking moves ahead",
                                "🎮 Gamer — understanding systems through play",
                                "🎨 Creating art, even if it isn't perfect",
                                "💡 Code is art. This portfolio proves it."
                            ]
                        }
                    ]
                }
            },
            'Tech Stack': {
                color: 0x00B894,
                icon: '⚡',
                position: { x: 70, z: -50 },
                content: {
                    intro: "Backend-heavy, full-stack capable. Always picking the right tool for the job.",
                    sections: [
                        {
                            title: "Backend & Systems",
                            items: [
                                "Node.js, Golang — high-concurrency workloads",
                                "REST APIs, gRPC, WebSockets — real-time comms",
                                "Microservices, System Design — scale first",
                                "Python — automation & AI/ML experiments"
                            ]
                        },
                        {
                            title: "Data & Cloud",
                            items: [
                                "PostgreSQL — optimized queries, indexing, pooling",
                                "MongoDB, Redis — flexible data needs",
                                "AWS (EKS, EC2, S3, CloudWatch) — cloud native",
                                "Docker, GitHub Actions — CI/CD automation"
                            ]
                        },
                        {
                            title: "Frontend & More",
                            items: [
                                "React, Next.js — modern web apps",
                                "Three.js, WebGL — 3D experiences (like this!)",
                                "Rust — the new love 🦀",
                                "Prometheus, PagerDuty — observability"
                            ]
                        }
                    ]
                }
            },
            'Projects': {
                color: 0xFDCB6E,
                icon: '🚀',
                position: { x: 0, z: -100 },
                content: {
                    intro: "Real projects, real impact. From startups I founded to platforms serving thousands.",
                    sections: [
                        {
                            title: "Founder Projects",
                            items: [
                                "🚗 Locsafe — Asset tracking with real-time WebSockets, blockchain",
                                "🍽️ SafeBite — AI food safety scanner for allergies",
                                "💰 FixFlow — Stablecoin payments on MNEE"
                            ]
                        },
                        {
                            title: "Web3 & AI",
                            items: [
                                "🏛️ Colosseum — AI agents + Polkadot stablecoins",
                                "🗳️ Jaba — Decentralized voting on ICP",
                                "🎮 Real-time multiplayer game with security focus",
                                "🔗 Shadowchain — Polkadot blockchain project"
                            ]
                        },
                        {
                            title: "Security & Tools",
                            items: [
                                "🔐 Port Scanner & SHA-1 Password Cracker",
                                "🎬 BFR — Multi-user movie/TV reviews platform",
                                "📊 Stock Price Checker with real-time data",
                                "🤖 Polybot — Python automation bot"
                            ]
                        }
                    ]
                }
            },
            'Experience': {
                color: 0x636E72,
                icon: '💼',
                position: { x: -70, z: 50 },
                content: {
                    intro: "From telecom scale to startup agility. Hands-on ownership in fast-moving environments.",
                    sections: [
                        {
                            title: "Niche Traffic Kit — 2025",
                            items: [
                                "Full Stack Engineer — Golang microservices",
                                "50%+ API response time reduction",
                                "PostgreSQL optimization & connection pooling",
                                "99.9% uptime on automation features"
                            ]
                        },
                        {
                            title: "Locsafe (Founder) — 2024",
                            items: [
                                "Lead Backend Engineer — real-time tracking",
                                "30% latency reduction via WebSocket architecture",
                                "Led team — architecture, code reviews, CI/CD",
                                "AWS + Docker production deployments"
                            ]
                        },
                        {
                            title: "Previous Roles",
                            items: [
                                "PaydHQ — Backend for ~30k users, real-time payments",
                                "Safaricom — SRE at telecom scale, millions of users",
                                "25% fewer deployment failures, 15% uptime improvement"
                            ]
                        }
                    ]
                }
            },
            'Contact': {
                color: 0xD63031,
                icon: '💬',
                position: { x: 70, z: 50 },
                content: {
                    intro: "Let's build something. Open to opportunities, collaborations, or just good conversation.",
                    sections: [
                        {
                            title: "Reach Out",
                            items: [
                                "📧 keithkadima@gmail.com",
                                "💼 linkedin.com/in/kadimakeith",
                                "🐙 github.com/tufstraka",
                                "📱 +254 701 746 774"
                            ]
                        },
                        {
                            title: "Location",
                            items: [
                                "📍 Nairobi, Kenya",
                                "🌍 Open to remote work globally",
                                "⏰ EAT (UTC+3)"
                            ]
                        }
                    ]
                }
            }
        };
        
        // ============================================
        // COLLISION SYSTEM
        // ============================================
        
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
            
            // Check if a point is on the road (for friction calculation)
            isOnRoad(x, z) {
                // Hub and spoke road layout - explicit positions
                const hub = { x: 0, z: 0 };        // About Me (center)
                const startPos = { x: 0, z: 60 };  // Player spawn
                const buildings = [
                    { x: 70, z: -50 },   // Tech Stack
                    { x: 0, z: -100 },   // Projects
                    { x: -70, z: 50 },   // Experience
                    { x: 70, z: 50 }     // Contact
                ];
                const roadWidth = 7; // Half width for distance check
                
                // Check if on start road (start to hub)
                const distToStartRoad = this.pointToSegmentDistance(x, z, startPos.x, startPos.z, hub.x, hub.z);
                if (distToStartRoad < roadWidth) return true;
                
                // Check if on any spoke road (hub to each building)
                for (const building of buildings) {
                    const dist = this.pointToSegmentDistance(x, z, hub.x, hub.z, building.x, building.z);
                    if (dist < roadWidth) return true;
                }
                
                // Check if at any intersection
                const allPoints = [startPos, hub, ...buildings];
                for (const pos of allPoints) {
                    const distToPoint = Math.sqrt((x - pos.x) ** 2 + (z - pos.z) ** 2);
                    if (distToPoint < 12) return true; // Intersection radius
                }
                
                return false;
            }
            
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
                
                // --- STEERING ---
                this.targetSteerAngle = input.steer * CONFIG.MAX_STEER_ANGLE;
                
                // Smooth steering (faster to turn, slower to return)
                const steerSpeed = Math.abs(this.targetSteerAngle) > Math.abs(this.steerAngle) 
                    ? CONFIG.STEER_SPEED : CONFIG.STEER_RETURN_SPEED;
                this.steerAngle = THREE.MathUtils.lerp(
                    this.steerAngle, 
                    this.targetSteerAngle, 
                    steerSpeed * delta
                );
                
                // Reduce steering effectiveness at high speed (understeer) and in air
                const speedFactor = 1 - (Math.abs(this.speed) / CONFIG.MAX_SPEED) * 0.4;
                const airFactor = this.isGrounded ? 1 : CONFIG.AIR_CONTROL;
                const effectiveSteer = this.steerAngle * speedFactor * airFactor;
                
                // --- ACCELERATION & BRAKING ---
                let accelerationForce = 0;
                const isMovingForward = this.speed > 0.1;
                const isMovingBackward = this.speed < -0.1;
                
                // Only accelerate when grounded (or reduced in air)
                const accelMultiplier = this.isGrounded ? 1 : 0.2;
                
                if (input.throttle > 0) {
                    // Accelerating forward
                    const maxSpeed = input.boost ? CONFIG.MAX_SPEED * CONFIG.BOOST_MULTIPLIER : CONFIG.MAX_SPEED;
                    if (this.speed < maxSpeed) {
                        accelerationForce = CONFIG.ACCELERATION * input.throttle * friction * accelMultiplier;
                        if (input.boost) accelerationForce *= 1.3;
                    }
                } else if (input.brake > 0) {
                    if (isMovingForward) {
                        // Braking while moving forward
                        accelerationForce = -CONFIG.BRAKE_FORCE * input.brake * friction * accelMultiplier;
                    } else if (this.speed > -CONFIG.REVERSE_MAX_SPEED) {
                        // Reversing
                        accelerationForce = -CONFIG.ACCELERATION * 0.5 * input.brake * friction * accelMultiplier;
                    }
                }
                
                // --- RESISTANCE FORCES ---
                // Rolling resistance (only when grounded)
                const rollingResistance = this.isGrounded 
                    ? -Math.sign(this.speed) * CONFIG.ROLLING_RESISTANCE * CONFIG.CAR_MASS * CONFIG.GRAVITY
                    : 0;
                
                // Air resistance (quadratic)
                const airResistance = -CONFIG.AIR_RESISTANCE * this.speed * Math.abs(this.speed);
                
                // Total acceleration
                const totalAcceleration = accelerationForce + (rollingResistance + airResistance) / CONFIG.CAR_MASS;
                
                // Update speed
                this.speed += totalAcceleration * delta;
                
                // Natural stop at very low speeds
                if (Math.abs(this.speed) < 0.1 && input.throttle === 0 && input.brake === 0 && this.isGrounded) {
                    this.speed *= 0.9;
                    if (Math.abs(this.speed) < 0.01) this.speed = 0;
                }
                
                // --- TURNING ---
                if (Math.abs(this.speed) > 0.5 && Math.abs(effectiveSteer) > 0.001) {
                    // Ackermann-ish steering: turn rate depends on speed and steer angle
                    const wheelBase = CONFIG.CAR_LENGTH * 0.6;
                    const tanSteer = Math.tan(Math.abs(effectiveSteer));
                    // Prevent division by zero or very small numbers
                    const turnRadius = tanSteer > 0.001 ? wheelBase / tanSteer : 1000;
                    const angularVel = this.speed / turnRadius * Math.sign(effectiveSteer);
                    
                    // Reduced turning in air
                    const turnMultiplier = this.isGrounded ? 1 : CONFIG.AIR_CONTROL;
                    this.rotation += angularVel * delta * turnMultiplier;
                }
                
                // --- GRAVITY & VERTICAL PHYSICS ---
                if (!this.isGrounded) {
                    // Apply gravity
                    this.velocityY -= CONFIG.GRAVITY * delta;
                    // Terminal velocity cap
                    this.velocityY = Math.max(this.velocityY, -50);
                }
                
                // Update vertical position
                this.y += this.velocityY * delta;
                
                // Ground collision - STRICT enforcement
                // The ground has slight height variation from terrain
                const terrainHeight = this.getTerrainHeight(this.x, this.z);
                
                if (this.y <= terrainHeight) {
                    this.y = terrainHeight;
                    if (this.velocityY < -2) {
                        // Hard landing - bounce slightly and lose some speed
                        this.landingImpact = Math.abs(this.velocityY);
                        this.velocityY = Math.abs(this.velocityY) * 0.15;
                        this.speed *= 0.9;
                        
                        // ⚡ GAME FEEL: Three-tier impact system
                        const impactIntensity = this.landingImpact / 15; // Normalize
                        if (this.landingImpact > 8) {
                            // Heavy impact
                            this.triggerScreenShake(0.8);
                            this.playCollisionSound(1.0);
                            this.spawnLandingParticles(15);
                        } else if (this.landingImpact > 4) {
                            // Medium impact
                            this.triggerScreenShake(0.4);
                            this.playCollisionSound(0.6);
                            this.spawnLandingParticles(8);
                        } else {
                            // Light impact
                            this.triggerScreenShake(0.15);
                            this.spawnLandingParticles(4);
                        }
                    } else {
                        this.velocityY = 0;
                        this.landingImpact = 0;
                    }
                    this.isGrounded = true;
                } else {
                    this.isGrounded = false;
                    this.landingImpact = 0;
                }
                
                // SAFETY: Absolutely never go below terrain or 0
                this.y = Math.max(this.y, Math.max(0, terrainHeight));
                
                // --- UPDATE HORIZONTAL POSITION ---
                const prevX = this.x;
                const prevZ = this.z;
                
                this.velocityX = Math.sin(this.rotation) * this.speed;
                this.velocityZ = Math.cos(this.rotation) * this.speed;
                
                this.x += this.velocityX * delta;
                this.z += this.velocityZ * delta;
                
                // --- COLLISION DETECTION ---
                const collision = collisionSystem.checkCollision(this.x, this.z, CONFIG.CAR_COLLISION_RADIUS);
                
                if (collision.collided) {
                    this.isColliding = true;
                    
                    // Push car out of collision
                    this.x += collision.pushX;
                    this.z += collision.pushZ;
                    
                    // Reduce speed on collision (bounce/impact)
                    this.speed *= (1 - CONFIG.COLLISION_BOUNCE);
                    
                    // Add small random rotation on impact for realism
                    this.rotation += (Math.random() - 0.5) * 0.1 * Math.abs(this.speed) / CONFIG.MAX_SPEED;
                } else {
                    this.isColliding = false;
                }
                
                // --- SUSPENSION / BODY DYNAMICS ---
                // Extra pitch when airborne (nose up slightly)
                const airPitch = this.isGrounded ? 0 : -0.1;
                
                // Body roll (leaning in turns)
                const lateralG = this.speed * this.angularVelocity;
                const targetRoll = -lateralG * CONFIG.BODY_ROLL_FACTOR;
                this.bodyRoll = THREE.MathUtils.lerp(this.bodyRoll, targetRoll, CONFIG.SUSPENSION_DAMPING * delta);
                this.bodyRoll = THREE.MathUtils.clamp(this.bodyRoll, -0.15, 0.15);
                
                // Body pitch (nose dive on brake, squat on accel, up when airborne)
                const targetPitch = this.isGrounded 
                    ? -accelerationForce * CONFIG.PITCH_FACTOR * 0.01
                    : airPitch;
                this.bodyPitch = THREE.MathUtils.lerp(this.bodyPitch, targetPitch, CONFIG.SUSPENSION_DAMPING * delta);
                this.bodyPitch = THREE.MathUtils.clamp(this.bodyPitch, -0.15, 0.15);
                
                return {
                    x: this.x,
                    z: this.z,
                    y: this.y + 0.5, // Car height offset
                    rotation: this.rotation,
                    steerAngle: this.steerAngle,
                    bodyRoll: this.bodyRoll,
                    bodyPitch: this.bodyPitch,
                    speed: this.speed,
                    speedKmh: Math.abs(this.speed * 3.6), // Convert m/s to km/h
                    isOnRoad: this.isOnRoad,
                    isColliding: this.isColliding,
                    isGrounded: this.isGrounded,
                    isAirborne: !this.isGrounded,
                    landingImpact: this.landingImpact
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
                    tutorialComplete: localStorage.getItem('portfolioTutorialComplete') === 'true'
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
                if (navigator.deviceMemory && navigator.deviceMemory < 4) return 'medium';
                if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return 'medium';
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
                    this.updateLoadingProgress(90);
                    
                    // Position car at start
                    this.car.position.set(0, 0.5, 60);
                    this.camera.position.set(0, 12, 80);
                    
                    // Initialize physics position
                    this.vehiclePhysics.x = 0;
                    this.vehiclePhysics.z = 60;
                    this.vehiclePhysics.rotation = 0;
                    
                    this.updateLoadingProgress(100);
                    
                    // Hide loading screen with style
                    setTimeout(() => {
                        document.getElementById('loadingScreen').classList.add('hidden');
                        
                        // Show tutorial for first-time visitors
                        if (!this.state.tutorialComplete) {
                            this.showTutorial();
                        } else {
                            this.animate();
                            this.showToast('🚗', 'Welcome Back!', 'Drive to any building to explore');
                        }
                    }, 600);
                    
                    // Load non-critical assets progressively
                    setTimeout(() => this.loadEnvironmentDetails(), 500);
                } catch (error) {
                    console.error('Portfolio initialization failed:', error);
                    // Show error message to user
                    const loadingContent = document.querySelector('.loading-content');
                    if (loadingContent) {
                        loadingContent.innerHTML = `
                            <div class="loading-logo">⚠️</div>
                            <h1 class="loading-title">Oops!</h1>
                            <p class="loading-subtitle">Something went wrong. Please refresh the page.</p>
                            <p style="color: #64748B; font-size: 0.75rem; margin-top: 1rem;">${error.message}</p>
                        `;
                    }
                }
            }
            
            updateLoadingProgress(percent) {
                document.getElementById('loadingBar').style.width = `${percent}%`;
            }
            
            // ============================================
            // GAME FEEL & UX METHODS
            // ============================================
            
            showTutorial() {
                const overlay = document.getElementById('tutorialOverlay');
                overlay.classList.add('active');
                
                document.getElementById('tutorialStartBtn').addEventListener('click', () => {
                    this.closeTutorial();
                });
                
                document.getElementById('tutorialSkipBtn').addEventListener('click', () => {
                    this.closeTutorial();
                });
            }
            
            closeTutorial() {
                const overlay = document.getElementById('tutorialOverlay');
                overlay.classList.remove('active');
                
                // Mark tutorial as complete
                this.state.tutorialComplete = true;
                localStorage.setItem('portfolioTutorialComplete', 'true');
                
                // Start the game
                this.animate();
                
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
                if (this.state.quality === 'low') return; // Skip on low quality
                
                const container = document.getElementById('gameContainer');
                container.style.animation = 'none';
                container.offsetHeight; // Trigger reflow
                container.style.animation = `shake ${0.2 + intensity * 0.1}s ease-out`;
                
                setTimeout(() => {
                    container.style.animation = 'none';
                }, 300);
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
                    !localStorage.getItem('achievement_speedDemon')) {
                    localStorage.setItem('achievement_speedDemon', 'true');
                    this.showToast('🔥', 'Speed Demon!', 'Boosted for 3 seconds straight');
                    // Achievement unlocked - subtle celebration
                }
                
                // Explorer achievement (visit all sections)
                if (this.state.sectionsVisited.size === 5 && 
                    !localStorage.getItem('achievement_explorer')) {
                    localStorage.setItem('achievement_explorer', 'true');
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
                        !localStorage.getItem('achievement_roadWarrior')) {
                        localStorage.setItem('achievement_roadWarrior', 'true');
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
                
                // Camera
                this.camera = new THREE.PerspectiveCamera(
                    65,
                    window.innerWidth / window.innerHeight,
                    0.1,
                    this.state.quality === 'ultra' ? 1500 : this.state.quality === 'high' ? 1000 : 500
                );
                
                // Renderer with PBR support
                this.renderer = new THREE.WebGLRenderer({
                    antialias: this.state.quality !== 'low',
                    powerPreference: 'high-performance',
                    precision: this.state.isMobile ? 'mediump' : 'highp',
                    stencil: false,
                    alpha: false
                });
                
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.state.isMobile ? 1 : 1.5));
                this.renderer.shadowMap.enabled = this.state.quality !== 'low';
                this.renderer.shadowMap.type = this.state.quality === 'ultra' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
                this.renderer.outputColorSpace = THREE.SRGBColorSpace;
                this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
                this.renderer.toneMappingExposure = 1.0;
                
                container.appendChild(this.renderer.domElement);
                
                // Post-processing
                this.composer = new EffectComposer(this.renderer);
                this.composer.addPass(new RenderPass(this.scene, this.camera));
                
                // SMAA for better anti-aliasing (when available)
                if (this.state.quality === 'ultra' || this.state.quality === 'high') {
                    const smaaPass = new SMAAPass(
                        window.innerWidth * this.renderer.getPixelRatio(),
                        window.innerHeight * this.renderer.getPixelRatio()
                    );
                    this.composer.addPass(smaaPass);
                } else if (!this.state.isMobile) {
                    const fxaaPass = new ShaderPass(FXAAShader);
                    const pixelRatio = this.renderer.getPixelRatio();
                    fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
                    fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
                    this.composer.addPass(fxaaPass);
                }
                
                // Bloom for that cinematic look (half resolution for performance)
                if (this.state.quality !== 'low') {
                    this.bloomPass = new UnrealBloomPass(
                        new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2),
                        this.state.quality === 'ultra' ? 0.25 : 0.15,
                        0.3,
                        0.9
                    );
                    this.composer.addPass(this.bloomPass);
                }
            }
            
            async createScene() {
                // Simple gradient sky background
                this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
                
                // Create hemisphere sky dome for gradient effect
                const skyGeo = new THREE.SphereGeometry(1000, 32, 15);
                this.skyMaterial = new THREE.ShaderMaterial({
                    uniforms: {
                        topColor: { value: new THREE.Color(0x0077ff) }, // Deep blue
                        bottomColor: { value: new THREE.Color(0x89CFF0) }, // Light blue
                        offset: { value: 33 },
                        exponent: { value: 0.6 }
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
                            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                        }
                    `,
                    side: THREE.BackSide
                });
                
                const sky = new THREE.Mesh(skyGeo, this.skyMaterial);
                this.scene.add(sky);
                
                // Add clouds
                this.createClouds();
                
                // Light atmospheric fog
                const fogColor = new THREE.Color(0xC8E0F0);
                this.scene.fog = new THREE.FogExp2(fogColor, 0.001);
                
                // Main directional light (sun)
                this.sunLight = new THREE.DirectionalLight(0xFFFFF0, 2.0);
                this.sunLight.position.set(100, 150, 100);
                
                if (this.state.quality !== 'low') {
                    this.sunLight.castShadow = true;
                    this.sunLight.shadow.mapSize.width = this.state.quality === 'ultra' ? 2048 : 1024;
                    this.sunLight.shadow.mapSize.height = this.state.quality === 'ultra' ? 2048 : 1024;
                    this.sunLight.shadow.camera.near = 0.5;
                    this.sunLight.shadow.camera.far = 500;
                    
                    const d = 150;
                    this.sunLight.shadow.camera.left = -d;
                    this.sunLight.shadow.camera.right = d;
                    this.sunLight.shadow.camera.top = d;
                    this.sunLight.shadow.camera.bottom = -d;
                    this.sunLight.shadow.bias = -0.0001;
                }
                
                this.scene.add(this.sunLight);
                
                // Ambient light (sky color)
                this.ambientLight = new THREE.AmbientLight(0x87CEEB, 0.4);
                this.scene.add(this.ambientLight);
                
                // Hemisphere light for realistic outdoor lighting
                this.hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3D5C3D, 0.6);
                this.scene.add(this.hemiLight);
                
                // Ground with custom shader
                await this.createTerrain();
            }
            
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
                    // Each cloud is made of multiple overlapping sprites
                    const cloudCluster = new THREE.Group();
                    
                    for (let i = 0; i < 5; i++) {
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
                const sunGeo = new THREE.SphereGeometry(30, 32, 32);
                const sunMat = new THREE.MeshBasicMaterial({
                    color: 0xFFFAE3,
                    fog: false
                });
                this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
                this.sunMesh.position.set(400, 300, -200); // Far away in the sky
                this.scene.add(this.sunMesh);
                
                // Sun glow (larger, transparent)
                const glowGeo = new THREE.SphereGeometry(50, 32, 32);
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
            
            async createTerrain() {
                // Main ground plane with realistic grass texture
                const groundSize = 2000;
                const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 64, 64);
                
                groundGeometry.computeVertexNormals();
                
                // Load realistic grass texture
                const textureLoader = new THREE.TextureLoader();
                const grassTexture = textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/terrain/grasslight-big.jpg');
                grassTexture.wrapS = THREE.RepeatWrapping;
                grassTexture.wrapT = THREE.RepeatWrapping;
                grassTexture.repeat.set(200, 200);
                
                const groundMaterial = new THREE.MeshStandardMaterial({
                    map: grassTexture,
                    roughness: 0.9,
                    metalness: 0.0
                });
                
                const ground = new THREE.Mesh(groundGeometry, groundMaterial);
                ground.rotation.x = -Math.PI / 2;
                ground.position.y = -0.05;
                ground.receiveShadow = true;
                ground.renderOrder = 0;
                this.scene.add(ground);
                
                // Store ground reference
                this.ground = ground;
                
                // Road
                this.createRoads();
            }
            
            createRoads() {
                // Roads only lead to building entrances
                const roadWidth = 10;
                const roadHeight = 0.05;
                
                // Create realistic asphalt texture
                const roadCanvas = document.createElement('canvas');
                roadCanvas.width = 512;
                roadCanvas.height = 512;
                const ctx = roadCanvas.getContext('2d');
                
                // Base asphalt color
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(0, 0, 512, 512);
                
                // Add aggregate/gravel texture
                for (let i = 0; i < 8000; i++) {
                    const x = Math.random() * 512;
                    const y = Math.random() * 512;
                    const size = Math.random() * 2 + 0.5;
                    const brightness = 30 + Math.random() * 25;
                    ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Add some darker patches (oil stains, wear)
                for (let i = 0; i < 20; i++) {
                    const x = Math.random() * 512;
                    const y = Math.random() * 512;
                    const radius = 10 + Math.random() * 30;
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                    gradient.addColorStop(0, 'rgba(20,20,20,0.3)');
                    gradient.addColorStop(1, 'rgba(20,20,20,0)');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                const roadTexture = new THREE.CanvasTexture(roadCanvas);
                roadTexture.wrapS = THREE.RepeatWrapping;
                roadTexture.wrapT = THREE.RepeatWrapping;
                
                const roadMaterial = new THREE.MeshStandardMaterial({
                    map: roadTexture,
                    roughness: 0.9,
                    metalness: 0.0,
                });
                
                // Building positions with entrance directions
                const hub = { x: 0, z: 0, entrance: 'south' };
                const startPos = { x: 0, z: 60 };
                const buildings = [
                    { x: 70, z: -50, entrance: 'west' },    // Tech Stack
                    { x: 0, z: -100, entrance: 'north' },   // Projects  
                    { x: -70, z: 50, entrance: 'east' },    // Experience
                    { x: 70, z: 50, entrance: 'west' }      // Contact
                ];
                
                // Create road from start to hub
                this.createRoadSegment(startPos, hub, roadWidth, roadHeight, roadMaterial, roadTexture);
                
                // Create roads from hub to each building entrance
                buildings.forEach(building => {
                    this.createRoadSegment(hub, building, roadWidth, roadHeight, roadMaterial, roadTexture);
                });
                
                // Create intersections
                this.createIntersection(hub.x, hub.z, 12, roadMaterial);
                this.createIntersection(startPos.x, startPos.z, 8, roadMaterial);
                buildings.forEach(b => {
                    this.createIntersection(b.x, b.z, 10, roadMaterial);
                });
            }
            
            createRoadSegment(from, to, width, height, material, texture) {
                const dx = to.x - from.x;
                const dz = to.z - from.z;
                const length = Math.sqrt(dx * dx + dz * dz);
                const angle = Math.atan2(dx, dz);
                
                // Shorten road to not overlap intersections
                const shortenedLength = length - 16;
                if (shortenedLength <= 0) return;
                
                // Set texture repeat based on road length
                const textureCopy = texture.clone();
                textureCopy.repeat.set(width / 10, shortenedLength / 10);
                textureCopy.needsUpdate = true;
                
                const roadMat = material.clone();
                roadMat.map = textureCopy;
                
                const roadGeom = new THREE.BoxGeometry(width, height, shortenedLength);
                const road = new THREE.Mesh(roadGeom, roadMat);
                
                road.position.set(
                    from.x + dx / 2,
                    height / 2,
                    from.z + dz / 2
                );
                road.rotation.y = -angle;
                road.receiveShadow = true;
                this.scene.add(road);
                
                // Add road markings
                this.addRoadMarkings(from, to, length, angle, shortenedLength, width);
            }
            
            addRoadMarkings(from, to, length, angle, roadLength, roadWidth) {
                const dx = to.x - from.x;
                const dz = to.z - from.z;
                
                // White dashed center line
                const dashLength = 4;
                const gapLength = 4;
                const numDashes = Math.floor((roadLength - 8) / (dashLength + gapLength));
                
                const lineMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xFFFFFF,
                    transparent: true,
                    opacity: 0.9
                });
                
                for (let i = 0; i < numDashes; i++) {
                    const progress = (8 + i * (dashLength + gapLength) + dashLength / 2) / length;
                    
                    const dashGeom = new THREE.BoxGeometry(0.2, 0.02, dashLength);
                    const dash = new THREE.Mesh(dashGeom, lineMaterial);
                    
                    dash.position.set(
                        from.x + dx * progress,
                        0.06,
                        from.z + dz * progress
                    );
                    dash.rotation.y = -angle;
                    this.scene.add(dash);
                }
                
                // Solid white edge lines
                [-1, 1].forEach(side => {
                    const edgeGeom = new THREE.BoxGeometry(0.15, 0.02, roadLength);
                    const edge = new THREE.Mesh(edgeGeom, lineMaterial);
                    
                    const offset = (roadWidth / 2 - 0.3) * side;
                    const midX = from.x + dx / 2;
                    const midZ = from.z + dz / 2;
                    
                    edge.position.set(
                        midX + Math.cos(angle) * offset,
                        0.06,
                        midZ - Math.sin(angle) * offset
                    );
                    edge.rotation.y = -angle;
                    this.scene.add(edge);
                });
            }
            
            createIntersection(x, z, radius, material) {
                const geometry = new THREE.CylinderGeometry(radius, radius, 0.05, 48);
                
                const intersectionMat = material ? material.clone() : new THREE.MeshStandardMaterial({
                    color: 0x2a2a2a,
                    roughness: 0.9,
                    metalness: 0.0
                });
                
                const intersection = new THREE.Mesh(geometry, intersectionMat);
                intersection.position.set(x, 0.025, z);
                intersection.receiveShadow = true;
                this.scene.add(intersection);
            }
            
            createRoadTexture() {
                const canvas = document.createElement('canvas');
                canvas.width = 1024;
                canvas.height = 1024;
                const ctx = canvas.getContext('2d');
                
                // Dark asphalt base with slight blue tint
                const gradient = ctx.createLinearGradient(0, 0, 1024, 0);
                gradient.addColorStop(0, '#2a2a2f');
                gradient.addColorStop(0.5, '#303035');
                gradient.addColorStop(1, '#2a2a2f');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 1024, 1024);
                
                // Add realistic asphalt texture (aggregate noise)
                for (let i = 0; i < 15000; i++) {
                    const x = Math.random() * 1024;
                    const y = Math.random() * 1024;
                    const size = Math.random() * 3 + 1;
                    const brightness = 35 + Math.random() * 40;
                    ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness + Math.random() * 5})`;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Add occasional lighter patches (repaired sections)
                for (let i = 0; i < 8; i++) {
                    const x = Math.random() * 900 + 50;
                    const y = Math.random() * 900 + 50;
                    const w = Math.random() * 80 + 40;
                    const h = Math.random() * 80 + 40;
                    ctx.fillStyle = `rgba(60, 60, 65, ${Math.random() * 0.3 + 0.2})`;
                    ctx.fillRect(x, y, w, h);
                }
                
                // Add tire marks (subtle)
                ctx.strokeStyle = 'rgba(20, 20, 20, 0.15)';
                ctx.lineWidth = 4;
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    const startX = 300 + Math.random() * 100;
                    ctx.moveTo(startX, 0);
                    ctx.bezierCurveTo(
                        startX + Math.random() * 50 - 25, 300,
                        startX + Math.random() * 50 - 25, 700,
                        startX + Math.random() * 100 - 50, 1024
                    );
                    ctx.stroke();
                }
                
                // Center line (dashed yellow/white)
                ctx.strokeStyle = '#E8E8E0';
                ctx.lineWidth = 12;
                ctx.setLineDash([60, 50]);
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(512, 0);
                ctx.lineTo(512, 1024);
                ctx.stroke();
                
                // Edge lines (solid white)
                ctx.setLineDash([]);
                ctx.strokeStyle = '#F0F0E8';
                ctx.lineWidth = 10;
                
                // Left edge
                ctx.beginPath();
                ctx.moveTo(60, 0);
                ctx.lineTo(60, 1024);
                ctx.stroke();
                
                // Right edge
                ctx.beginPath();
                ctx.moveTo(964, 0);
                ctx.lineTo(964, 1024);
                ctx.stroke();
                
                // Add subtle wear on lines
                ctx.strokeStyle = 'rgba(42, 42, 42, 0.3)';
                ctx.lineWidth = 2;
                for (let y = 0; y < 1024; y += 20) {
                    if (Math.random() > 0.7) {
                        ctx.beginPath();
                        ctx.moveTo(55 + Math.random() * 10, y);
                        ctx.lineTo(55 + Math.random() * 10, y + 15);
                        ctx.stroke();
                    }
                }
                
                const texture = new THREE.CanvasTexture(canvas);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                
                return texture;
            }
            
            async createVehicle() {
                const carGroup = new THREE.Group();
                
                // Realistic sports car with proper proportions
                const bodyColor = 0xC41E3A; // Deep racing red
                const bodyMaterial = new THREE.MeshStandardMaterial({
                    color: bodyColor,
                    metalness: 0.85,
                    roughness: 0.15,
                    envMapIntensity: 1.5
                });
                
                // Secondary body material (darker accents)
                const accentMaterial = new THREE.MeshStandardMaterial({
                    color: 0x1a1a1a,
                    metalness: 0.6,
                    roughness: 0.4
                });
                
                // Main body - lower chassis with realistic shape
                const lowerBodyGeom = new THREE.BoxGeometry(2.1, 0.5, 4.8);
                const lowerBody = new THREE.Mesh(lowerBodyGeom, bodyMaterial);
                lowerBody.position.set(0, 0.45, 0);
                lowerBody.castShadow = true;
                carGroup.add(lowerBody);
                
                // Front fenders (wheel arches)
                [-1, 1].forEach(side => {
                    const fenderGeom = new THREE.BoxGeometry(0.3, 0.35, 1.2);
                    const fender = new THREE.Mesh(fenderGeom, bodyMaterial);
                    fender.position.set(side * 1.05, 0.6, 1.4);
                    fender.castShadow = true;
                    carGroup.add(fender);
                });
                
                // Rear fenders (wider for sporty look)
                [-1, 1].forEach(side => {
                    const rearFenderGeom = new THREE.BoxGeometry(0.35, 0.4, 1.3);
                    const rearFender = new THREE.Mesh(rearFenderGeom, bodyMaterial);
                    rearFender.position.set(side * 1.1, 0.6, -1.5);
                    rearFender.castShadow = true;
                    carGroup.add(rearFender);
                });
                
                // Hood with slope
                const hoodGeom = new THREE.BoxGeometry(1.9, 0.25, 1.8);
                const hood = new THREE.Mesh(hoodGeom, bodyMaterial);
                hood.position.set(0, 0.75, 1.8);
                hood.rotation.x = -0.08;
                hood.castShadow = true;
                carGroup.add(hood);
                
                // Cabin/roof
                const cabinGeom = new THREE.BoxGeometry(1.85, 0.7, 2.2);
                const cabin = new THREE.Mesh(cabinGeom, bodyMaterial);
                cabin.position.set(0, 1.05, -0.3);
                cabin.castShadow = true;
                carGroup.add(cabin);
                
                // Trunk/rear
                const trunkGeom = new THREE.BoxGeometry(1.9, 0.35, 1.0);
                const trunk = new THREE.Mesh(trunkGeom, bodyMaterial);
                trunk.position.set(0, 0.7, -1.9);
                trunk.castShadow = true;
                carGroup.add(trunk);
                
                // Front grille
                const grilleMaterial = new THREE.MeshStandardMaterial({
                    color: 0x0a0a0a,
                    metalness: 0.3,
                    roughness: 0.8
                });
                const grilleGeom = new THREE.BoxGeometry(1.4, 0.25, 0.05);
                const grille = new THREE.Mesh(grilleGeom, grilleMaterial);
                grille.position.set(0, 0.45, 2.43);
                carGroup.add(grille);
                
                // Front bumper
                const bumperGeom = new THREE.BoxGeometry(2.1, 0.3, 0.3);
                const frontBumper = new THREE.Mesh(bumperGeom, accentMaterial);
                frontBumper.position.set(0, 0.3, 2.4);
                frontBumper.castShadow = true;
                carGroup.add(frontBumper);
                
                // Rear bumper
                const rearBumper = new THREE.Mesh(bumperGeom, accentMaterial);
                rearBumper.position.set(0, 0.3, -2.4);
                rearBumper.castShadow = true;
                carGroup.add(rearBumper);
                
                // Side skirts
                [-1, 1].forEach(side => {
                    const skirtGeom = new THREE.BoxGeometry(0.15, 0.2, 3.5);
                    const skirt = new THREE.Mesh(skirtGeom, accentMaterial);
                    skirt.position.set(side * 1.05, 0.25, 0);
                    carGroup.add(skirt);
                });
                
                // Windshields - realistic glass with proper tint
                const glassMaterial = new THREE.MeshPhysicalMaterial({
                    color: 0x1a3a4a,
                    metalness: 0.0,
                    roughness: 0.05,
                    transmission: 0.9,
                    thickness: 0.2,
                    transparent: true,
                    opacity: 0.35
                });
                
                // Front windshield (angled)
                const frontGlassGeom = new THREE.PlaneGeometry(1.75, 1.0);
                const frontGlass = new THREE.Mesh(frontGlassGeom, glassMaterial);
                frontGlass.position.set(0, 1.2, 0.95);
                frontGlass.rotation.x = 0.45;
                carGroup.add(frontGlass);
                
                // Rear windshield
                const rearGlassGeom = new THREE.PlaneGeometry(1.6, 0.8);
                const rearGlass = new THREE.Mesh(rearGlassGeom, glassMaterial);
                rearGlass.position.set(0, 1.15, -1.45);
                rearGlass.rotation.x = -0.4;
                carGroup.add(rearGlass);
                
                // Side windows
                [-1, 1].forEach(side => {
                    const sideGlass = new THREE.Mesh(
                        new THREE.PlaneGeometry(2.0, 0.6),
                        glassMaterial
                    );
                    sideGlass.position.set(side * 0.95, 1.1, -0.3);
                    sideGlass.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
                    carGroup.add(sideGlass);
                });
                
                // Door handles
                const handleMaterial = new THREE.MeshStandardMaterial({
                    color: 0xC0C0C0,
                    metalness: 0.9,
                    roughness: 0.2
                });
                [-1, 1].forEach(side => {
                    const handleGeom = new THREE.BoxGeometry(0.02, 0.05, 0.2);
                    const handle = new THREE.Mesh(handleGeom, handleMaterial);
                    handle.position.set(side * 1.08, 0.85, 0.2);
                    carGroup.add(handle);
                });
                
                // Side mirrors
                [-1, 1].forEach(side => {
                    const mirrorGroup = new THREE.Group();
                    
                    const mirrorArm = new THREE.Mesh(
                        new THREE.BoxGeometry(0.25, 0.05, 0.05),
                        accentMaterial
                    );
                    mirrorArm.position.set(side * 0.12, 0, 0);
                    mirrorGroup.add(mirrorArm);
                    
                    const mirrorHead = new THREE.Mesh(
                        new THREE.BoxGeometry(0.08, 0.12, 0.18),
                        accentMaterial
                    );
                    mirrorHead.position.set(side * 0.28, 0, 0);
                    mirrorGroup.add(mirrorHead);
                    
                    // Mirror glass
                    const mirrorGlass = new THREE.Mesh(
                        new THREE.PlaneGeometry(0.06, 0.1),
                        new THREE.MeshStandardMaterial({
                            color: 0x6688aa,
                            metalness: 1.0,
                            roughness: 0.0
                        })
                    );
                    mirrorGlass.position.set(side * 0.32, 0, 0);
                    mirrorGlass.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
                    mirrorGroup.add(mirrorGlass);
                    
                    mirrorGroup.position.set(side * 0.85, 1.05, 0.8);
                    carGroup.add(mirrorGroup);
                });
                
                // Realistic wheels with proper tire sidewalls
                const wheelPositions = [
                    { x: -1.0, y: 0.38, z: 1.5 },  // Front left
                    { x: 1.0, y: 0.38, z: 1.5 },   // Front right
                    { x: -1.0, y: 0.38, z: -1.5 }, // Rear left
                    { x: 1.0, y: 0.38, z: -1.5 }   // Rear right
                ];
                
                const tireMaterial = new THREE.MeshStandardMaterial({
                    color: 0x1a1a1a,
                    roughness: 0.9,
                    metalness: 0.0
                });
                
                const rimMaterial = new THREE.MeshStandardMaterial({
                    color: 0x888888,
                    metalness: 0.95,
                    roughness: 0.15
                });
                
                this.wheels = [];
                wheelPositions.forEach((pos, index) => {
                    const wheelGroup = new THREE.Group();
                    
                    // Tire (outer rubber)
                    const tireGeom = new THREE.TorusGeometry(0.35, 0.12, 16, 32);
                    const tire = new THREE.Mesh(tireGeom, tireMaterial);
                    tire.rotation.y = Math.PI / 2;
                    wheelGroup.add(tire);
                    
                    // Rim
                    const rimGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.22, 24);
                    const rim = new THREE.Mesh(rimGeom, rimMaterial);
                    rim.rotation.z = Math.PI / 2;
                    wheelGroup.add(rim);
                    
                    // Rim spokes (5-spoke design)
                    for (let i = 0; i < 5; i++) {
                        const spokeAngle = (i / 5) * Math.PI * 2;
                        const spokeGeom = new THREE.BoxGeometry(0.04, 0.22, 0.15);
                        const spoke = new THREE.Mesh(spokeGeom, rimMaterial);
                        spoke.position.set(
                            Math.cos(spokeAngle) * 0.15,
                            0,
                            Math.sin(spokeAngle) * 0.15
                        );
                        spoke.rotation.y = spokeAngle;
                        wheelGroup.add(spoke);
                    }
                    
                    // Center cap with logo indent
                    const capGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.24, 16);
                    const cap = new THREE.Mesh(capGeom, rimMaterial);
                    cap.rotation.z = Math.PI / 2;
                    wheelGroup.add(cap);
                    
                    // Brake caliper (visible through spokes)
                    const caliperGeom = new THREE.BoxGeometry(0.12, 0.08, 0.15);
                    const caliperMat = new THREE.MeshStandardMaterial({
                        color: 0xCC0000,  // Red brake calipers
                        metalness: 0.7,
                        roughness: 0.3
                    });
                    const caliper = new THREE.Mesh(caliperGeom, caliperMat);
                    caliper.position.set(pos.x > 0 ? 0.05 : -0.05, -0.12, 0);
                    wheelGroup.add(caliper);
                    
                    wheelGroup.position.set(pos.x, pos.y, pos.z);
                    wheelGroup.userData.steering = index < 2;
                    wheelGroup.castShadow = true;
                    
                    this.wheels.push(wheelGroup);
                    carGroup.add(wheelGroup);
                });
                
                // LED Headlights
                const headlightMaterial = new THREE.MeshStandardMaterial({
                    color: 0xFFFFFF,
                    emissive: 0xFFFFFF,
                    emissiveIntensity: 2.0
                });
                
                [-0.6, 0.6].forEach(x => {
                    // Main headlight
                    const headlight = new THREE.Mesh(
                        new THREE.CircleGeometry(0.15, 24),
                        headlightMaterial
                    );
                    headlight.position.set(x, 0.55, 2.45);
                    carGroup.add(headlight);
                    
                    // DRL strip
                    const drlGeom = new THREE.BoxGeometry(0.3, 0.03, 0.02);
                    const drl = new THREE.Mesh(drlGeom, headlightMaterial);
                    drl.position.set(x, 0.7, 2.45);
                    carGroup.add(drl);
                });
                
                // LED Taillights
                const taillightMaterial = new THREE.MeshStandardMaterial({
                    color: 0xFF0000,
                    emissive: 0xFF0000,
                    emissiveIntensity: 1.0
                });
                
                [-0.6, 0.6].forEach(x => {
                    // Main taillight
                    const taillight = new THREE.Mesh(
                        new THREE.BoxGeometry(0.4, 0.12, 0.05),
                        taillightMaterial
                    );
                    taillight.position.set(x, 0.6, -2.45);
                    carGroup.add(taillight);
                });
                
                // Exhaust tips
                const exhaustMaterial = new THREE.MeshStandardMaterial({
                    color: 0x333333,
                    metalness: 0.9,
                    roughness: 0.3
                });
                [-0.4, 0.4].forEach(x => {
                    const exhaustGeom = new THREE.CylinderGeometry(0.06, 0.07, 0.15, 16);
                    const exhaust = new THREE.Mesh(exhaustGeom, exhaustMaterial);
                    exhaust.rotation.x = Math.PI / 2;
                    exhaust.position.set(x, 0.25, -2.5);
                    carGroup.add(exhaust);
                });
                
                // Rear spoiler
                const spoilerMat = new THREE.MeshStandardMaterial({
                    color: 0x1a1a1a,
                    metalness: 0.5,
                    roughness: 0.4
                });
                
                // Spoiler supports
                [-0.5, 0.5].forEach(x => {
                    const supportGeom = new THREE.BoxGeometry(0.08, 0.35, 0.08);
                    const support = new THREE.Mesh(supportGeom, spoilerMat);
                    support.position.set(x, 1.0, -2.1);
                    carGroup.add(support);
                });
                
                // Spoiler wing
                const spoilerWing = new THREE.Mesh(
                    new THREE.BoxGeometry(1.6, 0.08, 0.35),
                    spoilerMat
                );
                spoilerWing.position.set(0, 1.2, -2.15);
                spoilerWing.rotation.x = -0.15;
                carGroup.add(spoilerWing);
                
                // Exhaust pipes
                const exhaustMat = new THREE.MeshStandardMaterial({
                    color: 0x404040,
                    metalness: 0.9,
                    roughness: 0.3
                });
                
                [-0.4, 0.4].forEach(x => {
                    const exhaust = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16),
                        exhaustMat
                    );
                    exhaust.rotation.x = Math.PI / 2;
                    exhaust.position.set(x, 0.3, -2.4);
                    carGroup.add(exhaust);
                });
                
                // Mirrors
                const mirrorMat = new THREE.MeshStandardMaterial({
                    color: bodyColor,
                    metalness: 0.95,
                    roughness: 0.2
                });
                
                [-1.1, 1.1].forEach(x => {
                    const mirror = new THREE.Mesh(
                        new THREE.BoxGeometry(0.15, 0.15, 0.3),
                        mirrorMat
                    );
                    mirror.position.set(x, 1.0, 0.8);
                    carGroup.add(mirror);
                });
                
                carGroup.position.set(0, 0.6, 60);
                
                // Initialize engine sound
                this.initializeSound();
                
                this.car = carGroup;
                this.scene.add(this.car);
            }
            
            initializeSound() {
                // Create Audio Context (Web Audio API)
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
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
                this.engineMasterGain.connect(this.audioContext.destination);
                
                this.engineStarted = false;
                this.lastCollisionSound = 0;
            }
            
            playCollisionSound(intensity = 1) {
                if (!this.audioContext) return;
                
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
                impactGain.connect(this.audioContext.destination);
                
                source.start();
                source.stop(this.audioContext.currentTime + duration);
            }
            
            playLandingSound(intensity = 1) {
                if (!this.audioContext) return;
                
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
                gain.connect(this.audioContext.destination);
                
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
                if (this.audioContext.state === 'suspended' && throttle > 0) {
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
                const textureLoader = new THREE.TextureLoader();
                
                // Load high-quality building texture
                const buildingTexture = textureLoader.load('https://threejs.org/examples/textures/brick_diffuse.jpg');
                buildingTexture.wrapS = THREE.RepeatWrapping;
                buildingTexture.wrapT = THREE.RepeatWrapping;
                
                Object.entries(PORTFOLIO_DATA).forEach(([title, data]) => {
                    const sectionGroup = new THREE.Group();
                    
                    // Realistic modern office building - taller and more imposing
                    const buildingHeight = 35 + Math.random() * 15;
                    const buildingWidth = 18;
                    const buildingDepth = 20;
                    
                    // Main building tower
                    buildingTexture.repeat.set(3, Math.floor(buildingHeight / 5));
                    const buildingGeom = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
                    const buildingMaterial = new THREE.MeshStandardMaterial({
                        map: buildingTexture,
                        color: new THREE.Color(data.color).multiplyScalar(0.7),
                        metalness: 0.1,
                        roughness: 0.9
                    });
                    
                    const building = new THREE.Mesh(buildingGeom, buildingMaterial);
                    building.position.y = buildingHeight / 2;
                    building.castShadow = true;
                    building.receiveShadow = true;
                    sectionGroup.add(building);
                    
                    // Create realistic windows with frames, mullions, and interior glow
                    const floorsCount = Math.floor(buildingHeight / 3.5);
                    const windowsPerFloor = 4;
                    const windowWidth = 3.2;
                    const windowHeight = 2.6;
                    
                    for (let floor = 0; floor < floorsCount; floor++) {
                        const y = 2.5 + floor * 3.5;
                        
                        for (let side = 0; side < 4; side++) {
                            for (let i = 0; i < windowsPerFloor; i++) {
                                // Create window group
                                const windowGroup = new THREE.Group();
                                
                                // Randomize if this window has lights on (interior glow)
                                const hasLightsOn = Math.random() > 0.35;
                                const hasBlinds = Math.random() > 0.6;
                                const blindsPartial = hasBlinds && Math.random() > 0.5;
                                
                                // Interior backing (warm glow when lights on) - pushed back to prevent z-fighting
                                const interiorColor = hasLightsOn ? 
                                    (Math.random() > 0.5 ? 0xFFF4E0 : 0xFFE4B5) : // warm white or soft yellow
                                    0x1a1a2e; // dark interior
                                const interiorMat = new THREE.MeshBasicMaterial({
                                    color: interiorColor,
                                    side: THREE.FrontSide,
                                    depthWrite: true
                                });
                                const interiorGeom = new THREE.PlaneGeometry(windowWidth - 0.3, windowHeight - 0.3);
                                const interior = new THREE.Mesh(interiorGeom, interiorMat);
                                interior.position.z = -0.25; // Push further back
                                interior.renderOrder = 0;
                                windowGroup.add(interior);
                                
                                // Window frame (dark aluminum)
                                const frameMat = new THREE.MeshStandardMaterial({
                                    color: 0x2a2a2a,
                                    metalness: 0.8,
                                    roughness: 0.3
                                });
                                
                                // Outer frame
                                const frameThickness = 0.08;
                                const frameDepth = 0.12;
                                
                                // Top frame
                                const topFrame = new THREE.Mesh(
                                    new THREE.BoxGeometry(windowWidth, frameThickness, frameDepth),
                                    frameMat
                                );
                                topFrame.position.set(0, windowHeight / 2, 0);
                                windowGroup.add(topFrame);
                                
                                // Bottom frame
                                const bottomFrame = new THREE.Mesh(
                                    new THREE.BoxGeometry(windowWidth, frameThickness, frameDepth),
                                    frameMat
                                );
                                bottomFrame.position.set(0, -windowHeight / 2, 0);
                                windowGroup.add(bottomFrame);
                                
                                // Left frame
                                const leftFrame = new THREE.Mesh(
                                    new THREE.BoxGeometry(frameThickness, windowHeight, frameDepth),
                                    frameMat
                                );
                                leftFrame.position.set(-windowWidth / 2, 0, 0);
                                windowGroup.add(leftFrame);
                                
                                // Right frame
                                const rightFrame = new THREE.Mesh(
                                    new THREE.BoxGeometry(frameThickness, windowHeight, frameDepth),
                                    frameMat
                                );
                                rightFrame.position.set(windowWidth / 2, 0, 0);
                                windowGroup.add(rightFrame);
                                
                                // Center mullion (vertical divider)
                                const mullion = new THREE.Mesh(
                                    new THREE.BoxGeometry(frameThickness * 0.7, windowHeight - frameThickness * 2, frameDepth),
                                    frameMat
                                );
                                mullion.position.set(0, 0, 0);
                                windowGroup.add(mullion);
                                
                                // Horizontal mullion (creates 4-pane effect)
                                const hMullion = new THREE.Mesh(
                                    new THREE.BoxGeometry(windowWidth - frameThickness * 2, frameThickness * 0.7, frameDepth),
                                    frameMat
                                );
                                hMullion.position.set(0, windowHeight * 0.15, 0);
                                windowGroup.add(hMullion);
                                
                                // Glass panes with realistic reflection
                                const glassMat = new THREE.MeshPhysicalMaterial({
                                    color: hasLightsOn ? 0x6699aa : 0x88aabb,
                                    metalness: 0.0,
                                    roughness: 0.05,
                                    transmission: hasLightsOn ? 0.3 : 0.6,
                                    thickness: 0.05,
                                    transparent: true,
                                    opacity: hasLightsOn ? 0.6 : 0.85,
                                    envMapIntensity: 1.2,
                                    clearcoat: 0.8,
                                    clearcoatRoughness: 0.15,
                                    depthWrite: false
                                });
                                
                                const glassGeom = new THREE.PlaneGeometry(windowWidth - 0.15, windowHeight - 0.15);
                                const glass = new THREE.Mesh(glassGeom, glassMat);
                                glass.position.z = 0.06; // Further forward to prevent z-fighting
                                glass.renderOrder = 1;
                                windowGroup.add(glass);
                                
                                // Optional blinds/curtains
                                if (hasBlinds) {
                                    const blindsHeight = blindsPartial ? windowHeight * 0.4 : windowHeight - 0.3;
                                    const blindsY = blindsPartial ? windowHeight / 2 - blindsHeight / 2 - 0.1 : 0;
                                    const blindsColor = Math.random() > 0.5 ? 0xF5F5DC : 0xE8E8E8;
                                    
                                    const blindsMat = new THREE.MeshStandardMaterial({
                                        color: blindsColor,
                                        roughness: 0.9,
                                        metalness: 0.0,
                                        side: THREE.DoubleSide
                                    });
                                    
                                    const blindsGeom = new THREE.PlaneGeometry(windowWidth - 0.3, blindsHeight);
                                    const blinds = new THREE.Mesh(blindsGeom, blindsMat);
                                    blinds.position.set(0, blindsY, -0.05);
                                    windowGroup.add(blinds);
                                }
                                
                                // Window sill
                                const sillMat = new THREE.MeshStandardMaterial({
                                    color: 0x808080,
                                    metalness: 0.3,
                                    roughness: 0.6
                                });
                                const sill = new THREE.Mesh(
                                    new THREE.BoxGeometry(windowWidth + 0.2, 0.06, 0.25),
                                    sillMat
                                );
                                sill.position.set(0, -windowHeight / 2 - 0.03, 0.1);
                                windowGroup.add(sill);
                                
                                // Position window on building
                                const offset = (side === 0 || side === 1) ? buildingDepth / 2 + 0.05 : buildingWidth / 2 + 0.05;
                                const xPos = (i - windowsPerFloor / 2 + 0.5) * 4;
                                
                                switch(side) {
                                    case 0:
                                        windowGroup.position.set(xPos, y, offset);
                                        break;
                                    case 1:
                                        windowGroup.position.set(-xPos, y, -offset);
                                        windowGroup.rotation.y = Math.PI;
                                        break;
                                    case 2:
                                        windowGroup.position.set(-offset, y, xPos);
                                        windowGroup.rotation.y = Math.PI / 2;
                                        break;
                                    case 3:
                                        windowGroup.position.set(offset, y, -xPos);
                                        windowGroup.rotation.y = -Math.PI / 2;
                                        break;
                                }
                                
                                sectionGroup.add(windowGroup);
                            }
                        }
                    }
                    
                    // Ground floor entrance area - recessed
                    const entranceWidth = 12;
                    const entranceHeight = 5;
                    const entranceDepth = 2;
                    
                    // Entrance recess (darker)
                    const entranceGeom = new THREE.BoxGeometry(entranceWidth, entranceHeight, entranceDepth);
                    const entranceMat = new THREE.MeshStandardMaterial({
                        color: new THREE.Color(data.color).multiplyScalar(0.3),
                        roughness: 0.7,
                        metalness: 0.2
                    });
                    const entrance = new THREE.Mesh(entranceGeom, entranceMat);
                    entrance.position.set(0, entranceHeight / 2, buildingDepth / 2 - entranceDepth / 2);
                    sectionGroup.add(entrance);
                    
                    // Modern glass entrance doors (double doors)
                    const doorWidth = 2.5;
                    const doorHeight = 4;
                    const doorMaterial = new THREE.MeshPhysicalMaterial({
                        color: 0x1a1a1a,
                        metalness: 0.9,
                        roughness: 0.1,
                        transmission: 0.7,
                        thickness: 0.1
                    });
                    
                    // Left door
                    const leftDoorGeom = new THREE.BoxGeometry(doorWidth, doorHeight, 0.1);
                    const leftDoor = new THREE.Mesh(leftDoorGeom, doorMaterial);
                    leftDoor.position.set(-doorWidth / 2 - 0.1, doorHeight / 2 + 0.2, buildingDepth / 2 + 0.1);
                    sectionGroup.add(leftDoor);
                    
                    // Right door
                    const rightDoor = new THREE.Mesh(leftDoorGeom, doorMaterial);
                    rightDoor.position.set(doorWidth / 2 + 0.1, doorHeight / 2 + 0.2, buildingDepth / 2 + 0.1);
                    sectionGroup.add(rightDoor);
                    
                    // Door frames (stainless steel)
                    const frameMat = new THREE.MeshStandardMaterial({
                        color: 0xC0C0C0,
                        metalness: 0.95,
                        roughness: 0.1
                    });
                    
                    // Vertical frames
                    [-doorWidth - 0.2, 0, doorWidth + 0.2].forEach(x => {
                        const frameGeom = new THREE.BoxGeometry(0.15, doorHeight + 0.5, 0.15);
                        const frame = new THREE.Mesh(frameGeom, frameMat);
                        frame.position.set(x, doorHeight / 2 + 0.2, buildingDepth / 2 + 0.15);
                        sectionGroup.add(frame);
                    });
                    
                    // Top frame (horizontal)
                    const topFrameGeom = new THREE.BoxGeometry(doorWidth * 2 + 0.6, 0.15, 0.15);
                    const topFrame = new THREE.Mesh(topFrameGeom, frameMat);
                    topFrame.position.set(0, doorHeight + 0.5, buildingDepth / 2 + 0.15);
                    sectionGroup.add(topFrame);
                    
                    // Entrance canopy (modern overhang)
                    const canopyGeom = new THREE.BoxGeometry(entranceWidth + 2, 0.3, 5);
                    const canopyMat = new THREE.MeshStandardMaterial({
                        color: data.color,
                        metalness: 0.6,
                        roughness: 0.3
                    });
                    const canopy = new THREE.Mesh(canopyGeom, canopyMat);
                    canopy.position.set(0, entranceHeight + 1, buildingDepth / 2 + 1);
                    canopy.castShadow = true;
                    sectionGroup.add(canopy);
                    
                    // Canopy supports (pillars)
                    [-5, 5].forEach(x => {
                        const pillarGeom = new THREE.CylinderGeometry(0.2, 0.2, entranceHeight + 1, 16);
                        const pillar = new THREE.Mesh(pillarGeom, frameMat);
                        pillar.position.set(x, (entranceHeight + 1) / 2, buildingDepth / 2 + 3);
                        pillar.castShadow = true;
                        sectionGroup.add(pillar);
                    });
                    
                    // Building name sign above entrance
                    const signWidth = 10;
                    const signHeight = 1.5;
                    const signGeom = new THREE.BoxGeometry(signWidth, signHeight, 0.3);
                    const signMat = new THREE.MeshStandardMaterial({
                        color: 0xFFFFFF,
                        emissive: 0xFFFFFF,
                        emissiveIntensity: 0.3,
                        metalness: 0.1,
                        roughness: 0.8
                    });
                    const sign = new THREE.Mesh(signGeom, signMat);
                    sign.position.set(0, entranceHeight + 2.5, buildingDepth / 2 + 0.2);
                    sectionGroup.add(sign);
                    
                    // Sign text
                    const signCanvas = document.createElement('canvas');
                    signCanvas.width = 512;
                    signCanvas.height = 80;
                    const ctx = signCanvas.getContext('2d');
                    
                    // Background
                    ctx.fillStyle = '#' + new THREE.Color(data.color).getHexString();
                    ctx.fillRect(0, 0, 512, 80);
                    
                    // Text
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 48px Arial, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${data.icon} ${title.toUpperCase()}`, 256, 40);
                    
                    const signTexture = new THREE.CanvasTexture(signCanvas);
                    const signTextMat = new THREE.MeshBasicMaterial({ map: signTexture });
                    const signTextGeom = new THREE.PlaneGeometry(signWidth - 0.2, signHeight - 0.2);
                    const signText = new THREE.Mesh(signTextGeom, signTextMat);
                    signText.position.set(0, entranceHeight + 2.5, buildingDepth / 2 + 0.36);
                    sectionGroup.add(signText);
                    
                    // Rooftop with mechanical units
                    const roofWidth = buildingWidth + 2;
                    const roofDepth = buildingDepth + 2;
                    const roofGeom = new THREE.BoxGeometry(roofWidth, 1, roofDepth);
                    const roofMat = new THREE.MeshStandardMaterial({
                        color: 0x2a2a2a,
                        metalness: 0.5,
                        roughness: 0.6
                    });
                    const roof = new THREE.Mesh(roofGeom, roofMat);
                    roof.position.y = buildingHeight + 0.5;
                    roof.castShadow = true;
                    sectionGroup.add(roof);
                    
                    // HVAC units on roof
                    for (let i = 0; i < 4; i++) {
                        const hvacGeom = new THREE.BoxGeometry(2.5, 1.8, 2);
                        const hvacMat = new THREE.MeshStandardMaterial({
                            color: 0x555555,
                            metalness: 0.7,
                            roughness: 0.4
                        });
                        const hvac = new THREE.Mesh(hvacGeom, hvacMat);
                        hvac.position.set((i - 1.5) * 5, buildingHeight + 1.9, -5);
                        hvac.castShadow = true;
                        sectionGroup.add(hvac);
                    }
                    
                    // Position the section
                    sectionGroup.position.set(data.position.x, 0, data.position.z);
                    sectionGroup.userData = { 
                        title, 
                        content: data.content, 
                        color: data.color, 
                        icon: data.icon,
                        buildingHeight: buildingHeight
                    };
                    
                    // Register building with collision system
                    this.collisionSystem.addBuilding(data.position, 16, 16);
                    
                    this.sections.push(sectionGroup);
                    this.buildings.push(sectionGroup);
                    this.scene.add(sectionGroup);
                });
            }
            
            loadEnvironmentDetails() {
                // Trees
                this.createTrees(this.state.quality === 'ultra' ? 50 : this.state.quality === 'high' ? 30 : 15);
                
                // Decorative elements
                this.createDecorations();
                
                // Interactive objects (cones, barrels)
                this.createInteractiveObjects();
                
                // Particles (only on high/ultra)
                if (this.state.quality === 'ultra' || this.state.quality === 'high') {
                    this.createParticles();
                }
            }
            
            createTrees(count) {
                // Load tree bark texture
                const textureLoader = new THREE.TextureLoader();
                const barkTexture = textureLoader.load('https://threejs.org/examples/textures/brick_diffuse.jpg');
                barkTexture.wrapS = THREE.RepeatWrapping;
                barkTexture.wrapT = THREE.RepeatWrapping;
                barkTexture.repeat.set(1, 2);
                
                const trunkMaterial = new THREE.MeshStandardMaterial({
                    map: barkTexture,
                    color: 0x3D2817,
                    roughness: 0.95,
                    metalness: 0.0
                });
                
                const leafMaterial = new THREE.MeshStandardMaterial({
                    color: 0x1A4D2E,
                    roughness: 0.9,
                    metalness: 0.0
                });
                
                for (let i = 0; i < count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 50 + Math.random() * 200;
                    
                    const x = Math.sin(angle) * radius;
                    const z = Math.cos(angle) * radius;
                    
                    let tooClose = false;
                    for (const section of this.sections) {
                        const dx = x - section.position.x;
                        const dz = z - section.position.z;
                        if (Math.sqrt(dx*dx + dz*dz) < 30) {
                            tooClose = true;
                            break;
                        }
                    }
                    if (tooClose) continue;
                    
                    const treeGroup = new THREE.Group();
                    const scale = 0.9 + Math.random() * 0.8;
                    
                    // Realistic trunk with taper
                    const trunkGeom = new THREE.CylinderGeometry(
                        0.25 * scale,  // top radius
                        0.45 * scale,  // bottom radius (tapered)
                        5 * scale,     // height
                        12,            // segments
                        3              // height segments for better shape
                    );
                    const trunk = new THREE.Mesh(trunkGeom, trunkMaterial);
                    trunk.position.y = 2.5 * scale;
                    trunk.castShadow = true;
                    treeGroup.add(trunk);
                    
                    // Detailed crown with multiple layers
                    const crownLayers = [
                        { y: 5.5, r: 2.8, segments: 12 },
                        { y: 6.5, r: 2.5, segments: 10 },
                        { y: 7.3, r: 2.0, segments: 10 },
                        { y: 8.0, r: 1.5, segments: 8 }
                    ];
                    
                    crownLayers.forEach(layer => {
                        const foliageGeom = new THREE.SphereGeometry(
                            layer.r * scale,
                            layer.segments,
                            layer.segments / 2
                        );
                        const foliage = new THREE.Mesh(foliageGeom, leafMaterial);
                        foliage.position.y = layer.y * scale;
                        foliage.castShadow = true;
                        foliage.receiveShadow = true;
                        treeGroup.add(foliage);
                    });
                    
                    // Add some random foliage clusters for natural look
                    for (let j = 0; j < 3; j++) {
                        const clusterGeom = new THREE.SphereGeometry(1.2 * scale, 8, 6);
                        const cluster = new THREE.Mesh(clusterGeom, leafMaterial);
                        const angleOffset = (j / 3) * Math.PI * 2;
                        cluster.position.set(
                            Math.cos(angleOffset) * 1.5 * scale,
                            5.5 * scale,
                            Math.sin(angleOffset) * 1.5 * scale
                        );
                        cluster.castShadow = true;
                        treeGroup.add(cluster);
                    }
                    
                    treeGroup.position.set(x, 0, z);
                    treeGroup.rotation.y = Math.random() * Math.PI * 2;
                    
                    this.collisionSystem.addTree({ x, z });
                    this.treePositions.push({ x, z });
                    
                    this.scene.add(treeGroup);
                    this.decorations.push(treeGroup);
                }
            }
            
            createDecorations() {
                // Street lamps along roads
                const lampMaterial = new THREE.MeshStandardMaterial({
                    color: 0x333333,
                    metalness: 0.8,
                    roughness: 0.3
                });
                
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
                        
                        // Offset to side of road
                        const perpX = -dz / length * 8;
                        const perpZ = dx / length * 8;
                        
                        [-1, 1].forEach(side => {
                            const lampGroup = new THREE.Group();
                            
                            // Pole
                            const poleGeom = new THREE.CylinderGeometry(0.15, 0.2, 8, 8);
                            const pole = new THREE.Mesh(poleGeom, lampMaterial);
                            pole.position.y = 4;
                            pole.castShadow = this.state.quality !== 'low';
                            lampGroup.add(pole);
                            
                            // Arm
                            const armGeom = new THREE.BoxGeometry(2, 0.1, 0.1);
                            const arm = new THREE.Mesh(armGeom, lampMaterial);
                            arm.position.set(1, 8, 0);
                            lampGroup.add(arm);
                            
                            // Light fixture
                            const lightFixtureGeom = new THREE.SphereGeometry(0.4, 12, 8);
                            const lightFixtureMat = new THREE.MeshStandardMaterial({
                                color: 0xFFFFAA,
                                emissive: 0xFFFFAA,
                                emissiveIntensity: 0.5
                            });
                            const lightFixture = new THREE.Mesh(lightFixtureGeom, lightFixtureMat);
                            lightFixture.position.set(2, 7.8, 0);
                            lampGroup.add(lightFixture);
                            
                            lampGroup.position.set(x + perpX * side, 0, z + perpZ * side);
                            lampGroup.lookAt(x, 0, z);
                            
                            this.scene.add(lampGroup);
                        });
                    }
                });
            }
            
            createParticles() {
                // Floating particles (dust/pollen)
                const count = 500;
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
                // Traffic cones
                const coneMaterial = new THREE.MeshStandardMaterial({
                    color: 0xFF6B35,
                    roughness: 0.7
                });
                const coneStripeMaterial = new THREE.MeshStandardMaterial({
                    color: 0xFFFFFF,
                    roughness: 0.7
                });
                
                this.interactiveObjects = [];
                
                // Place cones around the map
                const conePositions = [
                    { x: 10, z: 55 }, { x: -10, z: 55 },
                    { x: 15, z: 50 }, { x: -15, z: 50 },
                    { x: 50, z: 0 }, { x: -50, z: 0 },
                    { x: 0, z: -30 }, { x: 5, z: -30 }, { x: -5, z: -30 },
                ];
                
                conePositions.forEach(pos => {
                    const coneGroup = new THREE.Group();
                    
                    // Cone body
                    const coneGeom = new THREE.ConeGeometry(0.4, 1.2, 8);
                    const cone = new THREE.Mesh(coneGeom, coneMaterial);
                    cone.position.y = 0.6;
                    coneGroup.add(cone);
                    
                    // White stripes
                    const stripe1 = new THREE.Mesh(
                        new THREE.TorusGeometry(0.28, 0.06, 8, 16),
                        coneStripeMaterial
                    );
                    stripe1.rotation.x = Math.PI / 2;
                    stripe1.position.y = 0.4;
                    coneGroup.add(stripe1);
                    
                    const stripe2 = new THREE.Mesh(
                        new THREE.TorusGeometry(0.18, 0.05, 8, 16),
                        coneStripeMaterial
                    );
                    stripe2.rotation.x = Math.PI / 2;
                    stripe2.position.y = 0.8;
                    coneGroup.add(stripe2);
                    
                    // Base
                    const base = new THREE.Mesh(
                        new THREE.BoxGeometry(0.8, 0.1, 0.8),
                        coneMaterial
                    );
                    base.position.y = 0.05;
                    coneGroup.add(base);
                    
                    coneGroup.position.set(pos.x, 0, pos.z);
                    coneGroup.userData = {
                        type: 'cone',
                        velocityX: 0,
                        velocityZ: 0,
                        velocityY: 0,
                        angularVel: 0,
                        grounded: true
                    };
                    
                    this.scene.add(coneGroup);
                    this.interactiveObjects.push(coneGroup);
                });
                
                // Barrels
                const barrelMaterial = new THREE.MeshStandardMaterial({
                    color: 0x2D3436,
                    roughness: 0.8,
                    metalness: 0.3
                });
                const barrelRingMaterial = new THREE.MeshStandardMaterial({
                    color: 0xFDCB6E,
                    roughness: 0.6,
                    metalness: 0.4
                });
                
                const barrelPositions = [
                    { x: 25, z: 40 }, { x: 27, z: 40 },
                    { x: -25, z: 40 }, { x: -27, z: 40 },
                    { x: 40, z: -20 }, { x: -40, z: -20 },
                ];
                
                barrelPositions.forEach(pos => {
                    const barrelGroup = new THREE.Group();
                    
                    // Main barrel
                    const barrelGeom = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 16);
                    const barrel = new THREE.Mesh(barrelGeom, barrelMaterial);
                    barrel.position.y = 0.75;
                    barrelGroup.add(barrel);
                    
                    // Yellow warning rings
                    const ring1 = new THREE.Mesh(
                        new THREE.TorusGeometry(0.62, 0.08, 8, 16),
                        barrelRingMaterial
                    );
                    ring1.rotation.x = Math.PI / 2;
                    ring1.position.y = 0.3;
                    barrelGroup.add(ring1);
                    
                    const ring2 = new THREE.Mesh(
                        new THREE.TorusGeometry(0.62, 0.08, 8, 16),
                        barrelRingMaterial
                    );
                    ring2.rotation.x = Math.PI / 2;
                    ring2.position.y = 1.2;
                    barrelGroup.add(ring2);
                    
                    barrelGroup.position.set(pos.x, 0, pos.z);
                    barrelGroup.userData = {
                        type: 'barrel',
                        velocityX: 0,
                        velocityZ: 0,
                        velocityY: 0,
                        angularVel: 0,
                        grounded: true,
                        mass: 2 // Heavier than cones
                    };
                    
                    this.scene.add(barrelGroup);
                    this.interactiveObjects.push(barrelGroup);
                });
            }
            
            updateInteractiveObjects(delta, carX, carZ, carSpeed, carRotation) {
                if (!this.interactiveObjects) return;
                
                const carRadius = CONFIG.CAR_COLLISION_RADIUS;
                
                this.interactiveObjects.forEach(obj => {
                    const data = obj.userData;
                    
                    // Check collision with car
                    const dx = obj.position.x - carX;
                    const dz = obj.position.z - carZ;
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    const objRadius = data.type === 'barrel' ? 0.8 : 0.5;
                    
                    if (dist < carRadius + objRadius && Math.abs(carSpeed) > 1) {
                        // Hit! Apply force
                        const force = Math.abs(carSpeed) * (data.mass || 1) * 0.5;
                        const nx = dx / dist;
                        const nz = dz / dist;
                        
                        data.velocityX = nx * force + Math.sin(carRotation) * carSpeed * 0.3;
                        data.velocityZ = nz * force + Math.cos(carRotation) * carSpeed * 0.3;
                        data.velocityY = Math.random() * 3 + 1;
                        data.angularVel = (Math.random() - 0.5) * 10;
                        data.grounded = false;
                        
                        // Spawn dust
                        this.spawnDustBurst(obj.position.x, 0.2, obj.position.z, 0.5);
                    }
                    
                    // Physics update
                    if (!data.grounded || Math.abs(data.velocityX) > 0.1 || Math.abs(data.velocityZ) > 0.1) {
                        // Apply velocity
                        obj.position.x += data.velocityX * delta;
                        obj.position.z += data.velocityZ * delta;
                        obj.position.y += data.velocityY * delta;
                        
                        // Gravity
                        data.velocityY -= 15 * delta;
                        
                        // Ground collision
                        if (obj.position.y <= 0) {
                            obj.position.y = 0;
                            data.velocityY = -data.velocityY * 0.3;
                            if (Math.abs(data.velocityY) < 0.5) {
                                data.velocityY = 0;
                                data.grounded = true;
                            }
                        }
                        
                        // Friction
                        data.velocityX *= 0.98;
                        data.velocityZ *= 0.98;
                        
                        // Rotation
                        obj.rotation.x += data.angularVel * delta;
                        obj.rotation.z += data.angularVel * delta * 0.5;
                        data.angularVel *= 0.98;
                    }
                });
            }
            
            setupEventListeners() {
                window.addEventListener('keydown', this.onKeyDown);
                window.addEventListener('keyup', this.onKeyUp);
                window.addEventListener('resize', this.onResize);
                
                window.addEventListener('wheel', (e) => {
                    this.state.cameraDistance += e.deltaY * 0.02;
                    this.state.cameraDistance = Math.max(8, Math.min(40, this.state.cameraDistance));
                }, { passive: true });
                
                // UI Controls
                document.getElementById('controlsToggle').addEventListener('click', () => {
                    document.getElementById('controlsPanel').classList.toggle('collapsed');
                });
                
                document.getElementById('settingsBtn').addEventListener('click', () => {
                    document.getElementById('settingsPanel').classList.toggle('active');
                });
                
                document.getElementById('qualitySelect').addEventListener('change', (e) => {
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
            
            setupMobileControls() {
                const joystick = document.getElementById('joystick');
                const joystickInner = document.getElementById('joystickInner');
                const boostBtn = document.getElementById('mobileBoost');
                const jumpBtn = document.getElementById('mobileJump');
                const actionBtn = document.getElementById('mobileAction');
                
                if (!joystick) return;
                
                let joystickActive = false;
                
                const handleJoystickMove = (clientX, clientY) => {
                    if (!joystickActive) return;
                    
                    const rect = joystick.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    
                    let dx = clientX - centerX;
                    let dy = clientY - centerY;
                    
                    const maxDist = rect.width / 2 - 30;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > maxDist) {
                        dx = (dx / dist) * maxDist;
                        dy = (dy / dist) * maxDist;
                    }
                    
                    joystickInner.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
                    
                    // Map to analog-style controls
                    const normalizedX = dx / maxDist;
                    const normalizedY = -dy / maxDist;
                    
                    // Throttle/brake based on Y axis
                    this.state.input.throttle = Math.max(0, normalizedY);
                    this.state.input.brake = Math.max(0, -normalizedY);
                    
                    // Steering based on X axis
                    this.state.input.steer = normalizedX;
                    
                    // Also set key states for compatibility
                    this.state.keys['KeyW'] = normalizedY > 0.2;
                    this.state.keys['KeyS'] = normalizedY < -0.2;
                    this.state.keys['KeyA'] = normalizedX < -0.2;
                    this.state.keys['KeyD'] = normalizedX > 0.2;
                };
                
                joystick.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    joystickActive = true;
                    handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
                }, { passive: false });
                
                joystick.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                    handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
                }, { passive: false });
                
                joystick.addEventListener('touchend', () => {
                    joystickActive = false;
                    joystickInner.style.transform = 'translate(-50%, -50%)';
                    this.state.input.throttle = 0;
                    this.state.input.brake = 0;
                    this.state.input.steer = 0;
                    this.state.keys['KeyW'] = false;
                    this.state.keys['KeyS'] = false;
                    this.state.keys['KeyA'] = false;
                    this.state.keys['KeyD'] = false;
                });
                
                // Boost button
                if (boostBtn) {
                    boostBtn.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        this.state.keys['ShiftLeft'] = true;
                        this.state.input.boost = true;
                    }, { passive: false });
                    boostBtn.addEventListener('touchend', () => {
                        this.state.keys['ShiftLeft'] = false;
                        this.state.input.boost = false;
                    });
                }
                
                // Jump button
                if (jumpBtn) {
                    jumpBtn.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        this.state.keys['KeyJ'] = true;
                        // Trigger jump
                        if (this.vehiclePhysics && this.vehiclePhysics.isGrounded) {
                            this.vehiclePhysics.velocityY = CONFIG.JUMP_FORCE;
                            this.vehiclePhysics.isGrounded = false;
                        }
                    }, { passive: false });
                    jumpBtn.addEventListener('touchend', () => {
                        this.state.keys['KeyJ'] = false;
                    });
                }
                
                // Action button (enter building)
                if (actionBtn) {
                    actionBtn.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        this.state.keys['Space'] = true;
                        if (this.state.currentSection) {
                            this.openModal(this.state.currentSection.userData);
                        }
                    }, { passive: false });
                    actionBtn.addEventListener('touchend', () => {
                        this.state.keys['Space'] = false;
                    });
                }
            }
            
            // 🖱️ MOUSE CAMERA CONTROL
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
                this.state.keys[e.code] = true;
                
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
                        gain.connect(this.audioContext.destination);
                        osc.start(now + i * 0.1);
                        osc.stop(now + i * 0.1 + 0.2);
                    });
                }
            }
            
            // 🌅 DYNAMIC TIME OF DAY
            cycleTimeOfDay() {
                const times = ['dawn', 'day', 'sunset', 'night'];
                if (!this.currentTimeIndex) this.currentTimeIndex = 1; // Start at day
                this.currentTimeIndex = (this.currentTimeIndex + 1) % times.length;
                this.setTimeOfDay(times[this.currentTimeIndex]);
            }
            
            toggleNightMode() {
                const isNight = this.currentTimeIndex === 3;
                this.setTimeOfDay(isNight ? 'day' : 'night');
                this.currentTimeIndex = isNight ? 1 : 3;
            }
            
            setTimeOfDay(time) {
                const settings = {
                    dawn: {
                        skyTop: 0xFF9966, skyBottom: 0x3D5C8A,
                        sunColor: 0xFFAA77, sunIntensity: 1.5,
                        ambientIntensity: 0.3, fogColor: 0xFFCCB3
                    },
                    day: {
                        skyTop: 0x87CEEB, skyBottom: 0xE8F4F8,
                        sunColor: 0xFFFFF0, sunIntensity: 2.0,
                        ambientIntensity: 0.4, fogColor: 0xC8E0F0
                    },
                    sunset: {
                        skyTop: 0xFF6B35, skyBottom: 0x4A1942,
                        sunColor: 0xFF8844, sunIntensity: 1.2,
                        ambientIntensity: 0.25, fogColor: 0xFF9966
                    },
                    night: {
                        skyTop: 0x0A0A20, skyBottom: 0x1A1A3A,
                        sunColor: 0x8888FF, sunIntensity: 0.3,
                        ambientIntensity: 0.15, fogColor: 0x151530
                    }
                };
                
                const s = settings[time];
                if (!s) return;
                
                // Animate sky colors
                if (this.skyMaterial) {
                    this.skyMaterial.uniforms.topColor.value.setHex(s.skyTop);
                    this.skyMaterial.uniforms.bottomColor.value.setHex(s.skyBottom);
                }
                
                // Update lights
                if (this.sunLight) {
                    this.sunLight.color.setHex(s.sunColor);
                    this.sunLight.intensity = s.sunIntensity;
                }
                if (this.ambientLight) {
                    this.ambientLight.intensity = s.ambientIntensity;
                }
                
                // Update fog
                if (this.scene.fog) {
                    this.scene.fog.color.setHex(s.fogColor);
                }
                
                const timeNames = { dawn: '🌅 Dawn', day: '☀️ Day', sunset: '🌆 Sunset', night: '🌙 Night' };
                this.showToast('🕐', timeNames[time], 'Press T to cycle time');
            }
            
            honk() {
                // Play realistic car horn sound using dual-tone synthesis
                if (this.audioContext) {
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
                        gain.connect(this.audioContext.destination);
                        
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
                    subGain.connect(this.audioContext.destination);
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
                const { title, content, color, icon } = data;
                
                // Track visited section
                if (!this.state.sectionsVisited.has(title)) {
                    this.state.sectionsVisited.add(title);
                    
                    // Check if this was the first section
                    if (this.state.sectionsVisited.size === 1 && 
                        !localStorage.getItem('achievement_firstExplore')) {
                        localStorage.setItem('achievement_firstExplore', 'true');
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
                document.getElementById('modalOverlay').classList.add('active');
                
                // Subtle feedback on modal open
                this.triggerScreenShake(0.1);
            }
            
            closeModal() {
                document.getElementById('modalOverlay').classList.remove('active');
            }
            
            applyQuality(quality) {
                this.state.quality = quality;
                
                this.renderer.shadowMap.enabled = quality !== 'low';
                this.camera.far = quality === 'ultra' ? 1500 : quality === 'high' ? 1000 : 500;
                this.camera.updateProjectionMatrix();
                
                // Update shadow quality
                if (this.sunLight && this.sunLight.shadow) {
                    this.sunLight.shadow.mapSize.width = quality === 'ultra' ? 4096 : 2048;
                    this.sunLight.shadow.mapSize.height = quality === 'ultra' ? 4096 : 2048;
                }
            }
            
            applyEffects(level) {
                if (!this.bloomPass) return;
                
                const settings = {
                    minimal: { strength: 0.1, radius: 0.3, threshold: 0.95 },
                    balanced: { strength: 0.2, radius: 0.4, threshold: 0.85 },
                    ultra: { strength: 0.35, radius: 0.5, threshold: 0.75 }
                };
                
                const s = settings[level];
                this.bloomPass.strength = s.strength;
                this.bloomPass.radius = s.radius;
                this.bloomPass.threshold = s.threshold;
            }
            
            animate() {
                requestAnimationFrame(this.animate);
                
                const delta = this.clock.getDelta();
                this.state.time += delta;
                
                this.updateMovement(delta);
                this.updateCamera();
                this.updateWheels();
                this.checkSectionProximity();
                this.updateAnimations();
                
                // Update dust particles
                this.updateDustParticles(delta);
                
                // ⚡ GAME FEEL: Update landing impact particles
                this.updateParticles(delta);
                
                // 🚗 DRIFT: Check for drifting and update smoke
                this.checkDrift();
                this.updateDriftSmoke(delta);
                
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
                
                if (this.frameCount % 5 === 0) {
                    this.updateMinimap();
                }
                
                if (this.frameCount % 30 === 0) {
                    this.updateFPS();
                }
                
                this.frameCount++;
                this.composer.render();
            }
            
            updateMovement(delta) {
                this.updateCar(delta);
            }
            
            updateCar(delta) {
                const keys = this.state.keys;
                
                // Build input state
                this.state.input.throttle = (keys['KeyW'] || keys['ArrowUp']) ? 1 : 0;
                this.state.input.brake = (keys['KeyS'] || keys['ArrowDown']) ? 1 : 0;
                this.state.input.boost = keys['ShiftLeft'] || keys['ShiftRight'];
                
                // Update engine sound
                this.updateEngineSound();
                
                // Jump! (J key)
                if (keys['KeyJ'] && this.state.playerMode === 'driving') {
                    const jumped = this.vehiclePhysics.jump();
                    if (jumped) {
                        // No screen shake on jump - only on landing
                        this.showToast('🦘', 'Jump!', '');
                    }
                }
                
                // Steering (-1 to 1)
                let steer = 0;
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
                const speedKmh = Math.round(physicsState.speedKmh);
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
                
                // Collision feedback - only on significant collisions
                if (physicsState.isColliding && Math.abs(physicsState.speed) > 10) {
                    this.triggerScreenShake(0.2);
                    this.spawnDustBurst(this.car.position.x, 0.2, this.car.position.z, 0.3);
                    // Play collision sound based on speed
                    const collisionIntensity = Math.min(Math.abs(physicsState.speed) / 20, 1);
                    this.playCollisionSound(collisionIntensity);
                }
                
                // Landing impact with dust burst - only on hard landings
                if (this.state.wasAirborne && physicsState.isGrounded && physicsState.landingImpact > 3) {
                    const intensity = Math.min(physicsState.landingImpact / 8, 1);
                    this.triggerScreenShake(0.15 * intensity);
                    this.spawnDustBurst(this.car.position.x, 0.1, this.car.position.z, intensity);
                    // Play landing thud
                    this.playLandingSound(intensity);
                }
                this.state.wasAirborne = physicsState.isAirborne;
                
                // Spawn dust when drifting/skidding on grass - less frequent
                if (physicsState.isGrounded && !physicsState.isOnRoad && Math.abs(physicsState.speed) > 10) {
                    if (Math.random() < 0.1) {
                        this.spawnDustBurst(
                            this.car.position.x - Math.sin(this.car.rotation.y) * 2,
                            0.1,
                            this.car.position.z - Math.cos(this.car.rotation.y) * 2,
                            0.3
                        );
                    }
                }
            }
            
            updateWheels() {
                if (!this.wheels || !this.car) return;
                
                // Calculate wheel rotation based on speed (distance traveled per frame)
                const wheelRadius = 0.4;
                const speed = this.vehiclePhysics.speed;
                const rotationAmount = (speed * 0.016) / wheelRadius; // Assuming ~60fps
                
                // Get steering angle from physics
                const steeringAngle = this.vehiclePhysics.steerAngle;
                
                this.wheels.forEach((wheel, index) => {
                    // Apply steering to front wheels (rotate the entire group around Y)
                    if (wheel.userData.steering) {
                        wheel.rotation.y = steeringAngle;
                    }
                    
                    // Rolling rotation: cylinders are rotated 90° on Z to point along X axis
                    // So they roll around the X axis as the car moves forward/backward
                    wheel.children.forEach(mesh => {
                        if (mesh.geometry) {
                            mesh.rotation.x += rotationAmount;
                        }
                    });
                });
            }
            
            updateCamera() {
                const target = this.car;
                if (!target) return;
                
                let targetPos = new THREE.Vector3();
                let lookPos = new THREE.Vector3();
                
                // Get mouse camera offset if enabled
                const mouseYaw = this.mouseCamera ? this.mouseCamera.yaw : 0;
                const mousePitch = this.mouseCamera ? this.mouseCamera.pitch : 0;
                
                switch (this.state.cameraMode) {
                    case 'follow':
                        // Base angle from car rotation + mouse yaw offset
                        const baseAngle = target.rotation.y + mouseYaw;
                        const heightOffset = this.state.cameraHeight + Math.sin(mousePitch) * this.state.cameraDistance * 0.5;
                        const distanceOffset = this.state.cameraDistance * Math.cos(mousePitch * 0.5);
                        
                        targetPos.set(
                            target.position.x - Math.sin(baseAngle) * distanceOffset,
                            target.position.y + heightOffset,
                            target.position.z - Math.cos(baseAngle) * distanceOffset
                        );
                        lookPos.copy(target.position).add(new THREE.Vector3(0, 2, 0));
                        break;
                        
                    case 'orbit':
                        const orbitAngle = this.state.time * 0.3 + mouseYaw;
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
                
                // 🏢 CAMERA COLLISION - prevent camera from going inside buildings
                targetPos = this.preventCameraCollision(target.position, targetPos);
                
                this.camera.position.lerp(targetPos, CONFIG.CAMERA_LERP_FACTOR);
                
                const currentDir = new THREE.Vector3();
                this.camera.getWorldDirection(currentDir);
                const targetDir = new THREE.Vector3().subVectors(lookPos, this.camera.position).normalize();
                currentDir.lerp(targetDir, CONFIG.CAMERA_LERP_FACTOR);
                this.camera.lookAt(this.camera.position.clone().add(currentDir));
            }
            
            // Prevent camera from clipping through buildings
            preventCameraCollision(carPos, cameraPos) {
                const buildingPositions = [
                    { x: 0, z: 0 },       // About Me
                    { x: 70, z: -50 },    // Tech Stack
                    { x: 0, z: -100 },    // Projects
                    { x: -70, z: 50 },    // Experience
                    { x: 70, z: 50 }      // Contact
                ];
                const buildingRadius = 15; // Approximate building radius
                const minCameraHeight = 3;
                
                for (const building of buildingPositions) {
                    const dx = cameraPos.x - building.x;
                    const dz = cameraPos.z - building.z;
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    
                    if (dist < buildingRadius && cameraPos.y < 40) {
                        // Push camera outside building
                        const pushDir = new THREE.Vector2(dx, dz).normalize();
                        cameraPos.x = building.x + pushDir.x * buildingRadius;
                        cameraPos.z = building.z + pushDir.y * buildingRadius;
                        
                        // Also raise camera if too close
                        if (dist < buildingRadius * 0.7) {
                            cameraPos.y = Math.max(cameraPos.y, minCameraHeight + (buildingRadius - dist));
                        }
                    }
                }
                
                return cameraPos;
            }
            
            updateAnimations() {
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
            
            // 🚗 DRIFT DETECTION - tire screech and smoke
            checkDrift() {
                if (!this.vehiclePhysics || !this.car) return;
                
                const speed = Math.abs(this.vehiclePhysics.speed);
                const steer = Math.abs(this.state.input.steer);
                const speedKmh = speed * 3.6;
                
                // Drift = high speed + hard steering
                const isDrifting = speedKmh > 40 && steer > 0.7 && this.vehiclePhysics.isGrounded;
                
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
                    
                    // Check for drift achievement
                    const driftDuration = this.state.time - (this.state.driftStartTime || 0);
                    if (driftDuration > 2 && !this.state.achievements.driftKing) {
                        this.state.achievements.driftKing = true;
                        this.showToast('🏎️', 'Drift King!', '2+ second drift!');
                    }
                }
                
                this.state.wasDrifting = isDrifting;
            }
            
            playTireScreech() {
                if (!this.audioContext || this.state.quality === 'low') return;
                
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                
                // White noise filtered for tire screech
                const duration = 0.5;
                const bufferSize = this.audioContext.sampleRate * duration;
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
                }
                
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 2000;
                filter.Q.value = 5;
                
                const gain = this.audioContext.createGain();
                gain.gain.value = 0.08;
                
                source.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioContext.destination);
                
                source.start();
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
                        hint.textContent = 'Hold SPACE to enter';
                        hint.style.display = 'inline';
                        indicator.style.display = 'block';
                        
                        // Show toast for first approach to this section
                        if (!this.state.sectionsVisited.has(closest.userData.title)) {
                            this.showToast(closest.userData.icon, `Discovered: ${closest.userData.title}`, 'Hold SPACE to explore', 2500);
                        }
                    } else {
                        indicator.style.display = 'none';
                        this.updateProgressBar(0);
                    }
                }
                
                // Handle hold-to-enter mechanic
                if (this.state.currentSection && this.state.keys['Space']) {
                    this.state.holdingSpaceTime += 0.016; // Approximate 60fps
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
                if (!canvas) return;
                
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
                const scale = 1.8;
                
                // Draw roads - hub and spoke from center
                ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
                ctx.lineWidth = 4;
                
                const hub = { x: 0, z: 0 };
                const startPos = { x: 0, z: 60 };
                const buildings = [
                    { x: 70, z: -50 },   // Tech Stack
                    { x: 0, z: -100 },   // Projects
                    { x: -70, z: 50 },   // Experience
                    { x: 70, z: 50 }     // Contact
                ];
                
                // Draw start road
                ctx.beginPath();
                ctx.moveTo(cx + startPos.x / scale, cy + startPos.z / scale);
                ctx.lineTo(cx + hub.x / scale, cy + hub.z / scale);
                ctx.stroke();
                
                // Draw spoke roads from hub to each building
                buildings.forEach(building => {
                    ctx.beginPath();
                    ctx.moveTo(cx + hub.x / scale, cy + hub.z / scale);
                    ctx.lineTo(cx + building.x / scale, cy + building.z / scale);
                    ctx.stroke();
                });
                
                // Draw buildings with colors
                this.sections.forEach(section => {
                    const x = cx + section.position.x / scale;
                    const y = cy + section.position.z / scale;
                    
                    const color = '#' + new THREE.Color(section.userData.color).getHexString();
                    
                    // Glow effect
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 10;
                    
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(x, y, 8, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.shadowBlur = 0;
                    
                    // White border
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                });
                
                // Draw player
                const playerPos = this.state.playerMode === 'driving' ? this.car.position : this.character.position;
                const playerAngle = this.state.playerMode === 'driving' ? this.car.rotation.y : this.character.rotation.y;
                const px = cx + playerPos.x / scale;
                const py = cy + playerPos.z / scale;
                
                ctx.save();
                ctx.translate(px, py);
                // Fix rotation: Three.js Y-rotation is counter-clockwise from +Z, 
                // Canvas needs clockwise from -Y (up), so we add PI
                ctx.rotate(playerAngle + Math.PI);
                
                // Player indicator with glow
                ctx.shadowColor = '#6366F1';
                ctx.shadowBlur = 15;
                
                const gradient = ctx.createLinearGradient(-6, -6, 6, 6);
                gradient.addColorStop(0, '#6366F1');
                gradient.addColorStop(1, '#EC4899');
                ctx.fillStyle = gradient;
                
                ctx.beginPath();
                ctx.moveTo(0, -8);
                ctx.lineTo(-5, 6);
                ctx.lineTo(5, 6);
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
                this.lastFpsTime = now;
                
                // Clamp FPS display to reasonable range
                const displayFps = Math.min(Math.max(this.fps, 0), 999);
                document.getElementById('fpsCounter').textContent = `${displayFps} FPS`;
                
                // Auto-quality adjustment
                if (this.fps < CONFIG.AUTO_QUALITY_THRESHOLD && this.state.quality !== 'low') {
                    if (this.state.quality === 'ultra') {
                        document.getElementById('qualitySelect').value = 'high';
                        this.applyQuality('high');
                    } else if (this.state.quality === 'high') {
                        document.getElementById('qualitySelect').value = 'medium';
                        this.applyQuality('medium');
                    } else if (this.fps < 20) {
                        document.getElementById('qualitySelect').value = 'low';
                        this.applyQuality('low');
                    }
                }
            }
        }

        // ============================================
        // INITIALIZE
        // ============================================
        
        const engine = new PortfolioEngine();
        engine.init();
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (engine.renderer) {
                engine.renderer.dispose();
            }
            if (engine.composer) {
                engine.composer.dispose();
            }
        });
        
        // Expose engine for debugging (optional)
        window.portfolioEngine = engine;
