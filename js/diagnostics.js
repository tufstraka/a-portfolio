export class Diagnostics{
 constructor(){this.frames=[];this.last=0;this.started=performance.now();this.ready=null;this.events={};}
 frame(ms,renderer){this.frames.push(ms);if(this.frames.length>600)this.frames.shift();this.drawCalls=renderer.info.render.calls;this.triangles=renderer.info.render.triangles;this.textures=renderer.info.memory.textures;this.geometries=renderer.info.memory.geometries;}
 record(name){this.events[name]=(this.events[name]||0)+1;}
 snapshot(){const f=[...this.frames].sort((a,b)=>a-b);return{frames:f.length,p50:f[Math.floor(f.length*.5)]||0,p95:f[Math.floor(f.length*.95)]||0,drawCalls:this.drawCalls,triangles:this.triangles,textures:this.textures,geometries:this.geometries,events:{...this.events}};}
}
