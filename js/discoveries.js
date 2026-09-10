import * as THREE from 'three';
const experiments={
  fixflow:{title:'FixFlow workshop',label:'A build becomes a bounty',description:'A fictional illustration of a CI payout workflow. No real payment is sent.',choices:['Run the build'],result:'Build passed → payout queued → receipt recorded. FixFlow connects CI outcomes with MNEE stablecoin bounty payouts.'},
  security:{title:'Security lab',label:'Who gets through the door?',description:'A fictional API accepts a user ID from the browser. Where should authorization be enforced?',choices:['In the browser','On the server, for every request','Only at sign-in'],correct:1,result:'Exactly. Verify the authenticated identity and its permission to the requested resource on every request.'},
  radio:{title:'Signal found',label:'Tune into the world',description:'A jazz recording and a built-in synth soundtrack live here. Open Radio in your cockpit to choose.',choices:['Unlock the signal'],result:'Signal logged. Local Forecast and Lo-fi Circuit are available from the Radio button.'}
};
export class Discoveries{
 constructor(e){this.engine=e;this.found=new Set();try{this.found=new Set(JSON.parse(localStorage.getItem('keith_discoveries_v1')||'[]'));}catch{}
 this.stops=[{id:'fixflow',x:14,z:-84,color:0xdcf572},{id:'security',x:83,z:-32,color:0x53bdb4},{id:'radio',x:-46,z:34,color:0xf39455}];
 const geo=new THREE.OctahedronGeometry(1.1);this.stops.forEach(s=>{s.mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:s.color,emissive:s.color,emissiveIntensity:.35,roughness:.45}));s.mesh.position.set(s.x,2,s.z);s.mesh.userData.dynamic=true;e.scene.add(s.mesh);});
 this.button=document.getElementById('discoveryAction');this.button.onclick=()=>this.open(this.near);
 document.getElementById('closeExperiment').onclick=()=>document.getElementById('experimentDialog').close();
 document.getElementById('experimentDialog').addEventListener('close',()=>document.getElementById('gameContainer').focus());
 this.refresh();
 }
 update(){const e=this.engine;this.near=null;
 for(const s of this.stops){s.mesh.position.y=2+(e.reducedMotion?0:Math.sin(e.state.time*1.5)*.3);s.mesh.rotation.y=e.reducedMotion?0:e.state.time*.4;
 if(Math.hypot(e.car.position.x-s.x,e.car.position.z-s.z)<18)this.near=s;}
 this.button.hidden=!this.near;
 if(this.near)this.button.textContent=(this.found.has(this.near.id)?'Revisit: ':'Discover: ')+experiments[this.near.id].title;
 }
 open(stop){if(!stop)return;this.engine.resetInput();const ex=experiments[stop.id],dialog=document.getElementById('experimentDialog');
 document.getElementById('experimentTitle').textContent=ex.title;document.getElementById('experimentLabel').textContent=ex.label;
 document.getElementById('experimentDescription').textContent=ex.description;const result=document.getElementById('experimentResult');result.textContent='';
 const choices=document.getElementById('experimentChoices');choices.replaceChildren();
 ex.choices.forEach((text,i)=>{const b=document.createElement('button');b.textContent=text;b.onclick=()=>{
 if(ex.correct!==undefined&&i!==ex.correct){result.textContent='Try again. Client-side checks can be bypassed, and permissions can change after sign-in.';return;}
 result.textContent=ex.result;if(!this.found.has(stop.id)){this.found.add(stop.id);try{localStorage.setItem('keith_discoveries_v1',JSON.stringify([...this.found]));}catch{}this.engine.playUiTone?.();this.refresh();}
 };choices.appendChild(b);});dialog.showModal();
 }
 refresh(){document.getElementById('discoveryCount').textContent=`${this.found.size} / 3 FIELD NOTES`;}
}
