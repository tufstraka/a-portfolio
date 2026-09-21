import * as THREE from 'three';
import { surfaceMaterial } from './surface-materials.js';
import { Grass } from './grass.js';
import { Wildlife } from './wildlife.js';

const keys = [
  [0,0x101e3b,0x344461,0xadc7ff,.10,.55],
  [.22,0x343854,0xe7a083,0xffb383,.15,.6],
  [.30,0x74a9c7,0xf4c78d,0xffd5a2,1.5,.7],
  [.5,0x69b4dd,0xdbe3c5,0xfff4d9,2.0,.8],
  [.69,0x638db7,0xf7bb7f,0xffc490,1.65,.7],
  [.77,0x45456f,0xf29b79,0xffa17a,.45,.65],
  [.84,0x14294b,0x596580,0xadc7ff,.10,.55],
  [1,0x101e3b,0x344461,0xadc7ff,.10,.55]
].map(([t,top,bottom,sun,intensity,ambient])=>({t,top:new THREE.Color(top),bottom:new THREE.Color(bottom),sun:new THREE.Color(sun),intensity,ambient}));
export const TIME_PRESETS = { dawn:.265, day:.5, sunset:.745, night:.91 };
export function sampleAtmosphere(t) {
  t=((t%1)+1)%1;
  const i=keys.findIndex((k,n)=>n<keys.length-1 && t>=k.t && t<keys[n+1].t);
  const a=keys[Math.max(0,i)],b=keys[Math.max(0,i)+1];
  let f=(t-a.t)/(b.t-a.t); f=f*f*(3-2*f);
  return {top:a.top.clone().lerp(b.top,f),bottom:a.bottom.clone().lerp(b.bottom,f),sun:a.sun.clone().lerp(b.sun,f),intensity:THREE.MathUtils.lerp(a.intensity,b.intensity,f),ambient:THREE.MathUtils.lerp(a.ambient,b.ambient,f)};
}

