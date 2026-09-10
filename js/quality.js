export const QUALITY = {
 low:{pixelRatio:1,shadows:false,shadowSize:512,post:false,distance:180},
 medium:{pixelRatio:1.25,shadows:true,shadowSize:512,post:false,distance:250},
 high:{pixelRatio:1.5,shadows:true,shadowSize:1024,post:true,distance:350},
 ultra:{pixelRatio:1.75,shadows:true,shadowSize:1024,post:true,distance:450}
};
export function applyQuality(engine,level){
 const q=QUALITY[level];if(!q)return;
 engine.state.quality=level;const ratio=Math.min(window.devicePixelRatio||1,q.pixelRatio);
 engine.environment?.grass.setQuality(level);
 engine.renderer.setPixelRatio(ratio);engine.composer.setPixelRatio(ratio);
 engine.renderer.shadowMap.enabled=q.shadows;
 if(engine.sunLight){engine.sunLight.castShadow=q.shadows;const shadow=engine.sunLight.shadow;
 if(shadow.camera){Object.assign(shadow.camera,{near:.5,far:400,left:-120,right:120,top:120,bottom:-120});shadow.camera.updateProjectionMatrix();shadow.bias=-.0001;shadow.normalBias=.03;}
 if(shadow.mapSize.x!==q.shadowSize){shadow.map?.dispose();shadow.map=null;shadow.mapSize.set(q.shadowSize,q.shadowSize);}engine.renderer.shadowMap.needsUpdate=true;}
 // Keep the sky inside the far plane; distance culling handles world detail.
 engine.camera.far=1200;engine.camera.updateProjectionMatrix();engine.viewDistance=q.distance;
 engine.useComposer=q.post;
 if(engine.bloomPass)engine.bloomPass.enabled=q.post&&engine.effectsLevel!=='minimal';
 if(engine.colorGradingPass)engine.colorGradingPass.enabled=q.post;
 for(const name of ['filmGrainPass','motionBlurPass','vignettePass'])if(engine[name])engine[name].enabled=false;
 document.getElementById('qualitySelect').value=level;
}
