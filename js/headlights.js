import * as THREE from 'three';
export function lampsEnabled(mode,dayTime){return mode==='on'||(mode==='auto'&&(dayTime<.28||dayTime>.72));}
export class Headlights {
 constructor(engine){
  this.engine=engine;this.mode='auto';this.level=0;this.lights=[];
  try{const saved=localStorage.getItem('keith_headlights');if(['auto','on','off'].includes(saved))this.mode=saved;}catch{}
  for(const side of [-1,1]){
   const lamp=new THREE.SpotLight(0xffefd2,0,65,.36,.65,2);lamp.position.set(side*.7,1,2.18);
   lamp.target.position.set(side*1.8,-.45,30);lamp.shadow.mapSize.set(512,512);lamp.shadow.bias=-.00015;lamp.shadow.normalBias=.03;lamp.shadow.camera.near=.2;
   engine.car.add(lamp,lamp.target);this.lights.push(lamp);
  }
 }
 attachControls(){
  const group=document.createElement('div');group.className='settings-group';
  const label=document.createElement('label');label.className='settings-label';label.htmlFor='headlightMode';label.textContent='Headlights · L';
  const select=document.createElement('select');select.id='headlightMode';for(const [value,text] of [['auto','Auto · dusk to dawn'],['on','On'],['off','Off']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}select.value=this.mode;select.onchange=()=>this.setMode(select.value);group.append(label,select);document.getElementById('settingsPanel').append(group);this.select=select;
  const status=document.createElement('span');status.id='headlightStatus';status.className='headlight-status';status.textContent='LAMPS / AUTO';document.getElementById('speedDisplay').append(status);this.status=status;
 }
 setMode(mode){if(!['auto','on','off'].includes(mode))return;this.mode=mode;if(this.select)this.select.value=mode;try{localStorage.setItem('keith_headlights',mode);}catch{}this.engine.showToast?.('light','Headlights',mode==='auto'?'Automatic at dusk':mode==='on'?'Lights on':'Lights off');}
 cycle(){this.setMode({auto:'on',on:'off',off:'auto'}[this.mode]);}
 update(delta){
  const enabled=lampsEnabled(this.mode,this.engine.dayTime??.5);this.level+=(Number(enabled)-this.level)*(1-Math.exp(-Math.max(0,Math.min(delta,.1))*12));
  const shadows=['high','ultra'].includes(this.engine.state.quality);
  this.lights.forEach((lamp,i)=>{lamp.intensity=this.level*850;lamp.visible=this.level>.002;lamp.castShadow=shadows&&i===0;});
  const lens=this.engine.car.userData.headlightMaterial;if(lens)lens.emissiveIntensity=.03+this.level*2.5;
  if(this.status){const label=`LAMPS / ${this.mode.toUpperCase()}`;if(this.status.textContent!==label)this.status.textContent=label;this.status.classList.toggle('lit',enabled);}
 }
}
