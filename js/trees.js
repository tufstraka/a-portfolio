import * as THREE from 'three';
import { surfaceMaterial } from './surface-materials.js';

export function createTrees(engine,count){
 const bark=surfaceMaterial('bark',engine.renderer),leaves=surfaceMaterial('foliage',engine.renderer);
 const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.32,.62,6,9),bark,count);
 const branches=new THREE.InstancedMesh(new THREE.CylinderGeometry(.08,.24,1,7),bark,count*4);
 const crownGeometry=new THREE.IcosahedronGeometry(1,2);
 const vertices=crownGeometry.attributes.position;
 for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i),r=1+.08*Math.sin(x*13+y*7)*Math.cos(z*11);vertices.setXYZ(i,x*r,y*r,z*r);}
 crownGeometry.computeBoundingSphere();
 const crowns=new THREE.InstancedMesh(crownGeometry,leaves,count*8);
 const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),direction=new THREE.Vector3(),color=new THREE.Color();
 let seed=1907,placed=0;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const anchors=[[-22,28],[24,25],[-28,76],[28,78],[-85,-22],[91,-76]];
 for(let attempt=0;placed<count&&attempt<count*20;attempt++){
  const a=random()*Math.PI*2,r=40+random()*165;
  const [x,z]=anchors[attempt]||[Math.sin(a)*r,Math.cos(a)*r];
  if(Math.abs(x)<12 || (Math.abs(z-50)<12&&Math.abs(x)<94) || (Math.abs(z+50)<12&&x>0&&x<87) || Math.hypot(x+58,z+57)<30)continue;
  if(engine.sections.some(s=>Math.hypot(x-s.position.x,z-s.position.z)<23)||engine.treePositions.some(p=>Math.hypot(x-p.x,z-p.z)<13))continue;
  const scale=.88+random()*.32,twist=random()*Math.PI*2;
  dummy.position.set(x,3*scale,z);dummy.rotation.set(.025*Math.sin(a),twist,.025*Math.cos(a));dummy.scale.setScalar(scale);dummy.updateMatrix();trunks.setMatrixAt(placed,dummy.matrix);
  // Visible limbs support an asymmetric crown instead of a stack of cones.
  for(let j=0;j<4;j++){
   const angle=twist+j*Math.PI*.5,dx=Math.cos(angle)*2.4*scale,dz=Math.sin(angle)*2.4*scale,dy=(2.7+j*.18)*scale;
   direction.set(dx,dy,dz);dummy.position.set(x+dx*.5,(4.1+j*.22)*scale+dy*.5,z+dz*.5);dummy.quaternion.setFromUnitVectors(up,direction.clone().normalize());dummy.scale.set(scale,direction.length(),scale);dummy.updateMatrix();branches.setMatrixAt(placed*4+j,dummy.matrix);
  }
  for(let j=0;j<8;j++){
   const angle=twist+j*2.39996,spread=j===7?0:2.2+random()*.9;
   dummy.position.set(x+Math.cos(angle)*spread*scale,(j===7?9.3:7.1+random()*1.7)*scale,z+Math.sin(angle)*spread*scale);
   dummy.rotation.set(random()*.2,angle,random()*.2);dummy.scale.set((2.2+random()*.5)*scale,(2.1+random()*.65)*scale,(2.0+random()*.7)*scale);dummy.updateMatrix();crowns.setMatrixAt(placed*8+j,dummy.matrix);
   color.setHSL(.20+random()*.035,.20+random()*.12,.55+random()*.16);crowns.setColorAt(placed*8+j,color);
  }
  engine.collisionSystem.addTree({x,z});engine.treePositions.push({x,z});placed++;
 }
 trunks.count=placed;branches.count=placed*4;crowns.count=placed*8;
 for(const mesh of [trunks,branches,crowns]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.cullable=false;engine.scene.add(mesh);engine.decorations.push(mesh);}
}
