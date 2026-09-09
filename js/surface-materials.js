import * as THREE from 'three';

// Small, repeatable maps authored in code: no remote assets or texture downloads.
const cache = new Map();
export function surfaceMaterial(kind, renderer) {
  if (cache.has(kind)) return cache.get(kind);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const pixels = ctx.createImageData(256, 256);
  const base = {wood:[157,110,65], stone:[167,177,161], plaster:[227,218,192], rubber:[54,61,61],metal:[65,104,98],foliage:[95,132,67]}[kind];
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
  material.userData.sharedSurface=true;cache.set(kind,material);return material;
}

