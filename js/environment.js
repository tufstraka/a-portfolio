import * as THREE from 'three';
import { surfaceMaterial } from './surface-materials.js';
import { Grass } from './grass.js';

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
      uniforms:{time:{value:0},night:{value:0}},
      vertexShader:`varying vec2 vUv; varying vec3 vWorld; uniform float time;
      #include <common>
      #include <logdepthbuf_pars_vertex>
      void main(){vUv=uv; vec3 p=position; p.z+=sin(p.x*.22+time*.7)*.10+cos(p.y*.26-time*.5)*.08; vec4 w=modelMatrix*vec4(p,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;
      #include <logdepthbuf_vertex>
      }`,
      fragmentShader:`varying vec2 vUv;varying vec3 vWorld;uniform float time;uniform float night;
      #include <logdepthbuf_pars_fragment>
      void main(){
      #include <logdepthbuf_fragment>
      float r=length(vUv-.5)*2.; if(r>1.)discard;float wave=sin(vUv.x*85.+time*.8+sin(vUv.y*48.+time))*.5+.5;
      vec3 c=mix(vec3(.055,.31,.36),vec3(.19,.62,.64),wave*.24+smoothstep(.65,1.,r)*.48);
      float glint=pow(max(0.,sin(vUv.x*130.+vUv.y*90.+time)),32.)*.10;c+=glint;c=mix(c,c*vec3(.4,.58,.8),night*.65);
      gl_FragColor=vec4(c,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include'),
      side:THREE.DoubleSide
    });
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(44,44,24,24),material);
    mesh.rotation.x=-Math.PI/2;mesh.position.set(-58,.1,-57);mesh.userData.dynamic=true;
    this.engine.scene.add(mesh);
    // A physical shoreline keeps the pool from being a drive-through decal.
    const stoneGeo=new THREE.DodecahedronGeometry(1.2,0),stoneMat=surfaceMaterial('stone',this.engine.renderer);
    const shore=new THREE.InstancedMesh(stoneGeo,stoneMat,40),dummy=new THREE.Object3D();
    for(let i=0;i<40;i++){const a=i/40*Math.PI*2;dummy.position.set(-58+Math.cos(a)*23,.4,-57+Math.sin(a)*23);dummy.scale.set(1.3,.65,1);dummy.rotation.set(0,a,0);dummy.updateMatrix();shore.setMatrixAt(i,dummy.matrix);this.engine.collisionSystem.addTree({x:dummy.position.x,z:dummy.position.z});}
    shore.computeBoundingSphere();shore.castShadow=true;this.engine.scene.add(shore);return mesh;
  }
  createLandmarks() {
    const scene=this.engine.scene;
    const road=new THREE.MeshLambertMaterial({color:0x9a987e});
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
      part(shell,x,height/2,z,15,height,9).castShadow=true;
      part(accent,x,height+.3,z,16,.6,10).castShadow=true;
      part(dark,x,height*.53,z+4.56,11,height*.55,.12);
      for(let j=0;j<4;j++)part(accent,x-4.5+j*3,height*.53,z+4.7,.12,height*.55,.16);
      part(accent,x+6,height+2,z,1,4,1);
      this.engine.collisionSystem.addBuilding({x,z},16,10);
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
    this.water.material.uniforms.time.value=e.reducedMotion?0:e.state.time;
    this.grass.update(e.state.time);
    this.water.material.uniforms.night.value=night;this.stars.material.opacity=night*.85;
    this.beacons.forEach((r,i)=>{r.material.opacity=e.state.sectionsVisited.has(e.sections[i].userData.title)?.25:.65+(e.reducedMotion?0:Math.sin(e.state.time*2+i)*.15);});
    const label=document.getElementById('worldTime');if(label)label.textContent=night>.7?'AFTER HOURS':this.time>.65?'GOLDEN HOUR':'DAYLIGHT';
  }
}
