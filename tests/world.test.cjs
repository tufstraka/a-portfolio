const {test}=require('node:test');
const assert=require('node:assert/strict');

test('the atmosphere is continuous across midnight and all presets are finite',async()=>{
 const {sampleAtmosphere,TIME_PRESETS}=await import('../js/environment.js');
 const a=sampleAtmosphere(1-1e-7),b=sampleAtmosphere(1e-7);
 assert.ok(a.top.distanceTo ? a.top.distanceTo(b.top)<.001 : Math.abs(a.top.r-b.top.r)<.001);
 assert.ok(Math.abs(a.intensity-b.intensity)<.001);
 for(const t of Object.values(TIME_PRESETS)){
  const s=sampleAtmosphere(t);assert.ok(Number.isFinite(s.intensity));assert.ok(s.ambient>0);
 }
 assert.ok(sampleAtmosphere(.5).intensity>sampleAtmosphere(.91).intensity);
});

test('quality can return from low to high without losing shadows or post-processing',async()=>{
 const {applyQuality}=await import('../js/quality.js');
 global.window={devicePixelRatio:3};global.document={getElementById:()=>({value:''})};
 let disposed=0;
 const e={state:{},renderer:{setPixelRatio(r){this.ratio=r},shadowMap:{}},composer:{setPixelRatio(r){this.ratio=r}},sunLight:{shadow:{mapSize:{x:512,set(x,y){this.x=x;this.y=y}},map:{dispose(){disposed++}}}},camera:{updateProjectionMatrix(){}},bloomPass:{},colorGradingPass:{}};
 applyQuality(e,'low');assert.equal(e.renderer.shadowMap.enabled,false);assert.equal(e.useComposer,false);
 applyQuality(e,'high');assert.equal(e.renderer.shadowMap.enabled,true);assert.equal(e.bloomPass.enabled,true);assert.equal(e.renderer.ratio,1.5);assert.equal(e.composer.ratio,1.5);assert.equal(disposed,1);
});

test('public content includes five destinations and location-independent contact',async()=>{
 const {PORTFOLIO_DATA}=await import('../js/portfolio-data.js');
 assert.equal(Object.keys(PORTFOLIO_DATA).length,5);
 assert.doesNotMatch(JSON.stringify(PORTFOLIO_DATA),/Nairobi/i);
 assert.match(JSON.stringify(PORTFOLIO_DATA),/anywhere/i);
});

test('diagnostics bound frame history and retain local event totals',async()=>{
 const {Diagnostics}=await import('../js/diagnostics.js');const d=new Diagnostics();
 const renderer={info:{render:{calls:42,triangles:500},memory:{textures:4,geometries:8}}};
 for(let i=0;i<650;i++)d.frame(16,renderer);
 d.record('discovery');const s=d.snapshot();assert.equal(s.frames,600);assert.equal(s.p95,16);assert.equal(s.events.discovery,1);assert.equal(s.drawCalls,42);
});
