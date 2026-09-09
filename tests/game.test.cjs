const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
function fixture() {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) {
      const classes = new Set();
      elements.set(id, { style: {}, open: false, attributes: {}, classList: { contains: c => classes.has(c), add: c => classes.add(c), remove: c => classes.delete(c) }, setAttribute(k,v) { this.attributes[k]=v; }, focus() {}, textContent: '' });
    }
    return elements.get(id);
  }
  const context = { THREE: require('three'), document: { hidden: false, getElementById: element }, window: {}, console, setTimeout() {}, requestAnimationFrame: () => 1, performance };
  vm.createContext(context);
  const classSource = source.slice(source.indexOf('class PortfolioEngine'), source.indexOf('const engine = new PortfolioEngine'));
  vm.runInContext(classSource.replaceAll('import.meta.url', "'file:///portfolio/js/main.js'") + '\nthis.Engine = PortfolioEngine;', context);
  const engine = Object.create(context.Engine.prototype);
  engine.state = { keys: {}, input: {}, holdingSpaceTime: 0, time: 0 };
  return { engine, element, context };
}
test('opening an interface suppresses driving and preserves native keyboard controls', () => {
  const {engine,element} = fixture();
  element('modalOverlay').classList.add('active');
  engine.onKeyDown({ code:'Space', target: {closest:()=>null}, preventDefault() { throw Error('must retain native key behavior'); } });
  assert.equal(engine.state.keys.Space, undefined);
  element('modalOverlay').classList.remove('active');
  engine.onKeyDown({ code:'KeyW', target: {closest:()=>true} });
  assert.equal(engine.state.keys.KeyW, undefined);
});
test('muting remains reversible', () => {
  const {engine,element} = fixture();
  engine.audioContext = { state:'running', suspend() {this.state='suspended';}, resume() {this.state='running';} };
  engine.toggleMute();
  assert.equal(engine.muted,true);
  assert.equal(element('muteBtn').attributes['aria-pressed'],'true');
  engine.toggleMute();
  assert.equal(engine.muted,false);
  assert.equal(engine.audioContext.state,'running');
});
test('starting again does not create another animation loop', () => {
  const {engine} = fixture();
  let calls=0;
  engine.clock={getDelta:()=>0};
  engine.animate=()=>{calls++;engine.animationFrame=1;};
  engine.startLoop();engine.startLoop();
  assert.equal(calls,1);
});
test('hidden pages and open dialogs pause simulation', () => {
  const {engine,context,element} = fixture();
  engine.clock={getDelta:()=>0.016};
  engine.updateMovement=()=>{throw Error('simulation should be paused');};
  context.document.hidden=true;
  engine.animate();
  context.document.hidden=false;
  element('destinationsDialog').open=true;
  engine.animate();
  assert.equal(engine.state.time,0);
});
test('lost input is cleared, including touch steering and boost', () => {
  const {engine} = fixture();
  engine.state.keys.KeyW=true;
  engine.state.input={throttle:1,steer:1,boost:true};
  engine.resetInput();
  assert.equal(Object.keys(engine.state.keys).length,0);
  assert.equal(engine.state.input.throttle,0);
  assert.equal(engine.state.input.steer,0);
  assert.equal(engine.state.input.boost,false);
});
test('markup has unique IDs and permits browser zoom', () => {
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  assert.ok(!html.includes('user-scalable=no'));
  assert.ok(html.includes('</main>'));
  assert.ok(!source.includes("btn.id = 'muteBtn'"));
});
