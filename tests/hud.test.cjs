const {test}=require('node:test');
const assert=require('node:assert/strict');
test('speedometer needle spans its scale, clamps overspeed, and displays reverse magnitude',async()=>{
 const {speedAngle}=await import('../js/racing-hud.js');
 assert.equal(speedAngle(0),-130);assert.equal(speedAngle(120),0);assert.equal(speedAngle(240),130);
 assert.equal(speedAngle(300),130);assert.equal(speedAngle(-120),0);
});
