import * as THREE from 'three';
export class Wildlife {
 constructor(engine){
  this.engine=engine;this.dummy=new THREE.Object3D();this.time={value:0};
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,.4,-1.1,.1,-.2,0,0,-.2,0,0,.4,0,0,-.2,1.1,.1,-.2],3));g.computeVertexNormals();
  const m=new THREE.MeshLambertMaterial({color:0x37494b,side:THREE.DoubleSide});
  m.onBeforeCompile=s=>{s.uniforms.birdTime=this.time;s.vertexShader='uniform float birdTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.y+=sin(birdTime*4.+instanceMatrix[3].x*.02)*abs(position.x)*.42;');};
  this.birds=new THREE.InstancedMesh(g,m,12);this.birds.frustumCulled=false;engine.scene.add(this.birds);
  const p=new Float32Array(180*3);for(let i=0;i<180;i++){p[i*3]=Math.sin(i*87.3)*30;p[i*3+1]=.4+(i%19)*.24;p[i*3+2]=Math.cos(i*29.7)*30;}
  const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(p,3));
  this.dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xffecc7,size:.075,transparent:true,opacity:.34,depthWrite:false}));engine.scene.add(this.dust);
  const pads=new THREE.InstancedMesh(new THREE.CircleGeometry(1,12),new THREE.MeshLambertMaterial({color:0x68964f,side:THREE.DoubleSide}),14);
  for(let i=0;i<14;i++){const a=i*.47;this.dummy.position.set(-58+Math.cos(a)*16,.22,-57+Math.sin(a)*16);this.dummy.rotation.set(-Math.PI/2,0,a);this.dummy.scale.setScalar(.45+(i%3)*.18);this.dummy.updateMatrix();pads.setMatrixAt(i,this.dummy.matrix);}pads.computeBoundingSphere();engine.scene.add(pads);
  const reeds=new THREE.InstancedMesh(new THREE.CylinderGeometry(.035,.06,2,4),new THREE.MeshLambertMaterial({color:0x6c7948}),80);
  for(let i=0;i<80;i++){const a=i*.09;this.dummy.position.set(-58+Math.cos(a)*(22+i%3),.8,-57+Math.sin(a)*(22+i%3));this.dummy.rotation.set(Math.sin(i)*.15,0,Math.cos(i)*.15);this.dummy.scale.setScalar(.7+i%4*.12);this.dummy.updateMatrix();reeds.setMatrixAt(i,this.dummy.matrix);}reeds.computeBoundingSphere();engine.scene.add(reeds);
 }
 update(time,night){const e=this.engine,t=e.reducedMotion?0:time;this.time.value=t;
  for(let i=0;i<12;i++){const a=t*.035+i*.18;this.dummy.position.set(Math.cos(a)*75+(i%3)*4,18+Math.sin(a*2)*4+i%3*2,Math.sin(a)*55-32);this.dummy.rotation.set(0,-a,Math.sin(a)*.1);this.dummy.scale.setScalar(.7);this.dummy.updateMatrix();this.birds.setMatrixAt(i,this.dummy.matrix);}this.birds.instanceMatrix.needsUpdate=true;this.birds.visible=night<.8;
  this.dust.visible=!e.reducedMotion;this.dust.position.set(e.car?.position.x||0,Math.sin(t*.12)*.3,e.car?.position.z||0);this.dust.rotation.y=t*.012;this.dust.geometry.setDrawRange(0,e.state.quality==='low'?60:180);this.dust.material.opacity=.32+night*.1;
 }
}
