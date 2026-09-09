export function setupTouchInput(engine){
 const joystick=document.getElementById('joystick'),inner=document.getElementById('joystickInner');let pointer=null;
 engine.touchInput={throttle:0,brake:0,steer:0};
 const move=e=>{if(e.pointerId!==pointer)return;const r=joystick.getBoundingClientRect(),max=r.width*.32;let x=(e.clientX-r.left-r.width/2)/max,y=(e.clientY-r.top-r.height/2)/max;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
 engine.touchInput={throttle:Math.max(0,-y),brake:Math.max(0,y),steer:-x};inner.style.transform=`translate(calc(-50% + ${x*max}px),calc(-50% + ${y*max}px))`;};
 const reset=()=>{pointer=null;engine.touchInput={throttle:0,brake:0,steer:0};inner.style.transform='translate(-50%,-50%)';};
 joystick.onpointerdown=e=>{if(engine.isInterfaceOpen())return;e.preventDefault();pointer=e.pointerId;joystick.setPointerCapture(pointer);move(e);};joystick.onpointermove=move;joystick.onpointerup=reset;joystick.onpointercancel=reset;joystick.onlostpointercapture=reset;
 const bind=(id,key)=>{const button=document.getElementById(id);const release=()=>engine.state.keys[key]=false;button.onpointerdown=e=>{if(engine.isInterfaceOpen())return;e.preventDefault();button.setPointerCapture(e.pointerId);engine.state.keys[key]=true;};button.onpointerup=release;button.onpointercancel=release;button.onlostpointercapture=release;};
 bind('mobileBoost','ShiftLeft');bind('mobileJump','KeyJ');
 document.getElementById('mobileAction').onpointerdown=e=>{e.preventDefault();if(engine.state.currentSection&&!engine.isInterfaceOpen())engine.openModal(engine.state.currentSection.userData);};
 window.addEventListener('blur',reset);
}
