import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';

const container = document.getElementById('aurora-background');

if (!container) {
  console.warn('Aurora background container not found.');
} else if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x02030a, 1);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  };

  const geometry = new THREE.PlaneGeometry(2, 2);

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;

      varying vec2 vUv;

      uniform vec2 u_resolution;
      uniform float u_time;

      vec4 permute(vec4 x) {
        return mod(((x * 34.0) + 1.0) * x, 289.0);
      }

      vec4 taylorInvSqrt(vec4 r) {
        return 1.79284291400159 - 0.85373472095314 * r;
      }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod(i, 289.0);
        vec4 p = permute(
          permute(
            permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0)
          )
          + i.x + vec4(0.0, i1.x, i2.x, 1.0)
        );

        float n_ = 1.0 / 7.0;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

        vec3 g0 = vec3(a0.xy, h.x);
        vec3 g1 = vec3(a0.zw, h.y);
        vec3 g2 = vec3(a1.xy, h.z);
        vec3 g3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(g0, g0), dot(g1, g1), dot(g2, g2), dot(g3, g3)));
        g0 *= norm.x;
        g1 *= norm.y;
        g2 *= norm.z;
        g3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m * m, vec4(dot(g0, x0), dot(g1, x1), dot(g2, x2), dot(g3, x3)));
      }

      vec3 aurora(vec2 uv) {
        vec2 p = uv;
        p.x *= u_resolution.x / u_resolution.y;
        float t = u_time * 0.07;

        float band = snoise(vec3(p.x * 1.4, p.y * 1.2 + t * 1.5, t));
        float flow = snoise(vec3(p.x * 2.4 - t * 0.6, p.y * 1.8, t * 0.5));
        float shimmer = snoise(vec3(p.x * 6.0 + t * 0.25, p.y * 6.0 - t, t));

        float intensity = smoothstep(0.1, 0.7, band * 0.65 + flow * 0.35);
        float curtain = smoothstep(0.2, 0.9, 1.0 - abs(p.y - 0.55)) * 0.9;
        float glow = pow(max(intensity, 0.0), 2.2) + shimmer * 0.12;

        vec3 base = vec3(0.02, 0.05, 0.12);
        vec3 hueA = vec3(0.1, 0.55, 0.9);
        vec3 hueB = vec3(0.4, 0.9, 0.6);
        vec3 hueC = vec3(0.8, 0.9, 0.9);

        vec3 color = mix(base, hueA, glow * 0.8);
        color = mix(color, hueB, pow(glow, 1.6));
        color = mix(color, hueC, pow(glow, 3.2));

        color += vec3(0.02, 0.09, 0.14) * curtain * 0.35;
        color *= (0.6 + curtain * 0.4);

        return color;
      }

      void main() {
        vec2 uv = vUv;

        vec2 gradientUv = uv;
        float horizon = smoothstep(0.0, 0.25, gradientUv.y);
        vec3 sky = mix(vec3(0.006, 0.013, 0.035), vec3(0.02, 0.05, 0.12), horizon);

        vec3 light = aurora(uv);

        float stars = snoise(vec3(uv * vec2(u_resolution.x / u_resolution.y * 2.5, 3.5), u_time * 0.02));
        stars = smoothstep(0.6, 0.95, stars);
        stars *= smoothstep(0.2, 1.0, uv.y);

        vec3 color = sky + light;
        color += vec3(0.35, 0.4, 0.5) * stars * 0.12;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const clock = new THREE.Clock();

  function onResize() {
    const { innerWidth, innerHeight } = window;
    renderer.setSize(innerWidth, innerHeight);
    uniforms.u_resolution.value.set(innerWidth, innerHeight);
  }

  window.addEventListener('resize', onResize);

  function render() {
    uniforms.u_time.value = clock.getElapsedTime();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();
}
