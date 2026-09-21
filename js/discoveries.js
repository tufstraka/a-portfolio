import * as THREE from 'three';
import {WORKSHOPS,WorkshopRun} from './workshops.js';
export class Discoveries{
 constructor(e){
  this.engine=e;this.found=new Set();try{const saved=JSON.parse(localStorage.getItem('keith_discoveries_v1')||'[]');if(Array.isArray(saved))this.found=new Set(saved.filter(id=>['fixflow','security','radio'].includes(id)));}catch{}
  this.stops=[{id:'fixflow',x:14,z:-84,color:0xe5b875},{id:'security',x:83,z:-32,color:0x8cccd4},{id:'radio',x:-46,z:34,color:0xe5b875}];
  this.stops.forEach(s=>{
   const terminal=new THREE.Group();terminal.position.set(s.x,0,s.z);
   const body=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.4,.7),new THREE.MeshStandardMaterial({color:0x243739,metalness:.45,roughness:.5}));body.position.y=1.2;body.castShadow=true;terminal.add(body);
   const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.18,.75),new THREE.MeshStandardMaterial({color:s.color,emissive:s.color,emissiveIntensity:.5,roughness:.35}));screen.position.set(0,1.32,.36);terminal.add(screen);
   const stand=new THREE.Mesh(new THREE.CylinderGeometry(.18,.3,.8,8),body.material);stand.position.y=.4;terminal.add(stand);
   s.mesh=screen;e.scene.add(terminal);e.collisionSystem.addTree({x:s.x,z:s.z},.8,2);
  });
  this.button=document.getElementById('discoveryAction');this.button.onclick=()=>this.open(this.near);
  const dialog=document.getElementById('experimentDialog');
  document.getElementById('closeExperiment').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{this.run=null;document.getElementById('gameContainer').focus();});
  document.getElementById('experimentResult').setAttribute('role','status');
  const launch=document.createElement('button');launch.className='workshop-launch';launch.textContent='Play the workshops';launch.onclick=()=>{document.getElementById('destinationsDialog').close();this.openHub();};document.getElementById('destinationsDialog').append(launch);
  this.refresh();
 }
 update(){const e=this.engine;this.near=null;let distance=12;
  for(const s of this.stops){s.mesh.material.emissiveIntensity=this.found.has(s.id)?.18:.45;const d=Math.hypot(e.car.position.x-s.x,e.car.position.z-s.z);if(d<distance){distance=d;this.near=s;}}
  this.button.hidden=!this.near;if(this.near)this.button.textContent='F / '+(this.near.id==='radio'?'Tune the radio':WORKSHOPS[this.near.id].title);
 }
 prepare(title,label,description){
  this.engine.resetInput();document.getElementById('experimentTitle').textContent=title;document.getElementById('experimentLabel').textContent=label;document.getElementById('experimentDescription').textContent=description;
  document.getElementById('experimentChoices').replaceChildren();document.getElementById('experimentResult').textContent='';
  const dialog=document.getElementById('experimentDialog');if(!dialog.open)dialog.showModal();
 }
 action(label,handler){const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=handler;document.getElementById('experimentChoices').append(button);return button;}
 openHub(){this.prepare('FIELD WORK / INTERACTIVE LABS','Learn by doing.','Two short challenges. No timer, no pressure. Complete every stage to earn a field note.');for(const [id,workshop] of Object.entries(WORKSHOPS))this.action(workshop.label+(this.found.has(id)?' / Completed':''),()=>this.open({id}));}
 open(stop){if(!stop)return;
  if(stop.id==='radio'){this.complete('radio');this.engine.openRadio();return;}
  this.run=new WorkshopRun(stop.id);const workshop=WORKSHOPS[stop.id];this.prepare(workshop.title,workshop.label,workshop.description);this.renderStage();
 }
 renderStage(){
  const run=this.run,workshop=WORKSHOPS[run.id],choices=document.getElementById('experimentChoices');choices.replaceChildren();
  const progress=document.createElement('div');progress.className='workshop-progress';progress.setAttribute('aria-label',`Stage ${run.index+1} of ${workshop.stages.length}`);
  workshop.stages.forEach((_,i)=>{const segment=document.createElement('span');segment.className=i<run.index?'done':i===run.index?'current':'';segment.textContent=String(i+1).padStart(2,'0');progress.append(segment);});choices.append(progress);
  const prompt=document.createElement('h3');prompt.className='workshop-prompt';prompt.tabIndex=-1;prompt.textContent=run.stage.prompt;choices.append(prompt);
  run.stage.choices.forEach((label,i)=>this.action(label,()=>{
   const outcome=run.choose(i),result=document.getElementById('experimentResult');result.textContent=outcome.message;result.dataset.state=outcome.correct?'success':'retry';if(!outcome.correct)return;
   choices.querySelectorAll('button').forEach(button=>button.disabled=true);
   if(outcome.complete){this.complete(run.id);choices.querySelectorAll('button').forEach(button=>button.remove());progress.querySelectorAll('span').forEach(segment=>segment.className='done');progress.setAttribute('aria-label','All stages complete');prompt.textContent='Challenge complete';this.action('Replay challenge',()=>this.open({id:run.id}));this.action('Choose another workshop',()=>this.openHub());const stats=document.createElement('p');stats.className='workshop-summary';stats.textContent=`All ${workshop.stages.length} stages complete / ${run.mistakes===0?'Clean run':run.mistakes+(run.mistakes===1?' retry':' retries')+' — lesson learned'}`;choices.append(stats);}
   else this.action('Next stage',()=>{result.textContent='';this.renderStage();document.querySelector('.workshop-prompt').focus();}).focus();
  }));
 }
 complete(id){if(!this.found.has(id)){this.found.add(id);try{localStorage.setItem('keith_discoveries_v1',JSON.stringify([...this.found]));}catch{}this.engine.playUiTone?.();this.refresh();}}
 refresh(){document.getElementById('discoveryCount').textContent=`${this.found.size} / 3 FIELD NOTES`;}
}
