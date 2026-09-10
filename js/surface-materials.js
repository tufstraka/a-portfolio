import * as THREE from 'three';

// Small, repeatable maps authored in code: no remote assets or texture downloads.
const cache = new Map();
const scanned={wood:'old_wood_floor',stone:'rock_01',terrain:'rocks_ground_02',road:'rocks_ground_02',bark:'bark_brown_01'};
export function surfaceMaterial(kind, renderer) {
  if (cache.has(kind)) return cache.get(kind);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const pixels = ctx.createImageData(256, 256);
  const base = {road:[145,147,143],wood:[157,110,65],bark:[117,92,65],terrain:[185,166,120], stone:[167,177,161], plaster:[227,218,192], rubber:[54,61,61],metal:[65,104,98],foliage:[95,132,67]}[kind];
  for(let y=0;y<256;y++) for(let x=0;x<256;x++) {
    const noise = Math.sin(x*127.1+y*311.7)*43758.5453;
    const grain = noise-Math.floor(noise)-.5;
    const value = kind==='wood' ? Math.sin(x*.24+Math.sin(y*Math.PI/128)*2)*12 + Math.sin(x*.91)*5+grain*12
      : kind==='rubber' ? ((x%32<5 || (y+Math.floor(x/32)*12)%48<6)?-16:5)+grain*8
      : Math.sin(x*Math.PI/32)*Math.cos(y*Math.PI/32)*5+grain*(kind==='stone'?24:12);
    const i=(y*256+x)*4;
    for(let c=0;c<3;c++)pixels.data[i+c]=base[c]+value;
    pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  if(kind==='wood') {ctx.fillStyle='#60452c';for(let x=0;x<256;x+=64)ctx.fillRect(x,0,2,256);}
  if(kind==='metal') {
    ctx.fillStyle='#d4b85a';for(const y of [40,184])ctx.fillRect(0,y,256,12);
    ctx.fillStyle='#384f4a';for(let i=0;i<110;i++){const x=(i*73)%256,y=(i*97)%256;ctx.fillRect(x,y,1+i%7,1);}
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  // Color data and height data use different color-space interpretations.
  const height=map.clone();height.colorSpace=THREE.NoColorSpace;height.needsUpdate=true;
  const material=new THREE.MeshStandardMaterial({map,bumpMap:height,bumpScale:kind==='stone'?.10:kind==='foliage'?.012:.035,roughness:kind==='rubber'?.92:kind==='metal'?.67:.83,metalness:kind==='metal'?.22:0});
  material.userData.sharedSurface=true;cache.set(kind,material);
  if(kind==='road'){
    material.onBeforeCompile=s=>{
      s.vertexShader=s.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
        vec2 roadUv=(modelMatrix*vec4(position,1.)).xz*.28;
        #ifdef USE_MAP
        vMapUv=roadUv;
        #endif
        #ifdef USE_NORMALMAP
        vNormalMapUv=roadUv;
        #endif
        #ifdef USE_ROUGHNESSMAP
        vRoughnessMapUv=roadUv;
        #endif`);
      s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=vec3(dot(diffuseColor.rgb,vec3(.299,.587,.114)))*vec3(.88,.94,1.);');
    };material.customProgramCacheKey=()=> 'gravel-world-uv-v1';
  }
  if(scanned[kind]){
    const loader=new THREE.TextureLoader();
    // Keep the procedural fallback until each local scan is decoded successfully.
    const load=(suffix,slot,colorSpace)=>loader.load(new URL(`./textures/${scanned[kind]}-${suffix}.webp`,document.baseURI).href,t=>{
      t.colorSpace=colorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
      if(kind==='terrain')t.repeat.set(200,200);
      const previous=material[slot];material[slot]=t;if(previous&&previous!==material.bumpMap)previous.dispose();
      if(slot==='normalMap'){material.normalScale.set(.55,.55);material.bumpMap?.dispose();material.bumpMap=null;}
      if(slot==='roughnessMap')material.roughness=1;
      material.needsUpdate=true;
    },undefined,()=>{});
    load('Diffuse','map',THREE.SRGBColorSpace);load('nor_gl','normalMap',THREE.NoColorSpace);load('Rough','roughnessMap',THREE.NoColorSpace);
  }
  return material;
}

