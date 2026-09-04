import * as THREE from 'three'

const LIMIT = 0.5
const SINK = 0.012

const VERTEX = `
  #include <common>
  #include <fog_pars_vertex>
  uniform float thickness;
  void main() {
    vec3 pos = position;
    vec3 nor = normal;
    float wide = thickness;
    #ifdef USE_INSTANCING
      mat3 base = mat3(instanceMatrix);
      vec3 scale = vec3(length(base[0]), length(base[1]), length(base[2]));
      pos = (instanceMatrix * vec4(pos, 1.0)).xyz;
      nor = base * (nor / max(scale * scale, vec3(0.0001)));
    #else
      float sx = length(modelMatrix[0].xyz);
      float sy = length(modelMatrix[1].xyz);
      float sz = length(modelMatrix[2].xyz);
      wide = min(wide, min(min(sx, sy), sz) * ${LIMIT.toFixed(3)});
    #endif
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vec3 view = normalize(normalMatrix * nor);
    vec2 dir = view.xy;
    float lat = length(dir);
    if (lat > 0.002) {
      float force = min(lat / 0.34, 1.0);
      mvPosition.xy += (dir / lat) * (wide * force);
    }
    mvPosition.z -= ${SINK.toFixed(3)};
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`

const FRAGMENT = `
  #include <common>
  #include <fog_pars_fragment>
  uniform vec3 tint;
  uniform float alpha;
  void main() {
    gl_FragColor = vec4(tint, alpha);
    #include <fog_fragment>
  }`

const hidden = new Map()

export function outlineMaterial(thickness) {
  const key = thickness.toFixed(3)
  let m = hidden.get(key)
  if (m) return m
  m = new THREE.ShaderMaterial({
    uniforms: {
      thickness: { value: thickness },
      tint: { value: new THREE.Color(0x05070b) },
      alpha: { value: 1 },
      ...THREE.UniformsLib.fog,
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    side: THREE.BackSide,
  })
  m.fog = true
  hidden.set(key, m)
  return m
}

export const CREATURE_OUTLINE = 0.09
export const SHOT_OUTLINE = 0.075
export const OUTLINE_FLOOR = 0.07

export function creatureOutline(size) {
  return Math.max(OUTLINE_FLOOR, Math.min(CREATURE_OUTLINE, CREATURE_OUTLINE * size))
}
