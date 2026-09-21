import * as THREE from 'three';
import { surfaceAt, accumulateDirt } from './terrain-surfaces.js';

export class TrailEffects {
    constructor(engine) {
        this.engine = engine; this.dirt = { mud: 0, sand: 0 }; this.cursor = 0; this.emission = 0; this.exhaustEmission = 0;
        this.count = 240; this.particles = Array.from({ length: this.count }, () => ({ life: 0 }));
        this.positions = new Float32Array(this.count * 3); this.colors = new Float32Array(this.count * 3); this.sizes = new Float32Array(this.count); this.alpha = new Float32Array(this.count);
        const geometry = new THREE.BufferGeometry();
        for (const [name, array, size] of [['position', this.positions, 3], ['color', this.colors, 3], ['size', this.sizes, 1], ['opacity', this.alpha, 1]]) geometry.setAttribute(name, new THREE.BufferAttribute(array, size).setUsage(THREE.DynamicDrawUsage));
        const material = new THREE.ShaderMaterial({
            transparent: true, depthWrite: false, vertexColors: true,
            vertexShader: `attribute float size; attribute float opacity; varying float vAlpha; varying vec3 vColor;
                #include <common>
                #include <logdepthbuf_pars_vertex>
                void main(){vAlpha=opacity;vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(size*260./max(1.,-mv.z),1.,64.);
                #include <logdepthbuf_vertex>
                }`,
            fragmentShader: `varying float vAlpha;varying vec3 vColor;
                #include <logdepthbuf_pars_fragment>
                void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.||vAlpha<=0.)discard;
                #include <logdepthbuf_fragment>
                gl_FragColor=vec4(vColor,vAlpha*(1.-smoothstep(.15,1.,r)));
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
                }`
        });
        this.points = new THREE.Points(geometry, material); this.points.name = 'Exhaust and terrain spray'; this.points.frustumCulled = false;
        engine.scene.add(this.points); this.origin = new THREE.Vector3();
        this.tracks = new THREE.InstancedMesh(new THREE.PlaneGeometry(.28, .8), new THREE.MeshBasicMaterial({ color: 0x362614, transparent: true, opacity: .28, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }), 160);
        this.tracks.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.tracks.count = 0; this.tracks.frustumCulled = false; this.trackCursor = 0; this.trackDistance = 0; this.dummy = new THREE.Object3D(); engine.scene.add(this.tracks);
    }
    emit(position, kind, speed, yaw) {
        const i = this.cursor++ % this.count, p = this.particles[i], smoke = kind === 'smoke', mud = kind === 'mud';
        Object.assign(p, { x: position.x, y: position.y, z: position.z, life: smoke ? 1.4 : mud ? .6 : 1.5, total: smoke ? 1.4 : mud ? .6 : 1.5, kind,
            vx: -Math.sin(yaw) * speed * .2 + (Math.random() - .5) * 1.5,
            vz: -Math.cos(yaw) * speed * .2 + (Math.random() - .5) * 1.5,
            vy: smoke ? .6 : mud ? 1.5 + Math.random() * 2 : .4 + Math.random() });
        this.colors.set(smoke ? [.40, .43, .45] : mud ? [.16, .09, .035] : [.63, .45, .23], i * 3);
    }
    update(dt) {
        const e = this.engine, car = e.car, p = e.vehiclePhysics, speed = Math.abs(p.speed);
        const surface = surfaceAt(p.x, p.z), moving = p.isGrounded && speed > 2;
        if (moving) accumulateDirt(this.dirt, surface, speed * dt);
        car.userData.dirt.mud.value = this.dirt.mud; car.userData.dirt.sand.value = this.dirt.sand;
        const enabled = !e.reducedMotion, low = e.state.quality === 'low';
        car.updateMatrixWorld();
        this.exhaustEmission += enabled ? dt * (low ? 3 : 7) : 0;
        while (this.exhaustEmission >= 1) {
            this.origin.copy(car.userData.exhaust).applyMatrix4(car.matrixWorld); this.emit(this.origin, 'smoke', Math.max(2, speed), p.rotation); this.exhaustEmission--;
        }
        const dirtTerrain = surface === 'mud' || surface === 'sand';
        this.emission += enabled && moving && dirtTerrain ? dt * Math.min(low ? 14 : 40, speed * 2) : 0;
        while (this.emission >= 1) {
            const side = this.cursor % 2 ? 1 : -1;
            this.origin.set(side * 1.1, -.1, -1.4).applyMatrix4(car.matrixWorld); this.emit(this.origin, surface, speed, p.rotation); this.emission--;
        }
        this.trackDistance += moving && dirtTerrain ? speed * dt : 0;
        if (this.trackDistance > .85 && enabled) {
            this.trackDistance = 0;
            for (const side of [-1, 1]) {
                this.origin.set(side * 1.08, 0, -1.35).applyMatrix4(car.matrixWorld);
                this.dummy.position.set(this.origin.x, .065, this.origin.z); this.dummy.rotation.set(-Math.PI / 2, 0, -p.rotation); this.dummy.updateMatrix();
                this.tracks.setMatrixAt(this.trackCursor++ % 160, this.dummy.matrix);
            }
            this.tracks.count = Math.min(160, this.trackCursor); this.tracks.instanceMatrix.needsUpdate = true;
        }
        for (let i = 0; i < this.count; i++) {
            const particle = this.particles[i]; particle.life = Math.max(0, particle.life - dt);
            if (!particle.life) { this.alpha[i] = 0; continue; }
            particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.z += particle.vz * dt;
            if (particle.kind === 'mud') particle.vy -= 9 * dt;
            if (particle.y < .05) particle.life = 0;
            const life = particle.life / particle.total;
            this.positions.set([particle.x, particle.y, particle.z], i * 3);
            this.sizes[i] = particle.kind === 'mud' ? .16 : .25 + (1 - life) * 1.8;
            this.alpha[i] = enabled ? life * (particle.kind === 'smoke' ? .18 : .45) : 0;
        }
        for (const attribute of Object.values(this.points.geometry.attributes)) attribute.needsUpdate = true;
    }
}
