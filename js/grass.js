import * as THREE from 'three';

export function clearForGrass(x,z,sections) {
  if(Math.abs(x)<9 || (Math.abs(z-50)<9 && Math.abs(x)<91) || (Math.abs(z+50)<9 && x>0 && x<83))return false;
  if(Math.hypot(x+58,z+57)<27)return false;
  return !sections.some(s=>Math.hypot(x-s.position.x,z-s.position.z)<13 || (Math.abs(x-s.position.x)<10 && Math.abs(z-s.position.z+14)<8));
}

export class Grass {
  constructor(engine) {
    this.engine=engine;this.wind={value:0};
    const blades=new THREE.BufferGeometry();
    // Three tapered blades per clump, with a bend built into their silhouette.
    const vertices=[];
    for(let i=0;i<3;i++){
      const angle=i*Math.PI/3,dx=Math.cos(angle)*.13,dz=Math.sin(angle)*.13;
      vertices.push(-dx,0,-dz,dx,0,dz,.12,.85,.08);
    }
    blades.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));blades.computeVertexNormals();
    const material=new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide});
    material.onBeforeCompile=shader=>{
      shader.uniforms.grassTime=this.wind;
      shader.vertexShader='uniform float grassTime;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        float phase=instanceMatrix[3].x*.27+instanceMatrix[3].z*.31;
        transformed.x+=sin(grassTime*1.4+phase)*.14*position.y*position.y;
        transformed.z+=cos(grassTime+phase)*.08*position.y;`);
    };
    material.customProgramCacheKey=()=> 'meadow-wind-v1';
    this.mesh=new THREE.InstancedMesh(blades,material,24000);this.mesh.name='Instanced meadow';this.mesh.userData.dynamic=true;
    const dummy=new THREE.Object3D(),color=new THREE.Color();let seed=71;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    // Interleave clusters so every quality tier covers the whole map.
    const patches=[];for(let x=-143;x<=143;x+=22)for(let z=-143;z<=99;z+=22)if(clearForGrass(x,z,engine.sections))patches.push([x,z,18]);
    let count=0;
    for(let i=0;i<90000 && count<24000;i++) {
      const [cx,cz,r]=patches[i%patches.length],a=random()*Math.PI*2,dist=Math.sqrt(random())*r;
      const x=cx+Math.cos(a)*dist,z=cz+Math.sin(a)*dist;
      if(!clearForGrass(x,z,engine.sections))continue;
      dummy.position.set(x,.055,z);dummy.rotation.y=random()*Math.PI*2;dummy.scale.setScalar(.6+random()*.85);dummy.updateMatrix();this.mesh.setMatrixAt(count,dummy.matrix);
      color.setHSL(.20+random()*.055,.28+random()*.24,.26+random()*.16);this.mesh.setColorAt(count,color);count++;
    }
    this.maximum=count;this.mesh.count=count;this.mesh.computeBoundingSphere();engine.scene.add(this.mesh);
    // Ground cover beneath the blades makes the meadow readable at a distance.
    const turfMaterial=new THREE.MeshLambertMaterial({color:0x64803c,side:THREE.DoubleSide});
    new THREE.TextureLoader().load(new URL('./textures/meadow.webp',document.baseURI).href,t=>{t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);t.anisotropy=Math.min(4,engine.renderer.capabilities.getMaxAnisotropy());turfMaterial.map=t;turfMaterial.color.setHex(0xaac17f);turfMaterial.needsUpdate=true;},undefined,()=>{});
    turfMaterial.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec2 meadowUv;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nmeadowUv=uv;');
      shader.fragmentShader='varying vec2 meadowUv;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        vec2 p=meadowUv-.5;float a=atan(p.y,p.x);float edge=.41+sin(a*7.)*.025+cos(a*11.)*.02;
        float grain=fract(sin(dot(floor(meadowUv*150.),vec2(12.9898,78.233)))*43758.5453);
        if(length(p)>edge-grain*.018)discard;
        diffuseColor.rgb*=.95+sin(meadowUv.x*30.)*cos(meadowUv.y*25.)*.05;`);
    };
    turfMaterial.customProgramCacheKey=()=> 'meadow-ground-v1';
    // Small islands remain clear of driveways even at their widest edge.
    const turf=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),turfMaterial,patches.length);
    let n=0;for(const [x,z,r] of patches){if(!clearForGrass(x,z,engine.sections))continue;dummy.position.set(x,.035,z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(r*1.7,r*1.7,1);dummy.updateMatrix();turf.setMatrixAt(n++,dummy.matrix);}
    turf.count=n;turf.computeBoundingSphere();engine.scene.add(turf);this.turf=turf;
    this.setQuality(engine.state.quality);
  }
  setQuality(level){this.mesh.count=Math.min(this.maximum,{low:6000,medium:12000,high:18000,ultra:24000}[level]||12000);}
  update(time){this.wind.value=this.engine.reducedMotion?0:time;}
}
