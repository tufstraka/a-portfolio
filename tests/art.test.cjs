const {test}=require('node:test');
const assert=require('node:assert/strict');

test('grass excludes driving lanes, water, and destination buildings',async()=>{
  const {clearForGrass}=await import('../js/grass.js');
  const sections=[{position:{x:70,z:-50}}];
  for(const [x,z] of [[0,60],[40,50],[40,-50],[-58,-57],[70,-50],[70,-64]])assert.equal(clearForGrass(x,z,sections),false);
  assert.equal(clearForGrass(-23,18,sections),true);
});

test('rally wheels separate steering pivots from rolling geometry',async()=>{
  const ctx={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},fillRect(){},fillText(){}};
  global.document={createElement:()=>({getContext:()=>ctx})};
  const {createRallyCar}=await import('../js/rally-car.js');
  const {car,wheels}=createRallyCar({capabilities:{getMaxAnisotropy:()=>4}});
  assert.equal(wheels.length,4);assert.equal(wheels.filter(w=>w.userData.steering).length,2);
  for(const wheel of wheels){assert.equal(wheel.userData.spinner.parent,wheel);assert.equal(wheel.userData.spinner.children.length,3);}
  const THREE=await import('three');const bounds=new THREE.Box3().setFromObject(car),size=bounds.getSize(new THREE.Vector3());
  assert.ok(size.x<2.8 && size.z<5 && size.y<3,'body stays within the existing driving footprint');
  let draws=0;car.traverse(o=>{if(o.isMesh)draws++;});assert.ok(draws<=24,'static body pieces are merged by material');
});
