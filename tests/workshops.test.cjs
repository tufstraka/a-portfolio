const {test}=require('node:test');const assert=require('node:assert/strict');
test('workshop mistakes cannot advance or complete a run; correct sequence can be replayed',async()=>{
 const {WorkshopRun,WORKSHOPS}=await import('../js/workshops.js');
 for(const id of Object.keys(WORKSHOPS)){
  const run=new WorkshopRun(id);assert.equal(run.choose(-1).correct,false);assert.equal(run.index,0);
  assert.equal(run.choose((run.stage.correct+1)%run.stage.choices.length).correct,false);assert.equal(run.index,0);assert.equal(run.mistakes,1);
  while(!run.completed){const before=run.index;assert.equal(run.choose(run.stage.correct).correct,true);assert.equal(run.index,before+1);}
  assert.equal(run.index,4);assert.equal(run.choose(0).complete,true);assert.equal(run.index,4);assert.equal(new WorkshopRun(id).completed,false);
 }
});
test('headlight override survives daylight changes and low quality retains illumination',async()=>{
 const {Headlights,lampsEnabled}=await import('../js/headlights.js');const THREE=await import('three');
 assert.equal(lampsEnabled('auto',.5),false);assert.equal(lampsEnabled('auto',.9),true);assert.equal(lampsEnabled('off',.9),false);assert.equal(lampsEnabled('on',.5),true);
 const engine={car:new THREE.Group(),state:{quality:'low'},dayTime:.9};engine.car.userData.headlightMaterial={emissiveIntensity:0};const lamps=new Headlights(engine);lamps.mode='on';for(let i=0;i<60;i++)lamps.update(1/60);
 assert.equal(lamps.lights.length,2);assert.ok(lamps.lights.every(l=>l.intensity>800&&!l.castShadow));engine.state.quality='high';lamps.update(1/60);assert.equal(lamps.lights.filter(l=>l.castShadow).length,1);
 lamps.setMode('off');for(let i=0;i<60;i++)lamps.update(1/60);assert.ok(lamps.lights.every(l=>!l.visible));assert.ok(engine.car.userData.headlightMaterial.emissiveIntensity<.04);
});
