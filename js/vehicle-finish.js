export function dirtFinish(material, uniforms, wheel = false) {
    material.onBeforeCompile = shader => {
        shader.uniforms.trailMud = uniforms.mud;
        shader.uniforms.trailSand = uniforms.sand;
        shader.vertexShader = 'varying vec3 trailPosition;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntrailPosition=position;');
        shader.fragmentShader = 'varying vec3 trailPosition; uniform float trailMud; uniform float trailSand;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
          float speck=fract(sin(dot(floor(trailPosition.xz*38.+trailPosition.y*17.),vec2(12.9898,78.233)))*43758.5453);
          float lower=${wheel ? '1.' : '1.-smoothstep(.45,1.35,trailPosition.y+speck*.35)'};
          float dirtCoverage=lower*clamp(trailMud+trailSand*.7,0.,.88)*smoothstep(.13,.65,speck);
          vec3 trailColor=mix(vec3(.38,.25,.11),vec3(.10,.055,.026),trailMud/(trailMud+trailSand+.001));
          diffuseColor.rgb=mix(diffuseColor.rgb,trailColor,dirtCoverage);`);
    };
    material.customProgramCacheKey = () => 'trail-dirt-' + wheel;
    return material;
}