export class Environment {
  constructor(engine) {
    this.engine=engine; this.time=.69; this.speed=1/420; this.target=null;
    this.water = this.createWater();
    this.stars = this.createStars();
    this.createLandmarks();
    this.grass=new Grass(engine);
    this.wildlife=new Wildlife(engine);
    this.beacons=[];
    const geometry=new THREE.TorusGeometry(3.1,.06,5,40);
    engine.sections.forEach((section,index)=>{
      const material=new THREE.MeshBasicMaterial({color:section.userData.color,transparent:true,opacity:.8});
      const ring=new THREE.Mesh(geometry,material);ring.rotation.x=-Math.PI/2;
      ring.position.copy(section.position);ring.position.y=.18;ring.userData.dynamic=true;
      engine.scene.add(ring);this.beacons.push(ring);
    });
    this.update(0);
  }
  createWater() {
    const material=new THREE.ShaderMaterial({
      uniforms:{time:{value:0},night:{value:0},skyTop:{value:new THREE.Color(0x69b4dd)},skyHorizon:{value:new THREE.Color(0xdbe3c5)},sunColor:{value:new THREE.Color(0xfff4d9)},sunDirection:{value:new THREE.Vector3(1,1,1).normalize()}},
      vertexShader:`varying vec2 vUv; varying vec3 vWorld; uniform float time;
      #include <common>
      #include <logdepthbuf_pars_vertex>
      void main(){vUv=uv; vec3 p=position; p.z+=sin(p.x*.55+time*.7)*.035+cos(p.y*.72-time*.5)*.025; vec4 w=modelMatrix*vec4(p,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;
      #include <logdepthbuf_vertex>
      }`,
      fragmentShader:`varying vec2 vUv;varying vec3 vWorld;uniform float time;uniform float night;
      uniform vec3 skyTop;uniform vec3 skyHorizon;uniform vec3 sunColor;uniform vec3 sunDirection;
      #include <common>
      #include <logdepthbuf_pars_fragment>
      void main(){
      #include <logdepthbuf_fragment>
      vec2 p=(vUv-.5)*44.;float radius=length(p);if(radius>22.)discard;
      float depth=smoothstep(0.,8.,22.-radius);
      float a=p.x*.55+time*.7,b=p.y*.72-time*.5;
      float fine=dot(p,vec2(1.7,1.2))+time*1.1;
      vec3 normal=normalize(vec3(-.019*cos(a)-.025*cos(fine),1.,-.018*sin(b)-.018*cos(fine)));
      vec3 viewDir=normalize(cameraPosition-vWorld);
      vec3 reflected=reflect(-viewDir,normal);
      float fresnel=.025+.975*pow(1.-max(dot(normal,viewDir),0.),5.);
      vec3 sky=mix(skyHorizon,skyTop,smoothstep(0.,.8,reflected.y));
      vec3 bed=mix(vec3(.25,.32,.22),vec3(.025,.15,.17),depth);
      float caustic=pow(.5+.5*sin(p.x*2.1+sin(p.y*1.7+time*.6)+time*.4),6.);
      bed+=vec3(.10,.13,.075)*caustic*(1.-depth)*(1.-night);
      vec3 c=mix(bed*(1.-night*.62),sky,max(.20,fresnel*.85));
      float highlight=pow(max(dot(reflected,sunDirection),0.),160.);
      c+=sunColor*highlight*(1.-night)*.9;
      float shore=(1.-smoothstep(.15,1.3,22.-radius))*(.5+.5*sin(radius*15.-time*.7+sin(p.x)));
      c=mix(c,vec3(.61,.68,.56)*(1.-night*.55),shore*.22);
      gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
      side:THREE.DoubleSide
    });
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(44,44,48,48),material);
    mesh.rotation.x=-Math.PI/2;mesh.position.set(-58,.22,-57);mesh.userData.dynamic=true;
    this.engine.scene.add(mesh);
    // A physical shoreline keeps the pool from being a drive-through decal.
    const stoneGeo=new THREE.DodecahedronGeometry(1.2,0),stoneMat=surfaceMaterial('stone',this.engine.renderer);
    const shore=new THREE.InstancedMesh(stoneGeo,stoneMat,40),dummy=new THREE.Object3D();
    for(let i=0;i<40;i++){const a=i/40*Math.PI*2;dummy.position.set(-58+Math.cos(a)*23,.4,-57+Math.sin(a)*23);dummy.scale.set(1.3,.65,1);dummy.rotation.set(0,a,0);dummy.updateMatrix();shore.setMatrixAt(i,dummy.matrix);this.engine.collisionSystem.addTree({x:dummy.position.x,z:dummy.position.z},.9,1.1);}
    shore.computeBoundingSphere();shore.castShadow=true;this.engine.scene.add(shore);
    const reeds=new THREE.InstancedMesh(new THREE.CylinderGeometry(.025,.055,1.5,4),new THREE.MeshStandardMaterial({color:0x6b7951,roughness:1}),96);
    for(let i=0;i<96;i++){const a=i*2.399963,r=21.5+(i%5)*.25;dummy.position.set(-58+Math.cos(a)*r,.7,-57+Math.sin(a)*r);dummy.scale.set(1,.65+(i%7)*.11,1);dummy.rotation.set(.09*Math.sin(i),a,.12*Math.cos(i));dummy.updateMatrix();reeds.setMatrixAt(i,dummy.matrix);}reeds.computeBoundingSphere();this.engine.scene.add(reeds);return mesh;
  }
  createLandmarks() {
    const scene=this.engine.scene;
    const road=surfaceMaterial('road',this.engine.renderer);
    const paint=new THREE.MeshBasicMaterial({color:0xf4e4b8});
    const box=new THREE.BoxGeometry(1,1,1);
    const part=(material,x,y,z,w,h,d)=>{const m=new THREE.Mesh(box,material);m.position.set(x,y,z);m.scale.set(w,h,d);m.receiveShadow=true;scene.add(m);return m;};
    // Broad lanes frame an open playground; markers guide without blocking driving.
    part(road,0,.02,-25,12,.04,210);
    part(road,0,.025,50,170,.04,12);
    part(road,36,.025,-50,72,.04,12);
    const marks=new THREE.InstancedMesh(box,paint,32),dummy=new THREE.Object3D();
    for(let i=0;i<32;i++){dummy.position.set(-5,.06,74-i*6.4);dummy.scale.set(.18,.03,2);dummy.updateMatrix();marks.setMatrixAt(i,dummy.matrix);}
    marks.computeBoundingSphere();scene.add(marks);
    const shell=surfaceMaterial('plaster',this.engine.renderer);
    const dark=new THREE.MeshLambertMaterial({color:0x263e47});
    this.engine.sections.forEach((section,i)=>{
      const x=section.position.x,z=section.position.z-14;
      const accent=new THREE.MeshLambertMaterial({color:section.userData.color});
      const height=7+(i%3)*2;
      // Real open bay: collisions follow the walls, leaving a generous drive-in opening.
      part(shell,x-7,height/2,z,.6,height,10).castShadow=true;
      part(shell,x+7,height/2,z,.6,height,10).castShadow=true;
      part(shell,x,height/2,z-4.7,14,height,.6).castShadow=true;
      part(dark,x,.04,z,14,.08,10);
      part(shell,x,height,z,14.8,.35,10.6).castShadow=true;
      part(accent,x,height-.7,z+5.1,14.8,1,.25);
      const light=new THREE.MeshStandardMaterial({color:0xffe4aa,emissive:0xffd397,emissiveIntensity:1.3});
      part(light,x,height-.15,z+3,9,.06,.15);
      for(const side of [-1,1]){
        part(dark,x+side*5.5,1.1,z-2,2,2.2,2.4).castShadow=true;
        part(accent,x+side*5.5,2.25,z-2,2.2,.15,2.6);
        this.engine.collisionSystem.addBuilding({x:x+side*5.5,z:z-2},2,2.4,2.3);
        part(paint,x+side*2.6,.1,z+1,.12,.02,7);
      }
      this.engine.collisionSystem.addBuilding({x:x-7,z},.6,10,height);
      this.engine.collisionSystem.addBuilding({x:x+7,z},.6,10,height);
      this.engine.collisionSystem.addBuilding({x,z:z-4.7},14,.6,height);
    });
  }
  createStars(){
    const points=new Float32Array(180*3);
    for(let i=0;i<180;i++){const a=i*2.399963,r=180+(i%7)*5,y=65+(i%19)*7;points[i*3]=Math.cos(a)*r;points[i*3+1]=y;points[i*3+2]=Math.sin(a)*r;}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(points,3));
    const stars=new THREE.Points(g,new THREE.PointsMaterial({color:0xc4dcff,size:.7,transparent:true,opacity:0,depthWrite:false}));this.engine.scene.add(stars);return stars;
  }
  setTime(name){if(name in TIME_PRESETS)this.target=TIME_PRESETS[name];}
  update(delta){
    const e=this.engine;
    if(this.target!==null){let d=this.target-this.time;if(d>.5)d-=1;if(d<-.5)d+=1;this.time=(this.time+d*(1-Math.exp(-delta*2.5))+1)%1;if(Math.abs(d)<.001){this.time=this.target;this.target=null;}}
    else if(!e.pauseTime)this.time=(this.time+delta*this.speed)%1;
    e.dayTime=this.time;const a=sampleAtmosphere(this.time);
    e.skyMaterial.uniforms.topColor.value.copy(a.top);e.skyMaterial.uniforms.bottomColor.value.copy(a.bottom);
    e.scene.fog.color.copy(a.bottom);e.sunLight.color.copy(a.sun);e.sunLight.intensity=a.intensity;
    const angle=this.time*Math.PI*2-Math.PI/2;
    e.sunLight.position.set(Math.cos(angle)*100,Math.max(35,Math.sin(angle)*140),70);
    e.ambientLight.color.setHex(0xd2dfeb);e.ambientLight.intensity=a.ambient;
    if(e.hemiLight){e.hemiLight.color.copy(a.top);e.hemiLight.intensity=.55;}
    const night=1-THREE.MathUtils.smoothstep(a.intensity,.12,1.2);
    this.wildlife.update(e.state.time,night);
    this.water.material.uniforms.time.value=e.reducedMotion?0:e.state.time;
    this.grass.update(e.state.time);
    this.water.material.uniforms.night.value=night;
    this.water.material.uniforms.skyTop.value.copy(a.top);this.water.material.uniforms.skyHorizon.value.copy(a.bottom);
    this.water.material.uniforms.sunColor.value.copy(a.sun);this.water.material.uniforms.sunDirection.value.copy(e.sunLight.position).normalize();this.stars.material.opacity=night*.85;
    this.beacons.forEach((r,i)=>{r.material.opacity=e.state.sectionsVisited.has(e.sections[i].userData.title)?.25:.65+(e.reducedMotion?0:Math.sin(e.state.time*2+i)*.15);});
    const label=document.getElementById('worldTime');if(label)label.textContent=night>.7?'AFTER HOURS':this.time>.65?'GOLDEN HOUR':'DAYLIGHT';
  }
}
