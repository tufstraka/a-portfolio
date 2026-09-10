export function speedAngle(kmh){return -130+Math.min(240,Math.max(0,Math.abs(kmh)))/240*260;}
export function setupRacingHud(engine){
 const meter=document.getElementById('speedDisplay');
 const polar=(a,r)=>[110+Math.sin(a*Math.PI/180)*r,110-Math.cos(a*Math.PI/180)*r];
 let ticks='';for(let n=0;n<=24;n++){const a=-130+n*260/24,p=polar(a,90),q=polar(a,n%4===0?79:85);ticks+=`<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" class="${n>=20?'redline':''}"/>`;if(n%4===0){const t=polar(a,67);ticks+=`<text x="${t[0]}" y="${t[1]+3}">${n*10}</text>`;}}
 const a=polar(-130,97),b=polar(130,97),path=`M ${a} A 97 97 0 1 1 ${b}`;
 meter.innerHTML=`<svg viewBox="0 0 220 220" aria-hidden="true"><path d="${path}" class="gauge-track"/><path d="${path}" class="gauge-fill" pathLength="100" id="speedArc"/><g class="gauge-ticks">${ticks}</g><g id="speedNeedle"><path d="M 107 108 L 110 27 L 113 108 Z"/><circle cx="110" cy="110" r="5"/></g></svg><div class="gauge-center"><span id="driveMode">N</span><strong class="speed-value" id="speedValue">0</strong><span class="speed-unit">KM/H</span></div><div class="drive-flags"><span id="speedBoost" style="display:none">BOOST</span><span id="speedAirborne" style="display:none">AIR</span><span id="driveLabel">TRAIL / 07</span></div>`;
 meter.setAttribute('role','meter');meter.setAttribute('aria-label','Speed in kilometers per hour');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','240');
 const compass=document.createElement('div');compass.className='heading-compass';compass.innerHTML='<span class="compass-label">HEADING</span><strong id="headingValue">N</strong><span class="compass-marker">◆</span>';document.body.append(compass);
 let last=-1;
 engine.updateRacingHud=()=>{const p=engine.vehiclePhysics;if(!p)return;const speed=Math.abs(p.speedKmh ?? p.speed*3.6);document.getElementById('speedNeedle').style.transform=`rotate(${speedAngle(speed)}deg)`;document.getElementById('speedArc').style.strokeDasharray=`${Math.min(speed/240*100,100)} 100`;document.getElementById('driveMode').textContent=Math.abs(p.speed)<.3?'N':p.speed<0?'R':'D';meter.classList.toggle('is-boosting',engine.state.isBoosting);document.getElementById('driveLabel').hidden=engine.state.isBoosting||engine.state.isAirborne;
  const value=Math.round(speed);if(value!==last){meter.setAttribute('aria-valuenow',String(Math.min(value,240)));last=value;}
  const degrees=((p.rotation*180/Math.PI+180)%360+360)%360;document.getElementById('headingValue').textContent=['N','NE','E','SE','S','SW','W','NW'][Math.round(degrees/45)%8]+' '+Math.round(degrees).toString().padStart(3,'0')+'°';
 };
 engine.updateRacingHud();
}
