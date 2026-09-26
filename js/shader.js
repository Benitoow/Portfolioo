/* Reflets de lumière partagés par l'accueil et les études de cas. */
(() => {
  const canvas = document.querySelector(".shader-canvas");
  if (!canvas) return;

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
  });
  if (!gl) return;

  const vertexSource = `
    attribute vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `;
  const fragmentSource = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform vec2 u_pointer;
    uniform vec3 u_tint;
    uniform float u_time;
    uniform float u_scroll;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      vec2 p = vec2(uv.x * u_resolution.x / u_resolution.y, uv.y);
      float drift = u_time * 0.012 + u_scroll * 0.18;
      float field = noise(p * 1.8 + vec2(drift, -drift * 0.5));
      float detail = noise(p * 4.2 - vec2(drift * 0.45, drift * 0.3));
      float haze = smoothstep(0.25, 0.8, field) * 0.075;
      float ambient = exp(-length((uv - vec2(0.78, 0.68)) * vec2(1.2, 1.5)) * 3.8) * 0.055;
      vec2 pointer = vec2(u_pointer.x * u_resolution.x / u_resolution.y, u_pointer.y);
      float halo = exp(-length((p - pointer) * vec2(1.0, 1.35)) * 5.0) * 0.018;
      float grain = (hash(gl_FragCoord.xy * 0.45 + floor(u_time * 5.0)) - 0.5) * 0.023;
      float alpha = clamp(haze + ambient + halo + detail * 0.013 + grain, 0.0, 0.14);
      vec3 color = mix(u_tint, vec3(0.35, 0.41, 0.36), field * 0.32);
      gl_FragColor = vec4(color, alpha);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  gl.useProgram(program);
  const position = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, "u_resolution");
  const pointer = gl.getUniformLocation(program, "u_pointer");
  const tint = gl.getUniformLocation(program, "u_tint");
  const time = gl.getUniformLocation(program, "u_time");
  const scroll = gl.getUniformLocation(program, "u_scroll");
  const rgb = getComputedStyle(document.body).getPropertyValue("--shader-rgb").trim()
    .split(/[\s,]+/).map(Number);
  gl.uniform3f(tint, ...((rgb.length === 3 && rgb.every(Number.isFinite) ? rgb : [242, 201, 76]).map((value) => value / 255)));

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = navigator.connection?.saveData;
  let pointerX = 0.5;
  let pointerY = 0.5;
  let scrollProgress = 0;
  let frame = null;
  let lastDraw = -Infinity;

  function resize() {
    const scale = Math.min(window.devicePixelRatio || 1, 1.25,
      Math.sqrt(1200000 / (window.innerWidth * window.innerHeight)));
    canvas.width = Math.max(1, Math.round(window.innerWidth * scale));
    canvas.height = Math.max(1, Math.round(window.innerHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    draw(performance.now());
  }

  function draw(now) {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform2f(pointer, pointerX, pointerY);
    gl.uniform1f(time, motion.matches || saveData ? 0 : now / 1000);
    gl.uniform1f(scroll, scrollProgress);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    canvas.classList.add("is-ready");
  }

  function tick(now) {
    frame = null;
    if (now - lastDraw >= 32) {
      draw(now);
      lastDraw = now;
    }
    if (!motion.matches && !saveData && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function start() {
    if (frame === null && !motion.matches && !saveData && !document.hidden) {
      frame = requestAnimationFrame(tick);
    } else if (motion.matches || saveData) {
      draw(0);
    }
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", () => {
    const extent = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = extent > 0 ? window.scrollY / extent : 0;
    if (motion.matches || saveData) draw(0);
  }, { passive: true });
  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX / window.innerWidth;
    pointerY = 1 - event.clientY / window.innerHeight;
  }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    } else if (!document.hidden) start();
  });
  motion.addEventListener?.("change", () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    start();
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    canvas.classList.remove("is-ready");
  });
  resize();
  start();
})();
