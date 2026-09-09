export function setupRadioMenu(engine){
 const dialog=document.getElementById('radioDialog'),status=document.getElementById('radioStatus'),button=document.getElementById('radioControl');
 const audio=new Audio();audio.preload='none';audio.loop=true;engine.musicAudio=audio;let request=0;
 const stop=()=>{request++;audio.pause();engine.musicWanted=false;clearInterval(engine.radioInterval);engine.radioInterval=null;try{engine.radioOsc?.stop();}catch{}engine.radioStation=0;button.textContent='Radio';};
 const sync=()=>{audio.muted=!!engine.muted;audio.volume=Number(document.getElementById('volumeControl').value)/100*.55;};
 engine.syncMusic=sync;
 const play=async()=>{const token=++request;sync();try{await audio.play();if(token!==request)return;status.textContent='Playing · Local Forecast';button.textContent='♫ Radio';}catch{if(token!==request)return;engine.musicWanted=false;status.textContent='Unable to play. Try again, or choose a built-in station.';}};
 document.getElementById('radioRecorded').onclick=()=>{stop();engine.musicWanted=true;if(!audio.src)audio.src=new URL('./audio/local-forecast.mp3',document.baseURI).href;play();};
 document.getElementById('radioStop').onclick=()=>{stop();status.textContent='Radio off';};
 document.getElementById('radioSynth').onclick=()=>{stop();if(engine.muted)engine.toggleMute();engine.audioContext?.resume();engine.cycleRadio();status.textContent='Playing · Lo-fi Circuit';};
 document.getElementById('closeRadio').onclick=()=>dialog.close();
 engine.openRadio=()=>{engine.resetInput();dialog.showModal();};button.onclick=engine.openRadio;
 dialog.addEventListener('close',()=>document.getElementById('gameContainer').focus());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.pause();else if(engine.musicWanted)play();});
 audio.addEventListener('error',()=>{engine.musicWanted=false;status.textContent='Music unavailable. Try the built-in station.';});
 document.getElementById('closeSettings').onclick=()=>document.getElementById('settingsBtn').click();
 document.getElementById('destinationsDialog').append(document.getElementById('comboHud'));
 const panel=document.getElementById('settingsPanel');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Your experience');
 const advanced=document.createElement('details');advanced.className='advanced-settings';const summary=document.createElement('summary');summary.textContent='Graphics & performance';advanced.append(summary);
 advanced.append(document.getElementById('qualitySelect').closest('.settings-group'),document.getElementById('effectsSelect').closest('.settings-group'),document.querySelector('.performance-details'));
 panel.append(advanced,document.getElementById('resetCar'));
 const siblings=[...document.body.children].filter(el=>el!==panel);let priorFocus;
 new MutationObserver(()=>{const open=panel.classList.contains('active');siblings.forEach(el=>el.inert=open);if(open){priorFocus=document.activeElement;document.getElementById('closeSettings').focus();}else priorFocus?.focus();}).observe(panel,{attributes:true,attributeFilter:['class']});
 panel.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const nodes=[...panel.querySelectorAll('button,input,select,summary')].filter(el=>el.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
}

