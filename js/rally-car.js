import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { surfaceMaterial } from './surface-materials.js';

export function createRallyCar(renderer) {
  const car=new THREE.Group();car.name='Kadima Trail 07';
  const paint=new THREE.MeshStandardMaterial({color:0xf18b42,roughness:.34,metalness:.12});
  const cream=new THREE.MeshStandardMaterial({color:0xf9edca,roughness:.45});
  const trim=new THREE.MeshStandardMaterial({color:0x203d43,roughness:.65});
  const glass=new THREE.MeshStandardMaterial({color:0x6ebbc6,roughness:.22,metalness:.15});
  const lamp=new THREE.MeshStandardMaterial({color:0xfff2bb,emissive:0xffce73,emissiveIntensity:.65});
  const red=new THREE.MeshStandardMaterial({color:0xec503c,emissive:0xd93823,emissiveIntensity:.5});
  const rubber=surfaceMaterial('rubber',renderer);
  const rounded=new RoundedBoxGeometry(1,1,1,2,.09);
  const groups=new Map();
  function add(geometry,material,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){
    const obj=new THREE.Object3D();obj.position.set(x,y,z);obj.scale.set(sx,sy,sz);obj.rotation.set(rx,ry,rz);obj.updateMatrix();
    let g=geometry.clone().applyMatrix4(obj.matrix);if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}
    if(!groups.has(material))groups.set(material,[]);groups.get(material).push(g);
  }
  const box=(m,x,y,z,w,h,d,rx=0)=>add(rounded,m,x,y,z,w,h,d,rx);
  box(trim,0,.38,0,2.12,.28,4.3);
  box(paint,0,.74,0,2.03,.64,4.1);
  box(paint,0,1.05,1.38,1.94,.25,1.45,-.05);
  // Sloped cabin glazing, framed by a cream roof and pillars.
  box(glass,0,1.47,-.27,1.77,.78,1.93);
  box(cream,0,1.92,-.36,1.93,.17,1.94);
  box(glass,0,1.48,.75,1.7,.83,.08,.32);
  for(const side of [-1,1]) {
    box(paint,side*.96,1.03,-.28,.12,.24,2.0);
    for(const z of [-1.28,-.3,.69])box(cream,side*.91,1.5,z,.105,.88,.09);
    box(trim,side*1.12,.88,1.4,.25,.26,1.22);
    box(trim,side*1.12,.88,-1.35,.25,.26,1.22);
    box(cream,side*1.03,.72,-.15,.025,.15,2.5);
    box(trim,side*1.03,1.13,-.56,.04,.05,.28);
    box(paint,side*1.14,1.42,.66,.3,.18,.3);
    box(cream,side*.5,1.20,1.39,.22,.018,1.35,-.05);
    box(red,side*.78,.94,-2.075,.25,.2,.05);
    add(new THREE.CylinderGeometry(.19,.19,.09,16),lamp,side*.7,1.0,2.08,1,1,1,Math.PI/2);
    box(trim,side*.69,2.08,-.35,.07,.13,1.9);
  }
  box(trim,0,.92,2.065,.87,.26,.08);
  for(const x of [-.27,0,.27])box(cream,x,.92,2.115,.035,.15,.015);
  box(cream,0,.48,2.14,1.7,.16,.19);
  box(cream,0,.48,-2.14,1.7,.16,.19);
  for(const z of [-1.07,.34])box(trim,0,2.15,z,1.5,.07,.07);
  // Roof-mounted spare and a compact rally spoiler give the rear view character.
  add(new THREE.TorusGeometry(.34,.13,6,16),rubber,0,2.18,-.46,1,1,1,Math.PI/2);
  box(cream,0,1.95,-1.44,1.96,.11,.34);
  const badge=document.createElement('canvas');badge.width=128;badge.height=128;
  const ctx=badge.getContext('2d');ctx.fillStyle='#f9edca';ctx.fillRect(0,0,128,128);ctx.fillStyle='#203d43';ctx.font='900 68px sans-serif';ctx.textAlign='center';ctx.fillText('07',64,88);
  const badgeMap=new THREE.CanvasTexture(badge);badgeMap.colorSpace=THREE.SRGBColorSpace;
  const badgeMat=new THREE.MeshStandardMaterial({map:badgeMap,roughness:.55});
  for(const side of [-1,1])add(new THREE.PlaneGeometry(.56,.45),badgeMat,side*1.025,.92,-.4,1,1,1,0,side*Math.PI/2);
  for(const [material,geometries] of groups) {
    const merged=mergeGeometries(geometries);const mesh=new THREE.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;car.add(mesh);geometries.forEach(g=>g.dispose());
  }
  rounded.dispose();
  const wheels=[];
  const tireGeometry=new THREE.CylinderGeometry(.48,.48,.35,18).rotateZ(Math.PI/2);
  const rimGeometry=new THREE.CylinderGeometry(.30,.30,.37,12).rotateZ(Math.PI/2);
  const hubGeometry=new THREE.CylinderGeometry(.10,.10,.39,8).rotateZ(Math.PI/2);
  for(const z of [1.37,-1.35]) for(const x of [-1.08,1.08]) {
    const wheel=new THREE.Group(),spin=new THREE.Group();wheel.position.set(x,.15,z);wheel.userData.steering=z>0;wheel.userData.spinner=spin;
    for(const [g,m] of [[tireGeometry,rubber],[rimGeometry,cream],[hubGeometry,trim]]){const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;spin.add(mesh);}
    wheel.add(spin);wheels.push(wheel);car.add(wheel);
  }
  return {car,wheels};
}
