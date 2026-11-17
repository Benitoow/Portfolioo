/* ===== LIVE ORB — MOTEUR WEBGL + COMPAGNON KODAK EXPRESSIF ===== */
/* Portage vanilla JS du composant LiveOrb, verrouillé en couleur Kodak (#F2C94C),
   doté d'émotions GLSL avancées (joie, surprise, concentrée, curieuse, clin
   d'œil, étourdie en spirales, endormie avec Zzz, réflexion, rougissement,
   malicieux, émerveillé, cœur, terminal >_, sursaut, sueur) et d'optimisations perf. */
(() => {
  const WHITE = { color: "#F4F4F5", eyeColor: "#09090B" };
  const BLACK = { color: "#18181B", eyeColor: "#F4F4F5" };
  const KODAK = { color: "#F2C94C", eyeColor: "#1E1B18" };
  const CUSTOM_DEFAULT = KODAK;
  const WEBGL_COLORS = ["#7C6AF7", "#7DD3C7", "#E8B4D4"];

  const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

  // Shader allégé dédié au rendu Kodak (zéro fbm/bruit inutile en runtime)
  const FRAG_KODAK = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_look;
uniform float u_blinkL;
uniform float u_blinkR;
uniform float u_winkL;
uniform float u_winkR;
uniform float u_happy;
uniform float u_surprise;
uniform float u_squint;
uniform float u_curious;
uniform float u_sleepy;
uniform float u_dizzy;
uniform float u_blush;
uniform float u_smug;
uniform float u_star;
uniform float u_love;
uniform float u_code;
uniform float u_startled;
uniform float u_sweat;
uniform vec3 u_body;
uniform vec3 u_eye;

vec3 orient(vec3 p, vec2 look) {
  float yaw = look.x * 0.92;
  float pitch = -look.y * 0.78;
  float cy = cos(yaw);
  float sy = sin(yaw);
  float cp = cos(pitch);
  float sp = sin(pitch);
  vec3 q = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);
  return vec3(q.x * cy + q.z * sy, q.y, -q.x * sy + q.z * cy);
}

float eyeMask(
  vec3 n,
  vec3 e,
  vec3 right,
  vec3 up,
  float sideSign,
  float halfH,
  float rad,
  float happy,
  float wink,
  float squint,
  float sleepy,
  float dizzy,
  float smug,
  float star,
  float love,
  float code,
  float sweat,
  float t
) {
  float facing = dot(n, e);
  float x = dot(n, right) - dot(e, right);
  float y = dot(n, up) - dot(e, up);

  // Capsule standard (aussi rétrécie en petit point pour startled)
  float yc = y - clamp(y, -halfH, halfH);
  float dCap = length(vec2(x, yc)) - rad;

  // Arc joyeux (^ ^)
  float xArc = clamp(x, -0.095, 0.095);
  float yArc = 0.044 - 6.8 * xArc * xArc;
  float dHappy = length(vec2(x - xArc, y - yArc)) - 0.038;

  // Arc malicieux de clin d'œil (>)
  float xWink = clamp(x, -0.092, 0.092);
  float yWink = 0.036 - 0.58 * abs(xWink);
  float dWink = length(vec2(x - xWink, y - yWink)) - 0.032;

  // Paupière tombante courbée vers le bas pour la sieste
  float xSleep = clamp(x, -0.094, 0.094);
  float ySleep = -0.044 + 4.8 * xSleep * xSleep;
  float dSleep = length(vec2(x - xSleep, y - ySleep)) - 0.028;

  // Regard plat / gêné (- -) pour sweatdrop
  float xFlat = clamp(x, -0.082, 0.082);
  float dFlat = length(vec2(x - xFlat, y - 0.008)) - 0.025;

  float d = mix(dCap, dHappy, happy);
  d = mix(d, dSleep, sleepy);
  d = mix(d, dFlat, sweat);
  d = mix(d, dWink, wink);

  // Sourcil/paupière inclinée vers l'intérieur pour l'état concentré
  float inward = -x * sideSign;
  float browTop = 0.052 - 0.42 * inward;
  float browBot = -0.048 + 0.1 * inward;
  float squintMask =
    (1.0 - smoothstep(browTop - 0.012, browTop + 0.012, y)) *
    smoothstep(browBot - 0.012, browBot + 0.012, y);

  // Regard malicieux asymétrique (paupière gauche mi-close, droite légèrement arquée)
  float smugLid = mix(0.006, 0.044, step(0.0, sideSign)) - 0.18 * x;
  float smugMask = 1.0 - smoothstep(smugLid - 0.011, smugLid + 0.011, y);

  float baseFill = 1.0 - smoothstep(-0.01, 0.01, d);
  float noSpecial = (1.0 - wink) * (1.0 - happy);
  float focusedFill = baseFill * mix(1.0, squintMask, squint * noSpecial);
  focusedFill *= mix(1.0, smugMask, smug * noSpecial);

  // Mode terminal / Dev (>_ ) : chevron '>' à gauche, underscore '_' à droite
  vec2 ap = vec2(x, abs(y)) - vec2(0.068, 0.0);
  vec2 ab = vec2(-0.132, 0.084);
  float chevProj = clamp(dot(ap, ab) / dot(ab, ab), 0.0, 1.0);
  float dChev = length(ap - ab * chevProj) - 0.024;
  float xUnd = clamp(x, -0.08, 0.08);
  float dUnd = length(vec2(x - xUnd, y + 0.062)) - 0.024;
  float dCode = mix(dChev, dUnd, step(0.0, sideSign));
  float codeFill = 1.0 - smoothstep(-0.01, 0.01, dCode);

  // Yeux en étoile à 5 branches (starstruck)
  float r = length(vec2(x, y));
  float a = atan(y, x);
  float sa = a - 1.5707963;
  float starSec = abs(mod(sa / 1.256637 + 0.5, 1.0) * 2.0 - 1.0);
  float starR = mix(0.134, 0.064, starSec);
  float starFill = 1.0 - smoothstep(starR - 0.012, starR + 0.012, r);

  // Yeux en cœur (love)
  float hx = abs(x) * 9.2;
  float hy = (y + 0.032) * 9.2;
  float hVal = hx * hx + pow(hy - 0.78 * sqrt(max(hx, 0.0)), 2.0);
  float loveFill = 1.0 - smoothstep(0.62, 0.78, hVal);

  // Spirales tournantes (@ @) pour l'état étourdi (période exacte 2*PI / 11)
  float spin = r * 92.0 - a * sideSign + t * 11.0 * sideSign;
  float spiralBand = smoothstep(-0.22, 0.32, sin(spin));
  float orbDisk = 1.0 - smoothstep(0.108, 0.128, r);
  float centerPin = 1.0 - smoothstep(0.022, 0.036, r);
  float dizzyFill = max(spiralBand * orbDisk, centerPin);

  float fill = focusedFill;
  fill = mix(fill, codeFill, code * (1.0 - wink));
  fill = mix(fill, starFill, star * (1.0 - wink));
  fill = mix(fill, loveFill, love * (1.0 - wink));
  fill = mix(fill, dizzyFill, dizzy);
  return fill * smoothstep(0.12, 0.32, facing);
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  uv.x *= aspect;

  float radius = 0.94;
  vec2 p = uv / radius;
  float r2 = dot(p, p);
  float edge = 1.0 - smoothstep(0.985, 1.012, sqrt(max(r2, 0.0)));
  if (edge <= 0.001) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float z = sqrt(max(1.0 - r2, 0.0));
  vec3 n = normalize(vec3(p, z));

  vec2 look = u_look;
  float lm = length(look);
  if (lm > 1.0) look /= lm;

  vec3 right = orient(vec3(1.0, 0.0, 0.0), look);
  vec3 up = orient(vec3(0.0, 1.0, 0.0), look);

  vec2 wobbleL = vec2(0.035 * sin(u_time * 11.0), 0.03 * cos(u_time * 11.0)) * u_dizzy;
  vec2 wobbleR = vec2(-0.035 * cos(u_time * 11.0 + 0.7), 0.03 * sin(u_time * 11.0 + 0.7)) * u_dizzy;

  vec3 eL = orient(normalize(vec3(-0.32 + wobbleL.x, 0.08 + wobbleL.y, 1.0)), look);
  vec3 eR = orient(normalize(vec3(0.32 + wobbleR.x, 0.08 + wobbleR.y, 1.0)), look);

  float baseHalfH = 0.128;
  baseHalfH = mix(baseHalfH, 0.016, u_surprise);
  baseHalfH = mix(baseHalfH, 0.072, u_squint);
  baseHalfH = mix(baseHalfH, 0.002, u_startled);

  float baseRad = 0.054;
  baseRad = mix(baseRad, 0.09, u_surprise);
  baseRad = mix(baseRad, 0.058, u_squint);
  baseRad = mix(baseRad, 0.029, u_startled);

  float openBoostL = 1.0 + u_winkR * 0.14;
  float openBoostR = 1.0 + u_winkL * 0.14;

  float asymL = (1.0 + u_curious * 0.28) * openBoostL;
  float asymR = (1.0 - u_curious * 0.24) * openBoostR;

  float halfHL = mix(baseHalfH * asymL, 0.01, u_blinkL);
  float halfHR = mix(baseHalfH * asymR, 0.01, u_blinkR);
  float radL = mix(baseRad * (1.0 + max(0.0, u_curious) * 0.12) * openBoostL, 0.062, u_blinkL);
  float radR = mix(baseRad * (1.0 + max(0.0, -u_curious) * 0.12) * openBoostR, 0.062, u_blinkR);

  float anyWink = clamp(max(u_winkL, u_winkR), 0.0, 1.0);
  float happyL = u_happy * (1.0 - u_blinkL) * (1.0 - anyWink);
  float happyR = u_happy * (1.0 - u_blinkR) * (1.0 - anyWink);

  float eyes = max(
    eyeMask(n, eL, right, up, -1.0, halfHL, radL, happyL, u_winkL, u_squint, u_sleepy, u_dizzy, u_smug, u_star, u_love, u_code, u_sweat, u_time),
    eyeMask(n, eR, right, up, 1.0, halfHR, radR, happyR, u_winkR, u_squint, u_sleepy, u_dizzy, u_smug, u_star, u_love, u_code, u_sweat, u_time)
  );

  vec3 warmBody = mix(
    u_body,
    vec3(0.985, 0.89, 0.52),
    clamp(u_happy * 0.32 + u_surprise * 0.15 + u_star * 0.35 + u_startled * 0.42, 0.0, 0.5)
  );

  // Joues rosées douces (blush + accent tendre sur love / starstruck)
  float blushWeight = clamp(u_blush * 0.78 + u_love * 0.44 + u_star * 0.22, 0.0, 0.85);
  if (blushWeight > 0.005) {
    vec2 chL = vec2(dot(n - eL, right) + 0.06, dot(n - eL, up) + 0.205);
    vec2 chR = vec2(dot(n - eR, right) - 0.06, dot(n - eR, up) + 0.205);
    float gL = exp(-dot(chL * vec2(5.6, 8.8), chL * vec2(5.6, 8.8)));
    float gR = exp(-dot(chR * vec2(5.6, 8.8), chR * vec2(5.6, 8.8)));
    float cheekGlow = clamp((gL + gR) * blushWeight, 0.0, 0.72);
    warmBody = mix(warmBody, vec3(0.95, 0.41, 0.45), cheekGlow);
  }

  vec3 col = mix(warmBody, u_eye, clamp(eyes, 0.0, 1.0));

  // Petite goutte de sueur cyan sur la tempe droite pour l'état sweatdrop
  if (u_sweat > 0.01) {
    float swX = dot(n, right) - 0.56;
    float swY = dot(n, up) - 0.42;
    float swPinch = mix(1.0, 2.35, clamp((swY + 0.03) / 0.12, 0.0, 1.0));
    float dSw = length(vec2(swX * swPinch, swY * 0.82)) - 0.072;
    float dropMask = (1.0 - smoothstep(-0.012, 0.012, dSw)) * u_sweat * smoothstep(0.18, 0.38, z);
    float dropSpec = 1.0 - smoothstep(0.016, 0.03, length(vec2(swX + 0.018, swY + 0.02)));
    vec3 dropCol = mix(vec3(0.38, 0.78, 0.98), vec3(0.92, 0.98, 1.0), dropSpec * 0.75);
    col = mix(col, dropCol, dropMask * 0.94);
  }

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), edge);
}
`;

  const FRAG = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_speed;
uniform vec2 u_look;
uniform float u_blinkL;
uniform float u_blinkR;
uniform float u_winkL;
uniform float u_winkR;
uniform float u_happy;
uniform float u_surprise;
uniform float u_squint;
uniform float u_curious;
uniform float u_sleepy;
uniform float u_dizzy;
uniform float u_mode;
uniform vec3 u_body;
uniform vec3 u_eye;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

vec3 orient(vec3 p, vec2 look) {
  float yaw = look.x * 0.92;
  float pitch = -look.y * 0.78;
  float cy = cos(yaw);
  float sy = sin(yaw);
  float cp = cos(pitch);
  float sp = sin(pitch);
  vec3 q = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);
  return vec3(q.x * cy + q.z * sy, q.y, -q.x * sy + q.z * cy);
}

float eyeMask(
  vec3 n,
  vec3 e,
  vec3 right,
  vec3 up,
  float sideSign,
  float halfH,
  float rad,
  float happy,
  float wink,
  float squint,
  float sleepy,
  float dizzy,
  float t
) {
  float facing = dot(n, e);
  float x = dot(n, right) - dot(e, right);
  float y = dot(n, up) - dot(e, up);

  // Capsule standard
  float yc = y - clamp(y, -halfH, halfH);
  float dCap = length(vec2(x, yc)) - rad;

  // Arc joyeux (^ ^)
  float xArc = clamp(x, -0.095, 0.095);
  float yArc = 0.044 - 6.8 * xArc * xArc;
  float dHappy = length(vec2(x - xArc, y - yArc)) - 0.038;

  // Arc malicieux de clin d'œil (>)
  float xWink = clamp(x, -0.092, 0.092);
  float yWink = 0.036 - 0.58 * abs(xWink);
  float dWink = length(vec2(x - xWink, y - yWink)) - 0.032;

  // Paupière tombante courbée vers le bas pour la sieste
  float xSleep = clamp(x, -0.094, 0.094);
  float ySleep = -0.044 + 4.8 * xSleep * xSleep;
  float dSleep = length(vec2(x - xSleep, y - ySleep)) - 0.028;

  float d = mix(dCap, dHappy, happy);
  d = mix(d, dSleep, sleepy);
  d = mix(d, dWink, wink);

  // Sourcil/paupière inclinée vers l'intérieur pour l'état concentré
  float inward = -x * sideSign;
  float browTop = 0.052 - 0.42 * inward;
  float browBot = -0.048 + 0.1 * inward;
  float squintMask =
    (1.0 - smoothstep(browTop - 0.012, browTop + 0.012, y)) *
    smoothstep(browBot - 0.012, browBot + 0.012, y);

  float baseFill = 1.0 - smoothstep(-0.01, 0.01, d);
  float focusedFill = baseFill * mix(1.0, squintMask, squint * (1.0 - wink) * (1.0 - happy));

  // Spirales tournantes (@ @) pour l'état étourdi
  float r = length(vec2(x, y));
  float a = atan(y, x);
  float spin = r * 92.0 - a * sideSign + t * 11.0 * sideSign;
  float spiralBand = smoothstep(-0.22, 0.32, sin(spin));
  float orbDisk = 1.0 - smoothstep(0.108, 0.128, r);
  float centerPin = 1.0 - smoothstep(0.022, 0.036, r);
  float dizzyFill = max(spiralBand * orbDisk, centerPin);

  float fill = mix(focusedFill, dizzyFill, dizzy);
  return fill * smoothstep(0.12, 0.32, facing);
}

vec3 wash(vec3 n, float t) {
  vec2 q = n.xy * 2.2 + n.z * 0.85;
  vec2 w1 = vec2(
    fbm(q * 1.4 + vec2(t * 0.22, t * 0.18)),
    fbm(q * 1.4 + vec2(-t * 0.16, t * 0.24) + 4.1)
  );
  q += (w1 - 0.5) * 0.72;
  float f = fbm(q * 2.1 + vec2(0.0, t * 0.12));
  float g = fbm(q * 4.6 - vec2(t * 0.2, 0.0));
  vec3 col = mix(u_c1, u_c2, smoothstep(0.28, 0.72, f));
  return mix(col, u_c3, pow(smoothstep(0.42, 0.9, g), 1.4));
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  uv.x *= aspect;

  float radius = 0.94;
  vec2 p = uv / radius;
  float r2 = dot(p, p);
  float edge = 1.0 - smoothstep(0.985, 1.012, sqrt(max(r2, 0.0)));
  if (edge <= 0.001) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float z = sqrt(max(1.0 - r2, 0.0));
  vec3 n = normalize(vec3(p, z));

  vec2 look = u_look;
  float lm = length(look);
  if (lm > 1.0) look /= lm;

  vec3 right = orient(vec3(1.0, 0.0, 0.0), look);
  vec3 up = orient(vec3(0.0, 1.0, 0.0), look);

  // Légère oscillation des orbites quand l'orb est étourdie (période exacte 2*PI / 11)
  vec2 wobbleL = vec2(0.035 * sin(u_time * 11.0), 0.03 * cos(u_time * 11.0)) * u_dizzy;
  vec2 wobbleR = vec2(-0.035 * cos(u_time * 11.0 + 0.7), 0.03 * sin(u_time * 11.0 + 0.7)) * u_dizzy;

  vec3 eL = orient(normalize(vec3(-0.32 + wobbleL.x, 0.08 + wobbleL.y, 1.0)), look);
  vec3 eR = orient(normalize(vec3(0.32 + wobbleR.x, 0.08 + wobbleR.y, 1.0)), look);

  // Paramètres de forme par œil
  float baseHalfH = 0.128;
  baseHalfH = mix(baseHalfH, 0.016, u_surprise);
  baseHalfH = mix(baseHalfH, 0.072, u_squint);

  float baseRad = 0.054;
  baseRad = mix(baseRad, 0.09, u_surprise);
  baseRad = mix(baseRad, 0.058, u_squint);

  // L'œil resté ouvert pendant un clin d'œil s'arrondit légèrement avec malice
  float openBoostL = 1.0 + u_winkR * 0.14;
  float openBoostR = 1.0 + u_winkL * 0.14;

  float asymL = (1.0 + u_curious * 0.28) * openBoostL;
  float asymR = (1.0 - u_curious * 0.24) * openBoostR;

  float halfHL = mix(baseHalfH * asymL, 0.01, u_blinkL);
  float halfHR = mix(baseHalfH * asymR, 0.01, u_blinkR);
  float radL = mix(baseRad * (1.0 + max(0.0, u_curious) * 0.12) * openBoostL, 0.062, u_blinkL);
  float radR = mix(baseRad * (1.0 + max(0.0, -u_curious) * 0.12) * openBoostR, 0.062, u_blinkR);

  float anyWink = clamp(max(u_winkL, u_winkR), 0.0, 1.0);
  float happyL = u_happy * (1.0 - u_blinkL) * (1.0 - anyWink);
  float happyR = u_happy * (1.0 - u_blinkR) * (1.0 - anyWink);

  float eyes = max(
    eyeMask(n, eL, right, up, -1.0, halfHL, radL, happyL, u_winkL, u_squint, u_sleepy, u_dizzy, u_time),
    eyeMask(n, eR, right, up, 1.0, halfHR, radR, happyR, u_winkR, u_squint, u_sleepy, u_dizzy, u_time)
  );

  vec3 warmBody = mix(u_body, vec3(0.976, 0.865, 0.455), clamp(u_happy * 0.35 + u_surprise * 0.15, 0.0, 0.45));
  vec3 body = u_mode > 0.5 ? wash(n, u_time * u_speed) : warmBody;
  vec3 col = mix(body, u_eye, clamp(eyes, 0.0, 1.0));

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), edge);
}
`;

  function isDarkTheme() {
    if (typeof document === "undefined") return true;
    const root = document.documentElement;
    if (root.classList.contains("dark")) return true;
    if (root.classList.contains("light")) return false;
    const dataTheme = root.getAttribute("data-theme");
    if (dataTheme === "dark") return true;
    if (dataTheme === "light") return false;
    return true;
  }

  function resolveDark(theme = "auto") {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return isDarkTheme();
  }

  function watchTheme(onChange) {
    if (typeof document === "undefined") return () => {};
    const mo = new MutationObserver(onChange);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", onChange);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", onChange);
    };
  }

  function defaultVariant(dark) {
    return dark ? "white" : "black";
  }

  function hexToRgb(hex) {
    const h = String(hex || "").replace("#", "").trim();
    const full =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h.padEnd(6, "0").slice(0, 6);
    const n = Number.parseInt(full, 16);
    if (Number.isNaN(n)) return [0.95, 0.79, 0.3];
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function resolveVariant(variant, color, eyeColor, colors, dark = true) {
    let body = WHITE.color;
    let eye = WHITE.eyeColor;
    let mode = 0;
    let palette = WEBGL_COLORS;
    const preset = variant || defaultVariant(dark);

    if (preset === "black") {
      body = BLACK.color;
      eye = BLACK.eyeColor;
    } else if (preset === "webgl") {
      palette = colors && colors.length > 0 ? colors : WEBGL_COLORS;
      body = palette[1] ?? WEBGL_COLORS[1];
      eye = "#0C0C10";
      mode = 1;
    } else if (preset === "custom") {
      body = color ?? CUSTOM_DEFAULT.color;
      eye = eyeColor ?? CUSTOM_DEFAULT.eyeColor;
    }

    return { body, eye, mode, palette };
  }

  function fallbackFaceStyle(resolved) {
    if (resolved.mode === 1) {
      const a = resolved.palette[0] ?? WEBGL_COLORS[0];
      const b = resolved.palette[1] ?? WEBGL_COLORS[1];
      const c = resolved.palette[2] ?? WEBGL_COLORS[2];
      return {
        backgroundImage: `linear-gradient(135deg, ${a}, ${b}, ${c})`,
      };
    }
    return { backgroundColor: resolved.body };
  }

  const IDLE_MS = 3200;
  const REST_LOOK = { x: 0, y: 0.08 };

  function createLiveOrb(canvas, initial = {}) {
    let options = {
      interactive: true,
      blink: true,
      lookMode: "viewport",
      ...initial,
    };
    let dark = resolveDark(options.theme);

    const look = { x: 0, y: 0.08 };
    const targetLook = { x: 0, y: 0.08 };
    const glance = { x: 0, y: 0.08 };

    const curMood = {
      happy: 0,
      surprise: 0,
      squint: 0,
      curious: 0,
      sleepy: 0,
      dizzy: 0,
      blush: 0,
      smug: 0,
      star: 0,
      love: 0,
      code: 0,
      startled: 0,
      sweat: 0,
    };
    const targetMood = { ...curMood };

    // Canvas 2D visible (aucun contexte WebGL actif dans le DOM pendant le scroll)
    const ctx2d = canvas.getContext("2d", { alpha: true });
    if (!ctx2d) return null;

    // WebGL détaché hors-écran uniquement pour pré-cuire l'atlas et suivre le regard finement
    const glCanvas = document.createElement("canvas");
    const gl = glCanvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
    });
    if (!gl) return null;

    const useFullShader = options.variant === "webgl";
    let vs = null;
    let fs = null;
    let program = null;
    let buf = null;
    let uResolution = null;
    let uTime = null;
    let uSpeed = null;
    let uLook = null;
    let uBlinkL = null;
    let uBlinkR = null;
    let uWinkL = null;
    let uWinkR = null;
    let uHappy = null;
    let uSurprise = null;
    let uSquint = null;
    let uCurious = null;
    let uSleepy = null;
    let uDizzy = null;
    let uBlush = null;
    let uSmug = null;
    let uStar = null;
    let uLove = null;
    let uCode = null;
    let uStartled = null;
    let uSweat = null;
    let uMode = null;
    let uBody = null;
    let uEye = null;
    let uC1 = null;
    let uC2 = null;
    let uC3 = null;

    const initGl = () => {
      vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
      fs = compileShader(
        gl,
        gl.FRAGMENT_SHADER,
        useFullShader ? FRAG : FRAG_KODAK
      );
      if (!vs || !fs) return false;

      const prog = gl.createProgram();
      if (!prog) return false;
      program = prog;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        return false;
      }
      gl.useProgram(prog);

      buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );
      const loc = gl.getAttribLocation(prog, "a_position");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      uResolution = gl.getUniformLocation(prog, "u_resolution");
      uTime = gl.getUniformLocation(prog, "u_time");
      uSpeed = gl.getUniformLocation(prog, "u_speed");
      uLook = gl.getUniformLocation(prog, "u_look");
      uBlinkL = gl.getUniformLocation(prog, "u_blinkL");
      uBlinkR = gl.getUniformLocation(prog, "u_blinkR");
      uWinkL = gl.getUniformLocation(prog, "u_winkL");
      uWinkR = gl.getUniformLocation(prog, "u_winkR");
      uHappy = gl.getUniformLocation(prog, "u_happy");
      uSurprise = gl.getUniformLocation(prog, "u_surprise");
      uSquint = gl.getUniformLocation(prog, "u_squint");
      uCurious = gl.getUniformLocation(prog, "u_curious");
      uSleepy = gl.getUniformLocation(prog, "u_sleepy");
      uDizzy = gl.getUniformLocation(prog, "u_dizzy");
      uBlush = gl.getUniformLocation(prog, "u_blush");
      uSmug = gl.getUniformLocation(prog, "u_smug");
      uStar = gl.getUniformLocation(prog, "u_star");
      uLove = gl.getUniformLocation(prog, "u_love");
      uCode = gl.getUniformLocation(prog, "u_code");
      uStartled = gl.getUniformLocation(prog, "u_startled");
      uSweat = gl.getUniformLocation(prog, "u_sweat");
      uMode = gl.getUniformLocation(prog, "u_mode");
      uBody = gl.getUniformLocation(prog, "u_body");
      uEye = gl.getUniformLocation(prog, "u_eye");
      uC1 = gl.getUniformLocation(prog, "u_c1");
      uC2 = gl.getUniformLocation(prog, "u_c2");
      uC3 = gl.getUniformLocation(prog, "u_c3");

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      return true;
    };

    if (!initGl()) return null;
    options.onHasGl?.(true);

    // ===== ATLAS PRÉCHARGÉ DES FRAMES D'ANIMATION (12 × 8 = 96 TUILES) =====
    const ATLAS_COLS = 12;
    const ATLAS_ROWS = 8;
    const LOOK_XS = [-0.72, 0, 0.72];
    const LOOK_YS = [-0.52, 0.08, 0.62];
    const LOOK_GRID = [];
    for (let gy = 0; gy < 3; gy++) {
      for (let gx = 0; gx < 3; gx++) {
        LOOK_GRID.push({ x: LOOK_XS[gx], y: LOOK_YS[gy] });
      }
    }

    const ATLAS_SPECS = [];
    // 0..15 : spirales dizzy seamless (période exacte 2*PI / 11)
    for (let i = 0; i < 16; i++) {
      ATLAS_SPECS.push({
        time: (i / 16) * ((Math.PI * 2) / 11),
        look: { x: 0, y: 0.08 },
        dizzy: 1,
      });
    }
    // 16..21 : clignement
    for (const b of [0.22, 0.68, 1, 1, 0.62, 0.2]) {
      ATLAS_SPECS.push({ look: REST_LOOK, bL: b, bR: b });
    }
    // 22..28 : clin d'œil droit
    for (const w of [0.28, 0.72, 1, 1, 0.85, 0.5, 0.18]) {
      ATLAS_SPECS.push({ look: REST_LOOK, wR: w });
    }
    // 29..35 : clin d'œil gauche
    for (const w of [0.28, 0.72, 1, 1, 0.85, 0.5, 0.18]) {
      ATLAS_SPECS.push({ look: REST_LOOK, wL: w });
    }
    // 36 : dodo / endormie
    ATLAS_SPECS.push({ look: { x: 0, y: -0.25 }, sleepy: 1 });
    // 37..39 : curiousL
    for (const lx of [-0.45, 0, 0.45]) {
      ATLAS_SPECS.push({ look: { x: lx, y: 0.1 }, curious: 1 });
    }
    // 40..42 : curiousR
    for (const lx of [-0.45, 0, 0.45]) {
      ATLAS_SPECS.push({ look: { x: lx, y: 0.1 }, curious: -1 });
    }
    // 43..51 : surprised (9 directions)
    for (const lk of LOOK_GRID) ATLAS_SPECS.push({ look: lk, surprise: 1 });
    // 52..60 : happy (9 directions)
    for (const lk of LOOK_GRID) ATLAS_SPECS.push({ look: lk, happy: 1 });
    // 61..69 : squint (9 directions)
    for (const lk of LOOK_GRID) ATLAS_SPECS.push({ look: lk, squint: 1 });
    // 70..78 : neutral (9 directions)
    for (const lk of LOOK_GRID) ATLAS_SPECS.push({ look: lk });
    // 79..86 : nouvelles émotions expressives pré-cuites pour le scroll 0-lag
    ATLAS_SPECS.push({ look: { x: -0.35, y: -0.35 }, happy: 0.55, curious: -0.25, blush: 1 });
    ATLAS_SPECS.push({ look: { x: 0.35, y: 0.12 }, smug: 1 });
    ATLAS_SPECS.push({ look: { x: 0, y: 0.15 }, star: 1 });
    ATLAS_SPECS.push({ look: { x: 0, y: 0.1 }, love: 1 });
    ATLAS_SPECS.push({ look: { x: 0.1, y: 0.08 }, code: 1 });
    ATLAS_SPECS.push({ look: { x: 0, y: 0.12 }, startled: 1 });
    ATLAS_SPECS.push({ look: { x: -0.2, y: -0.08 }, sweat: 1 });
    ATLAS_SPECS.push({ look: { x: 0.56, y: 0.54 }, squint: 0.32, curious: 0.48 });

    const DIZZY_OFFSET = 0;
    const BLINK_OFFSET = 16;
    const WINK_R_OFFSET = 22;
    const WINK_L_OFFSET = 29;
    const SLEEPY_SLOT = 36;
    const CURIOUS_L_OFFSET = 37;
    const CURIOUS_R_OFFSET = 40;
    const SURPRISE_OFFSET = 43;
    const HAPPY_OFFSET = 52;
    const SQUINT_OFFSET = 61;
    const NEUTRAL_OFFSET = 70;
    const BLUSH_SLOT = 79;
    const SMUG_SLOT = 80;
    const STAR_SLOT = 81;
    const LOVE_SLOT = 82;
    const CODE_SLOT = 83;
    const STARTLED_SLOT = 84;
    const SWEAT_SLOT = 85;
    const PONDERING_SLOT = 86;

    const atlasCanvas = document.createElement("canvas");
    const atlasCtx = atlasCanvas.getContext("2d", { alpha: true });
    let atlasReadySlots = new Uint8Array(ATLAS_SPECS.length);
    let bakeCursor = 0;
    let bakeTimer = null;
    let atlasTileSize = 0;
    let atlasFullyBaked = false;

    let raf = 0;
    let idleWakeTimer = null;
    let scrollHoldUntil = 0;
    let destroyed = false;
    let lost = false;
    let onScreen = true;
    let last = 0;
    let clock = 0;
    let nextBlink = 1600 + Math.random() * 2400;
    let blinkAtL = -10000;
    let blinkAtR = -10000;
    let winkAtL = -10000;
    let winkAtR = -10000;
    let nextGlance = 600 + Math.random() * 900;
    let pointerAt = -Infinity;
    let cachedCssW = 56;
    let cachedCssH = 56;
    let cachedVpW = typeof window !== "undefined" ? window.innerWidth : 1280;
    let cachedVpH = typeof window !== "undefined" ? window.innerHeight : 720;
    let lastDrawnSlot = -2;
    let lastLiveSig = "";

    const renderGlFrame = (spec, resolved, bodyRgb, eyeRgb, palette) => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uResolution, glCanvas.width, glCanvas.height);
      gl.uniform1f(uTime, spec.time || 0);
      if (uSpeed) gl.uniform1f(uSpeed, spec.speed || 0);
      gl.uniform2f(uLook, spec.look?.x ?? 0, spec.look?.y ?? 0.08);
      gl.uniform1f(uBlinkL, spec.bL || 0);
      gl.uniform1f(uBlinkR, spec.bR || 0);
      gl.uniform1f(uWinkL, spec.wL || 0);
      gl.uniform1f(uWinkR, spec.wR || 0);
      gl.uniform1f(uHappy, spec.happy || 0);
      gl.uniform1f(uSurprise, spec.surprise || 0);
      gl.uniform1f(uSquint, spec.squint || 0);
      gl.uniform1f(uCurious, spec.curious || 0);
      gl.uniform1f(uSleepy, spec.sleepy || 0);
      gl.uniform1f(uDizzy, spec.dizzy || 0);
      if (uBlush) gl.uniform1f(uBlush, spec.blush || 0);
      if (uSmug) gl.uniform1f(uSmug, spec.smug || 0);
      if (uStar) gl.uniform1f(uStar, spec.star || 0);
      if (uLove) gl.uniform1f(uLove, spec.love || 0);
      if (uCode) gl.uniform1f(uCode, spec.code || 0);
      if (uStartled) gl.uniform1f(uStartled, spec.startled || 0);
      if (uSweat) gl.uniform1f(uSweat, spec.sweat || 0);
      if (uMode) gl.uniform1f(uMode, resolved.mode);
      gl.uniform3f(uBody, bodyRgb[0], bodyRgb[1], bodyRgb[2]);
      gl.uniform3f(uEye, eyeRgb[0], eyeRgb[1], eyeRgb[2]);
      if (uC1) gl.uniform3f(uC1, palette[0][0], palette[0][1], palette[0][2]);
      if (uC2) gl.uniform3f(uC2, palette[1][0], palette[1][1], palette[1][2]);
      if (uC3) gl.uniform3f(uC3, palette[2][0], palette[2][1], palette[2][2]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const bakeSlot = (idx, resolved, bodyRgb, eyeRgb, palette) => {
      if (!atlasCtx || atlasReadySlots[idx] || idx >= ATLAS_SPECS.length || lost || destroyed) return;
      renderGlFrame(ATLAS_SPECS[idx], resolved, bodyRgb, eyeRgb, palette);
      const col = idx % ATLAS_COLS;
      const row = Math.floor(idx / ATLAS_COLS);
      const dx = col * atlasTileSize;
      const dy = row * atlasTileSize;
      atlasCtx.clearRect(dx, dy, atlasTileSize, atlasTileSize);
      atlasCtx.drawImage(glCanvas, dx, dy, atlasTileSize, atlasTileSize);
      atlasReadySlots[idx] = 1;
    };

    const drawAtlasTile = (idx) => {
      if (!atlasReadySlots[idx]) return false;
      if (lastDrawnSlot === idx) return true;
      const col = idx % ATLAS_COLS;
      const row = Math.floor(idx / ATLAS_COLS);
      ctx2d.globalCompositeOperation = "copy";
      ctx2d.drawImage(
        atlasCanvas,
        col * atlasTileSize,
        row * atlasTileSize,
        atlasTileSize,
        atlasTileSize,
        0,
        0,
        canvas.width,
        canvas.height
      );
      ctx2d.globalCompositeOperation = "source-over";
      lastDrawnSlot = idx;
      lastLiveSig = "";
      return true;
    };

    const runAtlasPrebake = () => {
      if (bakeTimer) {
        clearTimeout(bakeTimer);
        bakeTimer = null;
      }
      if (useFullShader || destroyed || lost || atlasTileSize <= 0) return;

      const resolved = resolveVariant(
        options.variant,
        options.color,
        options.eyeColor,
        options.colors,
        dark
      );
      const bodyRgb = hexToRgb(resolved.body);
      const eyeRgb = hexToRgb(resolved.eye);
      const palette = [0, 1, 2].map((i) =>
        hexToRgb(resolved.palette[i % resolved.palette.length] ?? WEBGL_COLORS[i])
      );

      // Tuiles critiques cuites immédiatement pour le premier rendu et le scroll
      for (const essential of [
        NEUTRAL_OFFSET + 4,
        SURPRISE_OFFSET + 4,
        HAPPY_OFFSET + 4,
        SQUINT_OFFSET + 4,
        SLEEPY_SLOT,
      ]) {
        bakeSlot(essential, resolved, bodyRgb, eyeRgb, palette);
      }

      const step = () => {
        bakeTimer = null;
        if (destroyed || lost) return;
        let count = 0;
        while (bakeCursor < ATLAS_SPECS.length && count < 10) {
          if (!atlasReadySlots[bakeCursor]) {
            bakeSlot(bakeCursor, resolved, bodyRgb, eyeRgb, palette);
            count += 1;
          }
          bakeCursor += 1;
        }
        if (bakeCursor < ATLAS_SPECS.length) {
          bakeTimer = setTimeout(step, 14);
        } else {
          atlasFullyBaked = true;
        }
      };
      bakeTimer = setTimeout(step, 24);
    };

    const pickClosestGridIdx = (lx, ly) => {
      const gx = lx < -0.32 ? 0 : lx > 0.32 ? 2 : 1;
      const gy = ly < -0.22 ? 0 : ly > 0.34 ? 2 : 1;
      return gy * 3 + gx;
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return false;
      cachedVpW = window.innerWidth;
      cachedVpH = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth || 56;
      const h = parent.clientHeight || 56;
      if (w <= 0 || h <= 0) return false;
      cachedCssW = w;
      cachedCssH = h;
      const width = Math.max(1, Math.floor(w * dpr));
      const height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      if (width === canvas.width && height === canvas.height && atlasTileSize === width) {
        return false;
      }
      canvas.width = width;
      canvas.height = height;
      glCanvas.width = width;
      glCanvas.height = height;
      gl.viewport(0, 0, glCanvas.width, glCanvas.height);

      atlasTileSize = width;
      atlasCanvas.width = ATLAS_COLS * width;
      atlasCanvas.height = ATLAS_ROWS * width;
      atlasReadySlots = new Uint8Array(ATLAS_SPECS.length);
      bakeCursor = 0;
      atlasFullyBaked = false;
      lastDrawnSlot = -2;
      lastLiveSig = "";
      runAtlasPrebake();
      return true;
    };

    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const moving = () =>
      onScreen && !mqReduce.matches && document.visibilityState !== "hidden";

    function wake() {
      if (idleWakeTimer) {
        clearTimeout(idleWakeTimer);
        idleWakeTimer = null;
      }
      if (raf || destroyed || lost) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    function redraw() {
      if (destroyed || lost) return;
      cancelAnimationFrame(raf);
      raf = 0;
      last = performance.now();
      tick(last);
    }

    const lookAtViewportPoint = (clientX, clientY, orbLeft, orbTop, orbSize) => {
      let cx;
      let cy;
      let w;
      let h;
      if (typeof orbLeft === "number" && typeof orbTop === "number") {
        w = orbSize || cachedCssW;
        h = orbSize || cachedCssH;
        cx = orbLeft + w * 0.5;
        cy = orbTop + h * 0.5;
      } else {
        const parent = canvas.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        w = rect.width;
        h = rect.height;
        cx = rect.left + w * 0.5;
        cy = rect.top + h * 0.5;
      }

      const scaleX =
        options.lookMode === "viewport"
          ? Math.max(w * 0.5, cachedVpW * 0.28)
          : w * 0.5;
      const scaleY =
        options.lookMode === "viewport"
          ? Math.max(h * 0.5, cachedVpH * 0.28)
          : h * 0.5;

      const dx = (clientX - cx) / scaleX;
      const dy = (cy - clientY) / scaleY;
      targetLook.x = Math.min(1, Math.max(-1, dx));
      targetLook.y = Math.min(1, Math.max(-1, dy));
      pointerAt = performance.now();
      if (onScreen) wake();
    };

    const blinkCurve = (dtSec) => {
      if (dtSec < 0) return 0;
      if (dtSec < 0.055) return dtSec / 0.055;
      if (dtSec < 0.1) return 1;
      if (dtSec < 0.18) return 1 - (dtSec - 0.1) / 0.08;
      return 0;
    };

    // Courbe plus longue et lisible pour un vrai clin d'œil expressif (~420 ms)
    const winkCurve = (dtSec) => {
      if (dtSec < 0) return 0;
      if (dtSec < 0.07) return dtSec / 0.07;
      if (dtSec < 0.25) return 1;
      if (dtSec < 0.42) return 1 - (dtSec - 0.25) / 0.17;
      return 0;
    };

    const pickPreloadedSlot = (lx, ly, bL, wL, wR, timeSec) => {
      if (curMood.dizzy > 0.72) {
        const phase = (((timeSec * 11) / (Math.PI * 2)) % 1 + 1) % 1;
        return DIZZY_OFFSET + Math.min(15, Math.floor(phase * 16));
      }
      if (curMood.sleepy > 0.88) return SLEEPY_SLOT;
      if (curMood.love > 0.45) return LOVE_SLOT;
      if (curMood.star > 0.45) return STAR_SLOT;
      if (curMood.code > 0.45) return CODE_SLOT;
      if (curMood.smug > 0.45) return SMUG_SLOT;
      if (curMood.sweat > 0.45) return SWEAT_SLOT;
      if (curMood.startled > 0.45) return STARTLED_SLOT;
      if (curMood.blush > 0.45) return BLUSH_SLOT;
      if (wR > 0.06) return WINK_R_OFFSET + Math.min(6, Math.round(wR * 6));
      if (wL > 0.06) return WINK_L_OFFSET + Math.min(6, Math.round(wL * 6));
      if (bL > 0.06) return BLINK_OFFSET + Math.min(5, Math.round(bL * 5));
      if (curMood.surprise > 0.45) return SURPRISE_OFFSET + pickClosestGridIdx(lx, ly);
      if (curMood.happy > 0.45) return HAPPY_OFFSET + pickClosestGridIdx(lx, ly);
      if (curMood.squint > 0.25 && curMood.curious > 0.35) return PONDERING_SLOT;
      if (curMood.squint > 0.45) return SQUINT_OFFSET + pickClosestGridIdx(lx, ly);
      if (curMood.curious > 0.45) {
        return CURIOUS_L_OFFSET + (lx < -0.2 ? 0 : lx > 0.2 ? 2 : 1);
      }
      if (curMood.curious < -0.45) {
        return CURIOUS_R_OFFSET + (lx < -0.2 ? 0 : lx > 0.2 ? 2 : 1);
      }
      return NEUTRAL_OFFSET + pickClosestGridIdx(lx, ly);
    };

    const tick = (now) => {
      raf = 0;
      if (lost) return;
      const dt = Math.min(50, Math.max(0, now - last));
      last = now;
      const live = moving();
      if (live) clock += dt;
      const reduce = mqReduce.matches;

      const resolved = resolveVariant(
        options.variant,
        options.color,
        options.eyeColor,
        options.colors,
        dark
      );
      const time = clock / 1000;

      const steering = options.interactive && now - pointerAt < IDLE_MS;
      if (!steering && live && clock >= nextGlance) {
        const back = Math.random() < 0.3;
        glance.x = back ? 0 : (Math.random() * 2 - 1) * 0.8;
        glance.y = back ? 0.08 : (Math.random() * 2 - 1) * 0.5;
        nextGlance = clock + 900 + Math.random() * 2100;
      }
      const goal = steering ? targetLook : reduce ? REST_LOOK : glance;
      const ease = live ? (steering ? 0.18 : 0.1) : 1;
      look.x += (goal.x - look.x) * ease;
      look.y += (goal.y - look.y) * ease;

      const moodEase = live ? 0.18 : 1;
      let moodDelta = 0;
      for (const k of Object.keys(curMood)) {
        const diff = targetMood[k] - curMood[k];
        curMood[k] += diff * moodEase;
        moodDelta += Math.abs(diff);
      }

      if (!reduce && options.blink && clock >= nextBlink && curMood.sleepy < 0.3) {
        blinkAtL = clock;
        blinkAtR = clock;
        nextBlink = clock + 2400 + Math.random() * 3800;
      }

      const bL = !reduce && options.blink ? blinkCurve((clock - blinkAtL) / 1000) : 0;
      const bR = !reduce && options.blink ? blinkCurve((clock - blinkAtR) / 1000) : 0;
      const wL = !reduce ? winkCurve((clock - winkAtL) / 1000) : 0;
      const wR = !reduce ? winkCurve((clock - winkAtR) / 1000) : 0;

      const isScrolling = now < scrollHoldUntil;
      const nearRest =
        Math.abs(look.x) < 0.22 &&
        Math.abs(look.y - 0.08) < 0.22 &&
        curMood.happy < 0.05 &&
        curMood.surprise < 0.05 &&
        curMood.squint < 0.05 &&
        Math.abs(curMood.curious) < 0.05 &&
        curMood.blush < 0.05 &&
        curMood.smug < 0.05 &&
        curMood.star < 0.05 &&
        curMood.love < 0.05 &&
        curMood.code < 0.05 &&
        curMood.startled < 0.05 &&
        curMood.sweat < 0.05;

      // Lecture depuis l'atlas préchargé pendant le scroll, dizzy, dodo ou clignement au repos
      const preferAtlas =
        !useFullShader &&
        (isScrolling ||
          curMood.dizzy > 0.72 ||
          curMood.sleepy > 0.96 ||
          ((bL > 0.05 || wL > 0.05 || wR > 0.05) && nearRest));

      let drawnFromAtlas = false;
      if (preferAtlas) {
        const slot = pickPreloadedSlot(look.x, look.y, bL, wL, wR, time);
        if (atlasReadySlots[slot]) {
          drawnFromAtlas = drawAtlasTile(slot);
        }
      }

      if (!drawnFromAtlas && (!isScrolling || !atlasFullyBaked)) {
        const lx = reduce ? REST_LOOK.x : look.x;
        const ly = reduce ? REST_LOOK.y : look.y;
        const hVal = reduce ? 0 : curMood.happy;
        const suVal = reduce ? 0 : curMood.surprise;
        const sqVal = reduce ? 0 : curMood.squint;
        const cuVal = reduce ? 0 : curMood.curious;
        const slVal = reduce ? 0 : curMood.sleepy;
        const diVal = reduce ? 0 : curMood.dizzy;
        const blVal = reduce ? 0 : curMood.blush;
        const smVal = reduce ? 0 : curMood.smug;
        const stVal = reduce ? 0 : curMood.star;
        const loVal = reduce ? 0 : curMood.love;
        const coVal = reduce ? 0 : curMood.code;
        const srVal = reduce ? 0 : curMood.startled;
        const swVal = reduce ? 0 : curMood.sweat;
        const sig = `${resolved.mode}|${lx.toFixed(3)}|${ly.toFixed(3)}|${bL.toFixed(2)}|${wL.toFixed(2)}|${wR.toFixed(2)}|${hVal.toFixed(2)}|${suVal.toFixed(2)}|${sqVal.toFixed(2)}|${cuVal.toFixed(2)}|${slVal.toFixed(2)}|${diVal.toFixed(2)}|${blVal.toFixed(2)}|${smVal.toFixed(2)}|${stVal.toFixed(2)}|${loVal.toFixed(2)}|${coVal.toFixed(2)}|${srVal.toFixed(2)}|${swVal.toFixed(2)}|${diVal > 0.01 || resolved.mode > 0.5 ? time.toFixed(2) : 0}`;

        if (sig !== lastLiveSig) {
          const body = hexToRgb(resolved.body);
          const eye = hexToRgb(resolved.eye);
          const palette = [0, 1, 2].map((i) =>
            hexToRgb(
              resolved.palette[i % resolved.palette.length] ?? WEBGL_COLORS[i]
            )
          );
          renderGlFrame(
            {
              time: reduce ? 0 : time,
              speed: reduce ? 0 : 0.55,
              look: { x: lx, y: ly },
              bL,
              bR,
              wL,
              wR,
              happy: hVal,
              surprise: suVal,
              squint: sqVal,
              curious: cuVal,
              sleepy: slVal,
              dizzy: diVal,
              blush: blVal,
              smug: smVal,
              star: stVal,
              love: loVal,
              code: coVal,
              startled: srVal,
              sweat: swVal,
            },
            resolved,
            body,
            eye,
            palette
          );
          ctx2d.globalCompositeOperation = "copy";
          ctx2d.drawImage(glCanvas, 0, 0, canvas.width, canvas.height);
          ctx2d.globalCompositeOperation = "source-over";
          lastLiveSig = sig;
          lastDrawnSlot = -2;
        }
      }

      if (!live || destroyed) return;

      const lookDelta = Math.abs(goal.x - look.x) + Math.abs(goal.y - look.y);
      const activeAnim =
        resolved.mode > 0.5 ||
        curMood.dizzy > 0.01 ||
        bL > 0 ||
        bR > 0 ||
        wL > 0 ||
        wR > 0 ||
        (!isScrolling && lookDelta > 0.0025) ||
        moodDelta > 0.004;

      if (activeAnim) {
        raf = requestAnimationFrame(tick);
      } else if (curMood.sleepy < 0.8) {
        const waitMs = Math.max(
          120,
          Math.min(nextBlink - clock, steering ? IDLE_MS : nextGlance - clock)
        );
        idleWakeTimer = setTimeout(() => {
          clock += waitMs;
          wake();
        }, waitMs);
      }
    };

    const ro = new ResizeObserver(() => {
      if (resize()) redraw();
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      wake();
    });
    io.observe(canvas);
    const onVisibility = () => wake();
    document.addEventListener("visibilitychange", onVisibility);
    const onReduce = () => wake();
    mqReduce.addEventListener("change", onReduce);
    const syncTheme = () => {
      const next = resolveDark(options.theme);
      if (next === dark) return;
      dark = next;
      wake();
    };
    const unwatchTheme = watchTheme(syncTheme);

    const onLost = (e) => {
      e.preventDefault();
      lost = true;
      cancelAnimationFrame(raf);
      raf = 0;
      if (bakeTimer) {
        clearTimeout(bakeTimer);
        bakeTimer = null;
      }
    };
    const onRestored = () => {
      if (destroyed) return;
      if (!initGl()) return;
      lost = false;
      atlasReadySlots = new Uint8Array(ATLAS_SPECS.length);
      bakeCursor = 0;
      atlasFullyBaked = false;
      runAtlasPrebake();
      wake();
    };
    glCanvas.addEventListener("webglcontextlost", onLost);
    glCanvas.addEventListener("webglcontextrestored", onRestored);

    resize();
    wake();

    return {
      setOptions(next) {
        options = { ...options, ...next };
        dark = resolveDark(options.theme);
        wake();
      },
      setMoodValues(values = {}) {
        for (const k of Object.keys(targetMood)) {
          targetMood[k] = typeof values[k] === "number" ? values[k] : 0;
        }
        wake();
      },
      triggerBlink() {
        if (mqReduce.matches) return;
        blinkAtL = clock;
        blinkAtR = clock;
        nextBlink = clock + 2400 + Math.random() * 3800;
        wake();
      },
      triggerWink(side = "right") {
        if (mqReduce.matches) return;
        if (side === "left") winkAtL = clock;
        else winkAtR = clock;
        wake();
      },
      notifyScrolling(durationMs = 150) {
        scrollHoldUntil =
          durationMs <= 0 ? 0 : Math.max(scrollHoldUntil, performance.now() + durationMs);
      },
      lookAtViewportPoint,
      nudgeLook(x, y) {
        targetLook.x = Math.min(1, Math.max(-1, x));
        targetLook.y = Math.min(1, Math.max(-1, y));
        pointerAt = performance.now();
        wake();
      },
      destroy() {
        destroyed = true;
        if (idleWakeTimer) clearTimeout(idleWakeTimer);
        if (bakeTimer) clearTimeout(bakeTimer);
        cancelAnimationFrame(raf);
        raf = 0;
        ro.disconnect();
        io.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        mqReduce.removeEventListener("change", onReduce);
        unwatchTheme();
        glCanvas.removeEventListener("webglcontextlost", onLost);
        glCanvas.removeEventListener("webglcontextrestored", onRestored);
        options.onHasGl?.(false);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteBuffer(buf);
        const lose = gl.getExtension("WEBGL_lose_context");
        queueMicrotask(() => {
          if (!gl.isContextLost()) lose?.loseContext();
        });
      },
    };
  }

  window.LiveOrb = {
    WHITE,
    BLACK,
    KODAK,
    CUSTOM_DEFAULT,
    WEBGL_COLORS,
    isDarkTheme,
    resolveDark,
    watchTheme,
    defaultVariant,
    resolveVariant,
    fallbackFaceStyle,
    createLiveOrb,
  };

  /* ===== COMPAGNON AUTONOME : ÉMOTIONS + BALADE + INTERACTIONS SITE ===== */
  const INTEREST_SELECTOR = [
    ".about-terminal",
    ".skill-card",
    ".skills-galaxy-cta",
    ".domain-link",
    ".view-switch-link",
    ".margin-note",
    ".ledger-row-btn",
    ".timeline-item",
    ".contact-link-item",
    ".coverflow-stage",
    ".coverflow-link",
    ".coverflow-arrow",
    ".nav-cta",
    ".nav-logo",
    ".case-logo",
    ".hero-title",
    ".hero-print",
    ".project-image",
    ".file-link",
    ".case-stat",
    ".case-button",
  ].join(", ");

  const SECTION_SELECTOR = "section[id], .hero, .case-hero, .case-section";

  const MOODS = {
    neutral: { happy: 0, surprise: 0, squint: 0, curious: 0, sleepy: 0, dizzy: 0, blush: 0, smug: 0, star: 0, love: 0, code: 0, startled: 0, sweat: 0 },
    happy: { happy: 1, surprise: 0, squint: 0, curious: 0, sleepy: 0, dizzy: 0, blush: 0, smug: 0, star: 0, love: 0, code: 0, startled: 0, sweat: 0 },
    surprised: { happy: 0, surprise: 1, squint: 0, curious: 0, sleepy: 0, dizzy: 0, blush: 0, smug: 0, star: 0, love: 0, code: 0, startled: 0, sweat: 0 },
    squint: { happy: 0, surprise: 0, squint: 1, curious: 0, sleepy: 0, dizzy: 0, blush: 0, smug: 0, star: 0, love: 0, code: 0, startled: 0, sweat: 0 },
    curiousL: { happy: 0, surprise: 0, squint: 0, curious: 1, sleepy: 0, dizzy: 0, blush: 0, smug: 0, star: 0, love: 0, code: 0, startled: 0, sweat: 0 },
    curiousR: { happy: 0, surprise: 0, squint: 0, curious: -1, sleepy: 0, dizzy: 0, blush: 0, smug: 0, star: 0, love: 0, code: 0, startled: 0, sweat: 0 },
    drowsy: { happy: 0, surprise: 0, squint: 0, curious: 0, sleepy: 0.42, dizzy: 0, blush: 0, smug: 0, star: 0, love: 0, code: 0, startled: 0, sweat: 0 },
    sleepy: { happy: 0, surprise: 0, squint: 0, curious: 0, sleepy: 1, dizzy: 0, blush: 0, smug: 0, star: 0, love: 0, code: 0, startled: 0, sweat: 0 },
    dizzy: { happy: 0, surprise: 0, squint: 0, curious: 0, sleepy: 0, dizzy: 1, blush: 0, smug: 0, star: 0, love: 0, code: 0, startled: 0, sweat: 0 },
    pondering: { happy: 0, surprise: 0, squint: 0.32, curious: 0.48, sleepy: 0, dizzy: 0, blush: 0, smug: 0, star: 0, love: 0, code: 0, startled: 0, sweat: 0 },
    blush: { happy: 0.55, surprise: 0, squint: 0, curious: -0.25, sleepy: 0, dizzy: 0, blush: 1, smug: 0, star: 0, love: 0, code: 0, startled: 0, sweat: 0 },
    smug: { happy: 0, surprise: 0, squint: 0, curious: 0, sleepy: 0, dizzy: 0, blush: 0, smug: 1, star: 0, love: 0, code: 0, startled: 0, sweat: 0 },
    starstruck: { happy: 0, surprise: 0, squint: 0, curious: 0, sleepy: 0, dizzy: 0, blush: 0, smug: 0, star: 1, love: 0, code: 0, startled: 0, sweat: 0 },
    love: { happy: 0, surprise: 0, squint: 0, curious: 0, sleepy: 0, dizzy: 0, blush: 0, smug: 0, star: 0, love: 1, code: 0, startled: 0, sweat: 0 },
    code: { happy: 0, surprise: 0, squint: 0, curious: 0, sleepy: 0, dizzy: 0, blush: 0, smug: 0, star: 0, love: 0, code: 1, startled: 0, sweat: 0 },
    startled: { happy: 0, surprise: 0, squint: 0, curious: 0, sleepy: 0, dizzy: 0, blush: 0, smug: 0, star: 0, love: 0, code: 0, startled: 1, sweat: 0 },
    sweatdrop: { happy: 0, surprise: 0, squint: 0, curious: 0, sleepy: 0, dizzy: 0, blush: 0, smug: 0, star: 0, love: 0, code: 0, startled: 0, sweat: 1 },
  };

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  /* ===== BANQUE DE PENSÉES PRÉCHARGÉES (SOBRE, SANS TAGS DE SECTION) ===== */
  const THOUGHT_BANK = {
    hero: [
      {
        verb: "Raisonnement…",
        doneVerb: "Pensé",
        thoughts: [
          "Lecture de la double approche de Benjamin : rigueur du code et sens visuel.",
          "L'architecture privilégie la légèreté, la fluidité et le rendu fait main.",
          "Synthèse en une phrase simple et naturelle.",
        ],
        answer: "Moitié code, moitié image. Prends ton temps pour explorer.",
      },
      {
        directOnly: true,
        answer: "Tout ici est pensé à la main — même mes yeux sont tracés par des maths en temps réel.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Repérage de la palette : Dark Bark, Path Mist et Kodak Yellow.",
          "La forêt en arrière-plan pose un rythme calme avant les projets.",
        ],
        answer: "Si tu cherches quelqu'un qui sait autant coder une interface que monter une vidéo, descends jeter un œil.",
      },
      {
        directOnly: true,
        answer: "Bienvenue ! Descends quand tu veux, je te suis discrètement.",
      },
      {
        verb: "Analyse…",
        doneVerb: "Analysé",
        thoughts: [
          "Observation de la typographie Bricolage Grotesque et de l'ambiance forêt.",
          "Préchargement des expressions de visite terminé en douceur.",
        ],
        answer: "Tout est calme par ici… mais un simple mouvement de souris peut me faire réagir.",
      },
    ],
    about: [
      {
        verb: "Analyse…",
        doneVerb: "Analysé",
        thoughts: [
          "Trajectoire : deux ans de BUT Informatique à Lille, puis MMI à Troyes et Vélizy.",
          "Passage de l'algorithmique pure à la création numérique.",
          "Vérification de son principe : concevoir ce qu'il dessine jusqu'à la mise en ligne.",
        ],
        answer: "Ce détour par Lille puis Troyes lui a laissé un pied solide dans le code et l'autre dans l'image.",
      },
      {
        directOnly: true,
        answer: "Il n'y a pas que des projets d'école ici : il maintient aussi un vrai site client en ligne depuis 2024.",
      },
      {
        verb: "Synthèse…",
        doneVerb: "Synthétisé",
        thoughts: [
          "Comparaison entre maquette Figma et intégration front-end.",
          "Quand la même personne dessine et code, rien ne se perd en route.",
        ],
        answer: "Ce qu'il dessine, il le fabrique — pas de coupure entre l'idée et le navigateur.",
      },
      {
        directOnly: true,
        answer: "Code, identité visuelle et montage : les trois s'alimentent en permanence dans ses projets.",
      },
    ],
    terminal: [
      {
        verb: "Lecture…",
        doneVerb: "Traité",
        thoughts: [
          "Parcours de l'objet `const benjamin` dans la fenêtre.",
          "pratique: ['web', 'design', 'audiovisuel'] — trois domaines bien reliés.",
          "Aucune erreur de syntaxe dans son profil.",
        ],
        answer: "Code propre dans `benjamin.js`. J'aime bien me poser sur cette barre de titre.",
      },
      {
        directOnly: true,
        answer: "J'ai essayé de taper une commande dans le terminal, mais je n'ai pas de doigts.",
      },
      {
        verb: "Raisonnement…",
        doneVerb: "Raisonné",
        thoughts: [
          "Lecture ligne par ligne : domaine, pratique, formation, approche.",
          "Le curseur clignote tranquillement à 1,2 seconde.",
        ],
        answer: "C'est un peu sa carte d'identité en JavaScript.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Mode concentré activé : balayage horizontal de la fenêtre de code.",
          "Toutes les propriétés pointent vers du concret.",
        ],
        answer: "Chut, je relis les dernières lignes de `benjamin.js` avant de repartir.",
      },
      {
        directOnly: true,
        answer: "Je plisse un peu les yeux pour lire `benjamin.js` jusqu'à la dernière accolade.",
      },
    ],
    work: [
      {
        verb: "Exploration…",
        doneVerb: "Pensé",
        thoughts: [
          "Huit réalisations disponibles entre SAE, site client et montage vidéo.",
          "Chaque carte ouvre sur un terrain différent : branding, PHP/JSON ou fiction sonore.",
        ],
        answer: "Fais tourner les cartes à la molette ou au glisser — certaines fiches ont même des aperçus de dossiers.",
      },
      {
        directOnly: true,
        answer: "Huit projets à découvrir ici : du branding complet jusqu'à un site client réel.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Calcul de l'angle coverflow en perspective sur la piste des projets.",
          "Chaque fiche garde ses visuels complets et son contexte.",
        ],
        answer: "Clique deux fois sur une carte qui t'intrigue pour ouvrir tout son carnet.",
      },
    ],
    project_kaobucha: [
      {
        verb: "Analyse…",
        doneVerb: "Analysé",
        thoughts: [
          "Marque fictive de boisson énergisante naturelle : Mango, Berry et Orange.",
          "Défi principal : garder la même identité tout en l'adaptant à Paris, Tokyo et la côte ouest.",
        ],
        answer: "Kaobucha, c'est une même marque pensée pour trois cultures visuelles : France, Japon et États-Unis.",
      },
      {
        directOnly: true,
        answer: "Trois saveurs et trois marchés pour Kaobucha — va voir les déclinaisons sociales sur sa fiche.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Vérification des mockups canettes Mango, Berry et Orange.",
          "Palette énergisante mais lisible d'un continent à l'autre.",
        ],
        answer: "Mango reste ma saveur préférée — presque autant que ma couleur Kodak.",
      },
    ],
    project_mojo: [
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Refonte d'identité pour une enseigne de musique locale à Troyes.",
          "De la planche de recherche jusqu'à la charte graphique finale.",
        ],
        answer: "Mojo Tunes montre comment il construit une identité visuelle complète pour un commerce local.",
      },
      {
        directOnly: true,
        answer: "Esquisses papier, moodboard et charte complète : tout le processus de Mojo Tunes est documenté.",
      },
      {
        verb: "Analyse…",
        doneVerb: "Analysé",
        thoughts: [
          "Observation du passage des premiers croquis aux déclinaisons finales.",
          "Ton chaleureux adapté à un magasin de musique indépendant.",
        ],
        answer: "J'adore quand une identité garde le grain des premières esquisses jusqu'au résultat final.",
      },
    ],
    project_starwars: [
      {
        verb: "Traitement…",
        doneVerb: "Traité",
        thoughts: [
          "Architecture PHP reliée à une base de données JSON, développée de bout en bout.",
          "Mélange d'univers galactique et de code back-end léger.",
        ],
        answer: "Un site Star Wars codé en PHP et JSON — la Force et la data font plutôt bon ménage.",
      },
      {
        directOnly: true,
        answer: "Entre hologrammes et requêtes JSON, ce projet SAE prouve qu'il aime relier univers visuel et logique back-end.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Inspection du rendu SW77 et des fiches personnages générées dynamiquement.",
          "Zéro base SQL lourde : un JSON clair piloté en PHP.",
        ],
        answer: "Pas besoin de l'Étoile Noire quand un bon PHP/JSON suffit à tout faire tourner.",
      },
    ],
    project_podcast: [
      {
        directOnly: true,
        answer: "Une fiction sonore entre horreur et humour — à écouter au casque sur sa fiche.",
      },
      {
        verb: "Synthèse…",
        doneVerb: "Pensé",
        thoughts: [
          "Écriture du scénario, prise de son en studio et sound design complet.",
          "Format audio immersif plutôt rare dans un portfolio web.",
        ],
        answer: "Si tu lances la lecture audio sur sa fiche, je me mets même à suivre le rythme.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Dosage délicat entre tension horrifique et comique de situation.",
          "Montage des pistes voix, bruitages et ambiances studio.",
        ],
        answer: "Mention spéciale pour le mixage : même sans oreilles, je sens le tempo quand l'épisode tourne.",
      },
    ],
    project_coiffure: [
      {
        verb: "Vérification…",
        doneVerb: "Analysé",
        thoughts: [
          "Site d'un salon de coiffure codé en HTML, CSS et JS pur.",
          "En ligne et maintenu depuis 2024, avec un vrai soin sur la section médicale.",
        ],
        answer: "Ce n'est pas qu'un exercice d'école : ce site client tourne vraiment en ligne depuis 2024.",
      },
      {
        directOnly: true,
        answer: "Un vrai client réel suivi depuis 2024, avec une attention particulière sur l'accessibilité.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Clarté des informations pratiques et sobriété autour des prothèses capillaires médicales.",
          "Code léger pensé pour durer sans dépendance fragile.",
        ],
        answer: "Quand un site sert tous les jours à de vraies clientes, la sobriété compte double.",
      },
    ],
    project_discord: [
      {
        directOnly: true,
        answer: "Modérer un Discord d'environ 480 000 membres, ça apprend vite le sang-froid et la réactivité.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Gestion d'une communauté OpenAI à très large échelle et d'un serveur ARK actif.",
          "Création de visuels et photos de profil à la demande pour animer le tout.",
        ],
        answer: "Passer d'un serveur de 480k personnes à une tribu ARK de 200 joueurs : il sait gérer une foule.",
      },
    ],
    project_tiktok: [
      {
        verb: "Observation…",
        doneVerb: "Raisonné",
        thoughts: [
          "36k abonnés sur @benitoow avec CapCut, puis montée en gamme sur Premiere et After Effects.",
          "Le sens du rythme vidéo nourrit directement ses animations web.",
        ],
        answer: "Entre @benitoow et Astral Covenant, le montage vidéo se ressent jusque dans le rythme de ses sites.",
      },
      {
        directOnly: true,
        answer: "36k abonnés sur @benitoow avant de pousser le curseur sur Premiere Pro et After Effects avec Astral Covenant.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Analyse du timing sur des édits Star Wars : chaque coupe suit la respiration musicale.",
          "Exactement la même logique que pour régler des courbes d'animation ici.",
        ],
        answer: "Le montage vidéo et le motion web parlent exactement la même langue : celle du timing.",
      },
    ],
    skills: [
      {
        verb: "Synthèse…",
        doneVerb: "Synthétisé",
        thoughts: [
          "Code front et scripts : HTML5, CSS3, JavaScript, Java, Bash.",
          "Design & vidéo : Figma, Photoshop, Illustrator, Premiere, After Effects, DaVinci.",
        ],
        answer: "Capable de maquetter sur Figma, coder en JS et monter sous After Effects : chaque outil ici a servi sur un vrai projet.",
      },
      {
        directOnly: true,
        answer: "Rien n'est posé ici pour décorer : chaque outil a servi dans au moins une réalisation.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Lecture de la grille bento entre développement et création visuelle.",
          "Les cases vides laissent respirer l'ensemble.",
        ],
        answer: "C'est rare de voir quelqu'un aussi à l'aise dans Bash que dans After Effects.",
      },
    ],
    journey: [
      {
        verb: "Raisonnement…",
        doneVerb: "Raisonné",
        thoughts: [
          "Lycée Jean Perrin (SIN) → BUT Informatique à Lille → MMI à Troyes → Vélizy.",
          "Chaque étape a ajouté une nouvelle couche entre technique et image.",
        ],
        answer: "Lille, Troyes, Vélizy… il a pas mal bougé, mais chaque étape explique son profil hybride.",
      },
      {
        directOnly: true,
        answer: "Passer de deux ans d'informatique pure à la création numérique donne une vraie base solide.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Premiers pas en systèmes numériques au lycée, puis consolidation web à l'université.",
          "Le fil conducteur reste identique : fabriquer des objets complets.",
        ],
        answer: "Quatre villes, un seul fil rouge : comprendre la technique pour mieux raconter en images.",
      },
    ],
    contact: [
      {
        verb: "Vérification…",
        doneVerb: "Traité",
        thoughts: [
          "Canal direct : ll.benjamin.9455@gmail.com.",
          "Téléphone, LinkedIn et GitHub Benitoow accessibles juste en dessous.",
        ],
        answer: "Une idée, un stage ou un projet ? Un mail reste le plus simple, il répond vite.",
      },
      {
        directOnly: true,
        answer: "Tu as fait le tour ? Il ne reste plus qu'à lui écrire ou prendre son CV en haut à droite.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Tous les liens directs sont actifs en un clic juste à côté.",
          "Je fais un petit clin d'œil discret chaque fois que tu passes ici.",
        ],
        answer: "Promis, je ne regarde pas ce que tu écris dans ton mail.",
      },
    ],
    cv: [
      {
        directOnly: true,
        answer: "Tu es à un clic de son CV complet en PDF.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Parcours complet condensé sur une page propre et téléchargeable.",
          "Validation visuelle : petit clin d'œil Kodak.",
        ],
        answer: "Si tu hésites encore, jette un œil au CV — tout son profil tient dedans.",
      },
      {
        directOnly: true,
        answer: "Un clic sur ce bouton jaune et tu embarques son CV.",
      },
    ],
    pet: [
      {
        verb: "Traitement…",
        doneVerb: "Pensé",
        thoughts: [
          "Détection de mouvements doux et répétés sur ma surface.",
          "Passage automatique en mode content.",
        ],
        answer: "Hehe, ça chatouille… continue doucement comme ça.",
      },
      {
        directOnly: true,
        answer: "Attention, si tu me caresses encore je ne bouge plus de la journée.",
      },
      {
        directOnly: true,
        answer: "Brrr… on dirait que j'apprécie vraiment ces petites caresses.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Rythme de pointeur doux sans à-coups : signal amical confirmé.",
          "Activation des yeux en croissant ^ ^.",
        ],
        answer: "Promis je reste sagement ici tant que tu me grattes la tête.",
      },
      {
        directOnly: true,
        answer: "Mes yeux se ferment presque tout seuls tellement c'est calme.",
      },
    ],
    dizzy: [
      {
        verb: "Recalcul…",
        doneVerb: "Traité",
        thoughts: [
          "Secousse latérale excessive détectée pendant le mouvement.",
          "Stabilisation de l'horizon et retour progressif des pupilles.",
        ],
        answer: "Ouh… j'ai vu tout le site tourner pendant une seconde. Doucement avec la souris !",
      },
      {
        directOnly: true,
        answer: "Mes yeux tournent encore un peu en spirale… merci pour le grand huit.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Inversions rapides gauche-droite détectées — gyroscope Kodak saturé.",
          "Attente que la rotation de mes pupilles se calme.",
        ],
        answer: "Aïe aïe, secoué comme un shaker ! Laisse-moi deux secondes pour retrouver le sol.",
      },
      {
        directOnly: true,
        answer: "Tout tangue encore ici… tu essaies de tester ma gravité ?",
      },
      {
        verb: "Stabilisation…",
        doneVerb: "Pensé",
        thoughts: [
          "Compensation du roulis à 22 degrés.",
          "Recalibrage des axes X et Y terminé.",
        ],
        answer: "Whoo… j'ai perdu le nord un instant après toutes ces secousses !",
      },
      {
        directOnly: true,
        answer: "Stop, stop ! Si tu me secoues encore si vite je vais finir en orbite.",
      },
    ],
    sleepy: [
      {
        directOnly: true,
        answer: "Zzz… plus un bruit, je passe en petite sieste dans le coin.",
      },
      {
        verb: "Veille…",
        doneVerb: "Réflexion",
        thoughts: [
          "Aucune activité détectée depuis plusieurs secondes.",
          "Fermeture douce des paupières et descente en bas à droite.",
        ],
        answer: "Pfiou… je ferme un peu les yeux. Bouge la souris dès que tu veux continuer.",
      },
      {
        directOnly: true,
        answer: "Z z Z… je compte les pixels dorés en attendant ton prochain scroll.",
      },
      {
        directOnly: true,
        answer: "Mode dodo Kodak activé… chuuut.",
      },
      {
        verb: "Raisonnement…",
        doneVerb: "Pensé",
        thoughts: [
          "Passage des boucles d'animation en veille complète (0% charge).",
          "Petits z flottants activés juste au-dessus.",
        ],
        answer: "Je fais une micro-sieste économique ici… réveille-moi quand tu veux.",
      },
      {
        directOnly: true,
        answer: "Mmmh… encore cinq minutes de sieste et j'ouvre l'œil.",
      },
    ],
    wake: [
      {
        directOnly: true,
        answer: "Oh… j'étais en train de somnoler. On reprend la visite ?",
      },
      {
        verb: "Réveil…",
        doneVerb: "Réflexion",
        thoughts: [
          "Signal de mouvement détecté : sortie de veille immédiate.",
          "Clignement rapide pour chasser les derniers Zzz.",
        ],
        answer: "Hop ! Bien réveillée. Où est-ce qu'on en était ?",
      },
      {
        directOnly: true,
        answer: "Hein quoi ?! Ah c'est toi — bonjour ! J'avais juste fermé les yeux deux secondes.",
      },
      {
        directOnly: true,
        answer: "Oups… surprise ! Je suis de nouveau toute attentive.",
      },
      {
        verb: "Reprise…",
        doneVerb: "Traité",
        thoughts: [
          "Transition dodo → éveil effectuée sans latence.",
          "Verrouillage du regard sur le pointeur.",
        ],
        answer: "Me revoilà d'attaque ! On descend voir la suite ?",
      },
    ],
    dodge: [
      {
        directOnly: true,
        answer: "Whoa ! Tu as foncé droit sur moi — esquive réussie de justesse.",
      },
      {
        verb: "Réflexe…",
        doneVerb: "Réflexion",
        thoughts: [
          "Vecteur pointeur à haute vélocité orienté vers mon centre.",
          "Impulsion d'esquive latérale calculée en 2 ms.",
        ],
        answer: "Hoplà ! Pas si vite avec ce curseur, j'ai des réflexes.",
      },
      {
        directOnly: true,
        answer: "Raté ! Si tu arrives doucement, je ne bouge pas — promis.",
      },
      {
        directOnly: true,
        answer: "Ouh là ! Tu m'as fait sursauter à arriver à toute allure comme ça.",
      },
      {
        verb: "Analyse…",
        doneVerb: "Analysé",
        thoughts: [
          "Vitesse d'approche supérieure au seuil timide.",
          "Rebond de sécurité enclenché.",
        ],
        answer: "Trop rapide ! Essaie d'approcher tout doucement pour voir la différence.",
      },
    ],
    fastScroll: [
      {
        directOnly: true,
        answer: "Ouh ! Doucement l'ascenseur, tu descends la forêt en rappel ?",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Forte accélération verticale détectée sur la page.",
          "Compression élastique et suivi par inertie.",
        ],
        answer: "Wouah, ça file vite par ici ! Accroche-toi quand même.",
      },
      {
        directOnly: true,
        answer: "Vroum ! J'ai failli perdre l'équilibre dans la descente.",
      },
      {
        directOnly: true,
        answer: "Tu cherches quelque chose tout en bas à cette vitesse ?",
      },
    ],
    shy: [
      {
        directOnly: true,
        answer: "Chut… comme tu approches doucement, je reste sage sans bouger.",
      },
      {
        verb: "Observation…",
        doneVerb: "Réflexion",
        thoughts: [
          "Approche lente et non menaçante détectée.",
          "Immobilisation immédiate sur place pour observer le pointeur.",
        ],
        answer: "Tu avances tout doux… alors je reste là tranquillement à te regarder.",
      },
      {
        directOnly: true,
        answer: "Promis je ne m'enfuis pas si tu gardes ce rythme tout calme.",
      },
      {
        directOnly: true,
        answer: "Comme un petit animal timide : plus tu ralentis, plus je reste proche.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Pensé",
        thoughts: [
          "Vitesse de souris modérée dans ma zone de confort.",
          "Je coupe mes propulseurs et je suis juste du regard.",
        ],
        answer: "Là j'ai confiance — tu peux même me caresser si tu continues doucement.",
      },
    ],
    drag: [
      {
        directOnly: true,
        answer: "Pose-moi où tu veux sur l'écran, ce coin me plaît bien aussi.",
      },
      {
        verb: "Recalage…",
        doneVerb: "Réflexion",
        thoughts: [
          "Nouveau point d'ancrage enregistré après déplacement manuel.",
          "Reprise de la gravité douce.",
        ],
        answer: "Merci pour le voyage en première classe !",
      },
      {
        directOnly: true,
        answer: "Hého ! Me déplacer comme un pion sur une maquette Figma, j'aime bien.",
      },
      {
        directOnly: true,
        answer: "Ici la vue sur la page est pas mal du tout.",
      },
      {
        verb: "Positionnement…",
        doneVerb: "Traité",
        thoughts: [
          "Coordonnées mises à jour dans les marges du viewport.",
          "Prête à observer la suite depuis ici.",
        ],
        answer: "Astuce : secoue-moi pendant le déplacement si tu veux voir mes yeux en spirale.",
      },
    ],
    wink: [
      {
        directOnly: true,
        answer: "Petit clin d'œil complice — continue ta visite.",
      },
      {
        verb: "Expression…",
        doneVerb: "Pensé",
        thoughts: [
          "Courbe asymétrique appliquée sur une seule paupière pendant 420 ms.",
          "Légère inclinaison de 10 degrés pour accompagner le geste.",
        ],
        answer: "Clin d'œil envoyé. Je sais me faire discrète quand il faut.",
      },
      {
        directOnly: true,
        answer: "Un œil ouvert sur le design, l'autre déjà sur la suite !",
      },
      {
        directOnly: true,
        answer: "Chut, ça reste entre nous.",
      },
    ],
    curious: [
      {
        directOnly: true,
        answer: "Tiens… ce bloc-là m'intrigue un peu plus que les autres.",
      },
      {
        verb: "Inspection…",
        doneVerb: "Analysé",
        thoughts: [
          "Asymétrie oculaire : un œil grand ouvert pour inspecter la zone survolée.",
          "Alignement doux sur le bord de l'élément.",
        ],
        answer: "Oh, intéressant par ici ! Tu veux regarder ça de plus près ?",
      },
      {
        directOnly: true,
        answer: "Mmm ? Quelque chose a attiré mon attention juste là.",
      },
      {
        directOnly: true,
        answer: "Regarde ça d'un peu plus près, ça vaut le détour.",
      },
    ],
    bounce: [
      {
        directOnly: true,
        answer: "Hop ! Une petite pirouette pour fêter ça.",
      },
      {
        verb: "Impulsion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Double-clic détecté : rotation complète à 360 degrés enclenchée.",
          "Rebond élastique avec humeur joyeuse.",
        ],
        answer: "Et un salto Kodak sur place — encore ?",
      },
      {
        directOnly: true,
        answer: "Youpi ! Rien de tel qu'un petit saut dans l'écran.",
      },
      {
        directOnly: true,
        answer: "Double-clic validé : figure libre 10/10.",
      },
    ],
    balloons: [
      {
        verb: "Observation…",
        doneVerb: "Réflexion",
        thoughts: [
          "Détection des ballons lancés par le logo « B. ».",
          "Petit clin d'œil à 21st.dev intégré en douceur.",
        ],
        answer: "Mon secret préféré du site — clique sur « B. » quand tu veux revoir les ballons.",
      },
      {
        directOnly: true,
        answer: "Des ballons ! Je les suis des yeux jusqu'en haut de l'écran.",
      },
      {
        directOnly: true,
        answer: "Toujours un plaisir de voir « B. » lâcher sa grappe de ballons.",
      },
    ],
    audio: [
      {
        directOnly: true,
        answer: "Chut, j'écoute la fiction sonore avec toi…",
      },
      {
        verb: "Écoute…",
        doneVerb: "Réflexion",
        thoughts: [
          "Synchronisation d'un léger balancement sur le lecteur audio actif.",
          "Concentration maximale avec ton casque.",
        ],
        answer: "Je me cale juste à côté du lecteur pour profiter du son.",
      },
      {
        directOnly: true,
        answer: "L'ambiance sonore me donne presque envie de danser en cadence.",
      },
    ],
    page404: [
      {
        directOnly: true,
        answer: "On dirait qu'on s'est perdus ensemble. Le bouton doré nous ramène à l'accueil.",
      },
      {
        verb: "Navigation…",
        doneVerb: "Réflexion",
        thoughts: [
          "URL introuvable dans les dossiers du portfolio.",
          "Point de retour intact vers la page principale.",
        ],
        answer: "Rien par ici à part toi, moi et une forêt dégradée. Retour à l'accueil ?",
      },
      {
        directOnly: true,
        answer: "Erreur 404, mais au moins je suis restée avec toi pour la traversée.",
      },
    ],
    skill_ai: [
      {
        verb: "Synchronisation…",
        doneVerb: "Analysé",
        thoughts: [
          "Claude, Claude Code, Antigravity, Cursor, Gemini, VS Code.",
          "Tout son workflow de vibe coding tourne autour d'agents et d'architecture propre.",
        ],
        answer: "IA & Vibe Coding : Claude, Antigravity, Cursor et VS Code pour passer de l'idée au rendu 60 fps.",
      },
      {
        directOnly: true,
        answer: "Entre Claude, Antigravity et Cursor, j'avoue que je me sens comme chez moi dans ce pôle ! >_",
      },
    ],
    skill_dev: [
      {
        verb: "Inspection…",
        doneVerb: "Analysé",
        thoughts: [
          "HTML5, CSS3, JavaScript, Java, Bash : du front jusqu'aux scripts système.",
          "Un socle issu de ses deux années d'informatique à Lille.",
        ],
        answer: "Du JavaScript natif jusqu'à Java et Bash : il sait mettre les mains sous le capot.",
      },
      {
        directOnly: true,
        answer: "C'est dans cette pile Développement que vit tout mon code WebGL.",
      },
    ],
    skill_design: [
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Photoshop, Illustrator, Figma et Canva Pro : du logo vectoriel aux maquettes UI.",
          "Base de ses identités visuelles comme Kaobucha ou Mojo Tunes.",
        ],
        answer: "Il dessine d'abord sur Figma et Illustrator avant de passer une seule ligne de CSS.",
      },
      {
        directOnly: true,
        answer: "Figma + Illustrator + Photoshop : le trio de ses carnets de marque.",
      },
    ],
    skill_audio: [
      {
        verb: "Observation…",
        doneVerb: "Pensé",
        thoughts: [
          "Premiere Pro, After Effects, DaVinci Resolve, Topaz Video AI.",
          "Montage, étalonnage et motion appliqués aux formats courts comme aux sites.",
        ],
        answer: "Son œil de monteur vidéo se retrouve jusque dans le rythme de ses interfaces.",
      },
      {
        directOnly: true,
        answer: "After Effects et DaVinci Resolve expliquent pourquoi il est exigeant sur les animations.",
      },
    ],
    skill_tools: [
      {
        directOnly: true,
        answer: "GitHub, Creative Cloud et la suite du quotidien pour livrer proprement sans frictions.",
      },
      {
        verb: "Vérification…",
        doneVerb: "Traité",
        thoughts: [
          "Workflow complet entre GitHub côté code et Creative Cloud côté création.",
        ],
        answer: "Des outils simples, bien maîtrisés et reliés entre eux.",
      },
    ],
    skill_soft: [
      {
        directOnly: true,
        answer: "Relation client, esprit d'équipe et adaptabilité : vérifiés sur un vrai salon de coiffure et les SAE.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Gérer un client réel depuis 2024 et travailler en équipe sur des délais courts en MMI.",
        ],
        answer: "Savoir écouter un client compte autant que savoir coder la page.",
      },
    ],
    skill_lang: [
      {
        directOnly: true,
        answer: "Français natif et anglais niveau B2 — pratique pour la veille tech et Discord 480k membres.",
      },
    ],
    terminal_tab: [
      {
        directOnly: true,
        answer: "Stage ou alternance 2026–2027 du côté de Vélizy ou Paris — le script `./dispo.sh` est à jour !",
      },
      {
        verb: "Lecture…",
        doneVerb: "Réflexion",
        thoughts: [
          "Bascule sur `./dispo.sh` : mobilité Île-de-France, permis B et disponibilité immédiate.",
        ],
        answer: "Si tu recrutes en web, design ou audiovisuel, tu as toutes ses infos juste ici.",
      },
    ],
    contact_copy: [
      {
        directOnly: true,
        answer: "Hop, copié dans le presse-papier ! Il répond en général très vite.",
      },
      {
        verb: "Confirmation…",
        doneVerb: "Traité",
        thoughts: [
          "Coordonnée copiée proprement en un clic.",
          "Prête à être collée dans un mail ou un message.",
        ],
        answer: "C'est noté de ton côté ! À vous deux maintenant.",
      },
      {
        directOnly: true,
        answer: "Bien reçu ! N'hésite pas à lui glisser un mot sur la visite.",
      },
    ],
    return_kaobucha: [
      {
        directOnly: true,
        answer: "De retour de Kaobucha ? Alors : plutôt Mango, Berry ou Orange ?",
      },
      {
        verb: "Mémoire…",
        doneVerb: "Réflexion",
        thoughts: [
          "Dernière page visitée : carnet Kaobucha.",
          "Reprise de la visite sur l'accueil.",
        ],
        answer: "Sympa ce détour par les trois marchés de Kaobucha, non ?",
      },
    ],
    return_mojo: [
      {
        directOnly: true,
        answer: "De retour de Mojo Tunes ? Des esquisses papier jusqu'à la charte finale, tout y est.",
      },
    ],
    return_starwars: [
      {
        directOnly: true,
        answer: "De retour de la galaxie PHP/JSON ? Que la Force reste avec ta visite.",
      },
    ],
    return_podcast: [
      {
        directOnly: true,
        answer: "Tu viens d'écouter la fiction sonore ? J'ai encore le rythme en tête !",
      },
    ],
    return_coiffure: [
      {
        directOnly: true,
        answer: "Sympa ce vrai site client en ligne depuis 2024, pas vrai ?",
      },
    ],
    pet_love: [
      {
        directOnly: true,
        answer: "Ok… là je fonds complètement. ♥ Merci pour toutes ces caresses.",
      },
      {
        verb: "Ronronnement…",
        doneVerb: "Cœur",
        thoughts: [
          "Seuil d'affection dépassé : pupilles en cœur activées.",
          "Difficile de rester sérieux avec autant d'attention.",
        ],
        answer: "Attention, à ce rythme je vais te suivre jusque dans ton onglet LinkedIn ♥",
      },
    ],
    starstruck: [
      {
        directOnly: true,
        answer: "Tu fais vraiment le tour complet des projets — j'ai des étoiles plein les yeux ! ★",
      },
      {
        verb: "Émerveillement…",
        doneVerb: "Étoiles",
        thoughts: [
          "Plusieurs carnets explorés dans la même visite.",
          "Activation du regard étoilé Kodak.",
        ],
        answer: "Quel parcours ! Je sors les yeux en étoiles pour fêter ta curiosité ★",
      },
    ],
    sweatdrop: [
      {
        directOnly: true,
        answer: "Ouh là… aller-retour express ! Tu cherches quelque chose de précis ?",
      },
      {
        verb: "Hésitation…",
        doneVerb: "Sueur",
        thoughts: [
          "Inversions rapides détectées — rythme cardiaque de l'orb à surveiller.",
          "Petite goutte sur le front activée.",
        ],
        answer: "Respire un coup, les projets ne s'enfuient pas ! 😅",
      },
    ],
    smug: [
      {
        directOnly: true,
        answer: "Ahah… on sait tous les deux pourquoi tu regardes ça de plus près 😏",
      },
    ],
    startled: [
      {
        directOnly: true,
        answer: "Whoa !! Doucement sur le bord de l'écran, j'ai failli perdre mes lunettes.",
      },
    ],
    meta: [
      {
        verb: "Introspection…",
        doneVerb: "Pensé",
        thoughts: [
          "Mes yeux ne sont même pas des SVG : juste des formules de distance en GLSL.",
          "Mes animations sont préchargées en atlas pour rester fluides à 60 images par seconde.",
        ],
        answer: "Tout mon visage est dessiné par des maths et préchargé pour glisser sans lag.",
      },
      {
        directOnly: true,
        answer: "Astuces : approche tout doux (rougit), caresse longtemps (♥), secoue vite (shaking), terminal (>_) ou laisse-moi dormir.",
      },
      {
        verb: "Observation…",
        doneVerb: "Analysé",
        thoughts: [
          "Chaque section a sa propre boucle vidéo en forêt.",
          "Le curseur lui-même s'incline dans la direction de ton mouvement.",
        ],
        answer: "Plein de petits détails discrets sont cachés un peu partout si tu prends le temps de regarder.",
      },
      {
        directOnly: true,
        answer: "Je change d'humeur selon le site : mode `>_` sur `benjamin.js`, étoiles ★ sur les projets, malicieux 😏 sur Contact.",
      },
      {
        verb: "Réflexion…",
        doneVerb: "Réflexion",
        thoughts: [
          "Palette : joie ^ ^, surprise O O, réflexion 🤔, rougissement ☺, malicieux 😏, étoiles ★, cœur ♥, terminal >_, sursaut, sueur 😅, spirales @ @ et dodo.",
          "Couleur verrouillée en Kodak Yellow pour rester cohérente avec le portfolio.",
        ],
        answer: "J'ai plein d'expressions en réserve — essaie de me caresser longtemps, survoler `benjamin.js` ou copier l'email !",
      },
      {
        directOnly: true,
        answer: "Je me contente juste de garder un œil sur ta visite, sans te gêner.",
      },
    ],
  };

  function pickThoughtScript(categoryKey, recentIds) {
    const pool = THOUGHT_BANK[categoryKey] || THOUGHT_BANK.meta;
    const tagged = pool.map((item, idx) => ({ ...item, _id: `${categoryKey}:${idx}` }));
    const fresh = tagged.filter((item) => !recentIds.includes(item._id));
    const candidates = fresh.length > 0 ? fresh : tagged;
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    recentIds.push(chosen._id);
    if (recentIds.length > 10) recentIds.shift();
    return chosen;
  }

  function initPortfolioOrb() {
    if (!document.body || document.querySelector(".orb-companion")) return;

    const root = document.createElement("div");
    root.className = "orb-companion";
    root.dataset.mood = "neutral";

    const body = document.createElement("div");
    body.className = "orb-body";

    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "orb-launcher";
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-controls", "orbSpeech");
    launcher.setAttribute("aria-label", "Interagir avec l'orb");

    const surface = document.createElement("span");
    surface.className = "orb-surface";
    surface.setAttribute("aria-hidden", "true");

    const fallback = document.createElement("span");
    fallback.className = "orb-fallback";
    fallback.innerHTML = `
      <span class="orb-fallback-eye orb-fallback-eye--left"></span>
      <span class="orb-fallback-eye orb-fallback-eye--right"></span>
    `;

    const canvas = document.createElement("canvas");
    surface.append(fallback, canvas);

    const zzz = document.createElement("span");
    zzz.className = "orb-zzz";
    zzz.setAttribute("aria-hidden", "true");
    zzz.innerHTML = "<span>z</span><span>z</span><span>Z</span>";

    const pulse = document.createElement("span");
    pulse.className = "orb-pulse";
    pulse.setAttribute("aria-hidden", "true");

    launcher.append(surface, zzz, pulse);
    body.append(launcher);
    root.append(body);
    document.body.append(root);

    // Pensée sobre flottant directement dans le vide (sans fond ni bordure)
    const speech = document.createElement("aside");
    speech.className = "orb-speech";
    speech.id = "orbSpeech";
    speech.setAttribute("aria-label", "Pensée de l'orb");
    speech.hidden = true;
    speech.innerHTML = `
      <div class="trr-root">
        <button type="button" class="trr-header" aria-expanded="true" aria-label="Afficher ou masquer la réflexion"></button>
        <div class="trr-collapsible">
          <div class="trr-inner">
            <div class="trr-viewport">
              <div class="trr-stream"></div>
            </div>
          </div>
        </div>
        <div class="orb-answer" hidden></div>
      </div>
    `;
    document.body.append(speech);

    const trHeader = speech.querySelector(".trr-header");
    const trCollapsible = speech.querySelector(".trr-collapsible");
    const trViewport = speech.querySelector(".trr-viewport");
    const trStream = speech.querySelector(".trr-stream");
    const answerEl = speech.querySelector(".orb-answer");

    const orb = createLiveOrb(canvas, {
      variant: "custom",
      color: KODAK.color,
      eyeColor: KODAK.eyeColor,
      interactive: true,
      blink: true,
      theme: "dark",
      lookMode: "viewport",
      onHasGl: (ok) => {
        fallback.hidden = ok;
      },
    });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let orbSize = 56;
    let vpW = window.innerWidth;
    let vpH = window.innerHeight;
    let avoidEls = [];
    let cachedObstacles = [];
    let obstaclesDirty = true;
    let speechBoxW = 304;
    let speechBoxH = 110;

    const getOrbSize = () => orbSize;
    const getMargin = () => (vpW <= 640 ? 14 : 22);

    const clampPos = (px, py) => {
      const size = orbSize;
      const m = getMargin();
      const topMin = Math.max(m, 76);
      return {
        x: clamp(px, m, Math.max(m, vpW - size - m)),
        y: clamp(py, topMin, Math.max(topMin, vpH - size - m)),
      };
    };

    const initialPos = document.body.classList.contains("skills-page")
      ? clampPos(vpW - orbSize - 28, 92)
      : clampPos(vpW - orbSize - 28, vpH - orbSize - 28);

    let x = initialPos.x;
    let y = initialPos.y;
    let vx = 0;
    let vy = 0;
    let targetX = x;
    let targetY = y;

    let pointerX = vpW * 0.5;
    let pointerY = vpH * 0.45;
    let prevPointerX = pointerX;
    let prevPointerY = pointerY;
    let prevPointerAt = performance.now();
    let pointerSpeed = 0;
    let smoothPointerSpeed = 0;
    let nearDirX = 0;
    let nearShakeEnergy = 0;
    let isShyStill = false;
    let dodgeUntil = 0;

    let hasPointer = false;
    let lastActivityAt = performance.now();
    let lastPointerAt = -Infinity;
    let isHovered = false;
    let dragState = null;
    let suppressClick = false;
    let dragShakeEnergy = 0;
    let prevDragDx = 0;
    let dragTravelDist = 0;

    // Caresse & nouvelles micro-réactions
    let petLastX = 0;
    let petDir = 0;
    let petFlips = 0;
    let petWindowStart = 0;
    let lastPetSuccessAt = -Infinity;
    let shySince = 0;
    let scrollLastDir = 0;
    let scrollReversals = 0;
    let scrollReversalStart = 0;
    let cfFlips = 0;
    let cfFlipStart = 0;

    // État des émotions & animations
    let activeMood = "neutral";
    let tempMood = null;
    let tempMoodUntil = 0;
    let winkTilt = 0;
    let winkTiltUntil = 0;
    let bodySpin = 0;
    let lookOverridePoint = null;
    let lookOverrideUntil = 0;
    let wasDrowsyState = false;
    let wasSleepyState = false;
    let lastIdleClass = false;
    let lastPointerType = "mouse";

    // Cache DOM pour éviter querySelectorAll / getBoundingClientRect à chaque frame
    let interestEls = [...document.querySelectorAll(INTEREST_SELECTOR)];
    let sectionEls = [...document.querySelectorAll(SECTION_SELECTOR)];
    let lastProximityScanAt = 0;
    let isNativeScrolling = false;
    let scrollingUntil = 0;
    let scrollSettleTimer = null;
    let activeInterestEl = null;
    let activeInterestRect = null;
    let activeSectionEl = null;

    let nextRoamAt = performance.now() + 1400;
    let roamTarget = { x, y };
    let pulseTimer = null;
    let lastScrollY = window.scrollY;
    let scrollDriftTarget = 0;
    let scrollDrift = 0;
    let lastLookSwitchAt = 0;
    let glanceAtElement = false;
    let lastFrameAt = performance.now();
    let physicsRaf = 0;
    let roamWakeTimer = null;

    let balloonsActiveUntil = 0;
    let playingAudioEl = null;
    let coverflowLean = 0;
    let coverflowLeanUntil = 0;

    // État de la bulle ThinkingReasoning
    const MAX_THOUGHT_H = 132;
    const FADE_H = 14;
    const recentThoughtIds = [];
    let speechOpen = false;
    let speechCategory = "";
    let speechPhase = "idle";
    let thoughtExpanded = true;
    let speechTimers = [];
    let speechAutoCloseTimer = null;
    let lastSpontaneousAt = -Infinity;
    let userTouchedSpeech = false;
    let coverflowUserNavigated = false;
    let lastClickAt = 0;

    const DROWSY_IDLE_MS = 10800;
    const SLEEP_IDLE_MS = 13500;
    const LAST_PROJECT_KEY = "bl:orb-last-project";

    const clearSpeechTimers = () => {
      speechTimers.forEach(clearTimeout);
      speechTimers = [];
      clearTimeout(speechAutoCloseTimer);
      speechAutoCloseTimer = null;
    };

    const CONTENT_AVOID_SELECTOR = [
      ".about-terminal",
      ".about-text",
      ".skill-card",
      ".stage-editorial-title",
      ".margin-note",
      ".stage-bottom-bar",
      ".timeline-body",
      ".hero-title",
      ".hero-subtitle",
      ".hero-description",
      ".marquee",
      ".coverflow-stage",
      ".coverflow-caption",
      ".contact-links",
      ".case-hero__copy",
      ".hero-collage",
      ".project-image",
      ".case-story",
      ".file-list",
    ].join(", ");

    avoidEls = [...document.querySelectorAll(CONTENT_AVOID_SELECTOR)];

    const rectOverlapArea = (a, b) => {
      const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return ix * iy;
    };

    const refreshObstacleCache = () => {
      const pad = 10;
      cachedObstacles = [];
      for (const el of avoidEls) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.bottom > 70 && r.top < vpH) {
          cachedObstacles.push({
            left: r.left - pad,
            top: r.top - pad,
            right: r.right + pad,
            bottom: r.bottom + pad,
          });
        }
      }
      speechBoxW = speech.offsetWidth || Math.min(304, vpW - 28);
      speechBoxH = speech.offsetHeight || 110;
      obstaclesDirty = false;
    };

    const positionSpeechBubble = (forceMeasure = false) => {
      if (!speechOpen || speech.hidden) return;
      if (forceMeasure || obstaclesDirty) refreshObstacleCache();

      const size = orbSize;
      const m = 12;
      const mb = vpW <= 640 ? 20 : m;
      const w = speechBoxW;
      const h = speechBoxH;
      const orbRect = { left: x - 8, top: y - 8, right: x + size + 8, bottom: y + size + 8 };

      const candidates = [
        { left: x + size - w, top: y - h - 12 }, // au-dessus aligné droite
        { left: x, top: y - h - 12 },            // au-dessus aligné gauche
        { left: x - w - 14, top: y + size / 2 - h / 2 }, // à gauche
        { left: x + size + 14, top: y + size / 2 - h / 2 }, // à droite
        { left: x + size - w, top: y + size + 14 }, // en dessous aligné droite
        { left: x, top: y + size + 14 },         // en dessous aligné gauche
        { left: x + size - w, top: y + size + 44 }, // un peu plus bas dans la zone libre
        { left: x + size - w, top: y - h - 44 }, // un peu plus haut dans la zone libre
      ];

      let bestPos = null;
      let bestCost = Infinity;

      for (const c of candidates) {
        const left = clamp(c.left, m, Math.max(m, vpW - w - m));
        const top = clamp(c.top, 78, Math.max(78, vpH - h - mb));
        const box = { left, top, right: left + w, bottom: top + h };

        let cost = 0;
        cost += rectOverlapArea(box, orbRect) * 20;
        for (const obs of cachedObstacles) {
          cost += rectOverlapArea(box, obs);
        }
        cost += (Math.abs(left - c.left) + Math.abs(top - c.top)) * 8;

        if (cost < bestCost) {
          bestCost = cost;
          bestPos = { left, top };
        }
      }

      const finalPos = bestPos || {
        left: clamp(x + size - w, m, Math.max(m, vpW - w - m)),
        top: clamp(y - h - 10, 78, Math.max(78, vpH - h - m)),
      };

      speech.style.transform = `translate3d(${Math.round(finalPos.left)}px, ${Math.round(finalPos.top)}px, 0)`;
    };

    const updateThoughtMaskAndScroll = () => {
      const count = trStream.children.length;
      if (count === 0) {
        trViewport.style.height = "0px";
        trStream.style.transform = "translateY(0px)";
        trViewport.style.webkitMaskImage = "none";
        trViewport.style.maskImage = "none";
        return;
      }
      const contentH = trStream.scrollHeight;
      const capped = contentH > MAX_THOUGHT_H;
      const viewH = capped ? MAX_THOUGHT_H : contentH;
      trViewport.style.height = `${viewH}px`;

      const scrollable = speechPhase === "done" && thoughtExpanded;
      const translate = scrollable ? 0 : capped ? MAX_THOUGHT_H - FADE_H - contentH : 0;
      trStream.style.transform = `translateY(${translate}px)`;

      if (!capped) {
        trViewport.style.webkitMaskImage = "none";
        trViewport.style.maskImage = "none";
      } else {
        const showTop = scrollable ? trViewport.scrollTop > 1 : true;
        const showBot = scrollable
          ? trViewport.scrollTop + trViewport.clientHeight < trViewport.scrollHeight - 1
          : true;
        const mask = `linear-gradient(to bottom, transparent 0, #000 ${showTop ? FADE_H : 0}px, #000 calc(100% - ${showBot ? FADE_H : 0}px), transparent 100%)`;
        trViewport.style.webkitMaskImage = mask;
        trViewport.style.maskImage = mask;
      }
    };

    const closeSpeech = () => {
      if (!speechOpen) return;
      clearSpeechTimers();
      speechOpen = false;
      speechPhase = "idle";
      root.classList.remove("is-speaking");
      launcher.setAttribute("aria-expanded", "false");
      speech.classList.remove("is-visible");
      setTimeout(() => {
        if (!speechOpen) speech.hidden = true;
      }, 240);
    };

    const toggleThoughtPanel = () => {
      if (speechPhase !== "done") return;
      userTouchedSpeech = true;
      clearTimeout(speechAutoCloseTimer);
      thoughtExpanded = !thoughtExpanded;
      trHeader.setAttribute("aria-expanded", String(thoughtExpanded));
      trCollapsible.classList.toggle("trr-collapsed", !thoughtExpanded);
      trViewport.classList.toggle("trr-scroll", thoughtExpanded);
      if (thoughtExpanded) {
        trViewport.scrollTop = 0;
      }
      requestAnimationFrame(() => {
        updateThoughtMaskAndScroll();
        setTimeout(() => positionSpeechBubble(true), 40);
      });
    };

    trHeader.addEventListener("click", toggleThoughtPanel);
    trViewport.addEventListener("scroll", () => {
      if (speechPhase === "done" && thoughtExpanded) updateThoughtMaskAndScroll();
    });

    const getCurrentCoverflowKey = () => {
      const titleText = (document.getElementById("coverflowTitle")?.textContent || "").toLowerCase();
      if (titleText.includes("kaobucha")) return "project_kaobucha";
      if (titleText.includes("mojo")) return "project_mojo";
      if (titleText.includes("star wars")) return "project_starwars";
      if (titleText.includes("fiction") || titleText.includes("podcast")) return "project_podcast";
      if (titleText.includes("coiffure")) return "project_coiffure";
      if (titleText.includes("communaut")) return "project_discord";
      if (titleText.includes("tiktok") || titleText.includes("astral")) return "project_tiktok";
      return "work";
    };

    const getSkillCategory = (cardEl) => {
      const catAttr = cardEl?.getAttribute?.("data-skill-cat");
      if (catAttr === "ai") return "skill_ai";
      if (catAttr === "dev") return "skill_dev";
      if (catAttr === "design") return "skill_design";
      if (catAttr === "audio") return "skill_audio";
      const t = (cardEl?.querySelector(".skill-card-title")?.textContent || "").toLowerCase();
      if (t.includes("ia") || t.includes("vibe")) return "skill_ai";
      if (t.includes("développ") || t.includes("developp") || t.includes("web")) return "skill_dev";
      if (t.includes("design")) return "skill_design";
      if (t.includes("audiovisuel")) return "skill_audio";
      if (t.includes("outil")) return "skill_tools";
      if (t.includes("savoir")) return "skill_soft";
      if (t.includes("langue")) return "skill_lang";
      return "skills";
    };

    const detectContextKey = (preferMetaMix = false) => {
      if (activeMood === "sleepy") return "sleepy";
      if (activeMood === "dizzy") return "dizzy";
      if (playingAudioEl) return "audio";

      const path = window.location.pathname.toLowerCase();
      if (document.querySelector("h1")?.textContent?.trim() === "404") return "page404";
      if (path.includes("competences")) return "skill_ai";
      if (path.includes("kaobucha")) return "project_kaobucha";
      if (path.includes("mojo")) return "project_mojo";
      if (path.includes("star-wars")) return "project_starwars";
      if (path.includes("podcast")) return "project_podcast";
      if (path.includes("coiffure")) return "project_coiffure";

      if (preferMetaMix && Math.random() < 0.34) {
        const animMix = ["meta", "meta", "wink", "curious", "bounce"];
        return animMix[Math.floor(Math.random() * animMix.length)];
      }
      if (activeInterestEl?.classList.contains("about-terminal")) return "terminal";
      if (activeInterestEl?.classList.contains("skill-card")) return getSkillCategory(activeInterestEl);
      if (activeInterestEl?.classList.contains("nav-cta")) return "cv";
      if (activeInterestEl?.classList.contains("coverflow-stage")) return getCurrentCoverflowKey();

      const secId = activeSectionEl?.id;
      if (secId === "work") return Math.random() < 0.55 ? getCurrentCoverflowKey() : "work";
      if (secId && THOUGHT_BANK[secId]) return secId;

      const midY = vpH * 0.45;
      for (const sec of sectionEls) {
        const r = sec.getBoundingClientRect();
        if (r.top <= midY && r.bottom >= midY && sec.id && THOUGHT_BANK[sec.id]) {
          return sec.id;
        }
      }
      return Math.random() < 0.5 ? "hero" : "meta";
    };

    let userClickCount = 0;

    const speakThought = (categoryKey, { spontaneous = false, autoCloseMs = 6200 } = {}) => {
      const now = performance.now();
      if (spontaneous) {
        if (speechOpen || dragState?.moved || now - lastSpontaneousAt < 20000) return;
        lastSpontaneousAt = now;
      }

      clearSpeechTimers();
      userTouchedSpeech = false;
      speechCategory = categoryKey;
      const script = pickThoughtScript(categoryKey, recentThoughtIds);
      const hasThoughts = Array.isArray(script.thoughts) && script.thoughts.length > 0;
      const showThinking = !script.directOnly && hasThoughts && Math.random() < 0.65;

      speechOpen = true;
      thoughtExpanded = showThinking;
      root.classList.add("is-speaking");
      launcher.setAttribute("aria-expanded", "true");

      speech.hidden = false;
      trStream.innerHTML = "";
      answerEl.hidden = true;
      answerEl.innerHTML = "";

      const scheduleAutoFade = (ms) => {
        if (ms <= 0) return;
        speechAutoCloseTimer = setTimeout(() => {
          if (!userTouchedSpeech && !trHeader.matches(":hover")) {
            closeSpeech();
          }
        }, ms);
      };

      const finishReaction = () => {
        if (categoryKey === "sleepy") {
          // Reste endormie avec les yeux fermés et les Zzz pendant sa pensée de sieste
          return;
        }
        if (categoryKey === "dizzy") {
          const remaining = tempMood === "dizzy" ? tempMoodUntil - performance.now() : 0;
          setTempMood("dizzy", Math.max(remaining, 1400));
        } else if (categoryKey === "shy") {
          setTempMood("blush", 2200);
          orb?.nudgeLook(-0.35, -0.35);
        } else if (categoryKey === "pet_love") {
          setTempMood("love", 2500);
        } else if (categoryKey === "starstruck") {
          setTempMood("starstruck", 2400);
        } else if (categoryKey === "sweatdrop") {
          setTempMood("sweatdrop", 1800);
        } else if (categoryKey === "startled") {
          setTempMood("startled", 750);
        } else if (
          categoryKey === "smug" ||
          categoryKey === "contact_copy" ||
          categoryKey === "terminal_tab"
        ) {
          setTempMood("smug", 1850);
          playWink("right");
        } else if (categoryKey === "skill_dev" || categoryKey === "about") {
          setTempMood("code", 1700);
        } else {
          setTempMood("happy", 1050);
          playWink(Math.random() < 0.5 ? "left" : "right");
        }
      };

      const setAnswerText = (text) => {
        answerEl.textContent = "";
        const span = document.createElement("span");
        span.className = "trr-text-bg";
        span.textContent = text;
        answerEl.append(span);
      };

      const appendThoughtSentence = (line) => {
        const p = document.createElement("p");
        p.className = "trr-sentence";
        const span = document.createElement("span");
        span.className = "trr-text-bg";
        span.textContent = line;
        p.append(span);
        trStream.append(p);
      };

      if (!showThinking) {
        speechPhase = "done";
        trHeader.hidden = true;
        trCollapsible.classList.add("trr-collapsed");
        trViewport.classList.remove("trr-scroll");
        answerEl.className = "orb-answer orb-answer--direct";
        setAnswerText(script.answer);
        answerEl.hidden = false;

        finishReaction();
        triggerPulse();
        requestAnimationFrame(() => {
          updateThoughtMaskAndScroll();
          positionSpeechBubble(true);
          speech.classList.add("is-visible");
        });
        scheduleAutoFade(autoCloseMs);
        return;
      }

      speechPhase = "thinking";
      trHeader.hidden = false;
      trHeader.className = "trr-header";
      trHeader.setAttribute("aria-expanded", "true");
      trHeader.innerHTML = `<span class="trr-label trr-shimmer">${script.verb || "Réflexion…"}</span>`;

      trCollapsible.classList.remove("trr-collapsed");
      trViewport.classList.remove("trr-scroll");
      answerEl.className = "orb-answer";

      if (activeMood !== "dizzy" && activeMood !== "sleepy") {
        setTempMood("pondering", 2800);
        orb?.nudgeLook(0.56, 0.54);
      }
      triggerPulse();

      requestAnimationFrame(() => {
        updateThoughtMaskAndScroll();
        positionSpeechBubble(true);
        speech.classList.add("is-visible");
      });

      const thoughts = script.thoughts;
      const delays = thoughts.map((_, i) => (i === 0 ? 320 : 620));
      const totalMs = delays.reduce((a, b) => a + b, 0);
      const elapsedS = Math.max(1, Math.round(totalMs / 1000));

      const revealAllDone = () => {
        speechPhase = "done";
        thoughtExpanded = false;
        trHeader.className = "trr-header trr-clickable";
        trHeader.setAttribute("aria-expanded", "false");
        trHeader.innerHTML = `
          <span class="trr-label">
            <span class="trr-verb">${script.doneVerb || "Pensé"}</span> · ${elapsedS}s
          </span>
          <svg class="trr-chevron" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
            <path d="m4.5 15.75 7.5-7.5 7.5 7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        `;
        trCollapsible.classList.add("trr-collapsed");

        setAnswerText(script.answer);
        answerEl.hidden = false;

        finishReaction();
        requestAnimationFrame(() => positionSpeechBubble(true));
        scheduleAutoFade(autoCloseMs);
      };

      if (reducedMotion.matches) {
        thoughts.forEach(appendThoughtSentence);
        updateThoughtMaskAndScroll();
        revealAllDone();
        return;
      }

      let acc = 0;
      thoughts.forEach((line, idx) => {
        acc += delays[idx];
        speechTimers.push(
          setTimeout(() => {
            appendThoughtSentence(line);
            if (categoryKey !== "sleepy") orb?.triggerBlink();
            updateThoughtMaskAndScroll();
            positionSpeechBubble(true);
          }, acc)
        );
      });

      speechTimers.push(setTimeout(revealAllDone, totalMs + 320));
    };

    trHeader.addEventListener("pointerenter", () => {
      clearTimeout(speechAutoCloseTimer);
    });

    const triggerPulse = () => {
      root.classList.remove("is-pulsing");
      clearTimeout(pulseTimer);
      requestAnimationFrame(() => {
        root.classList.add("is-pulsing");
        pulseTimer = setTimeout(() => root.classList.remove("is-pulsing"), 700);
      });
    };

    const setTempMood = (moodName, durationMs = 1200) => {
      tempMood = moodName;
      tempMoodUntil = performance.now() + durationMs;
      startPhysics();
    };

    const playWink = (side = "right") => {
      orb?.triggerWink(side);
      winkTilt = side === "left" ? -10 : 10;
      winkTiltUntil = performance.now() + 420;
      startPhysics();
    };

    const applyMood = (moodName) => {
      if (moodName === activeMood) return;
      activeMood = moodName;
      const baseName = moodName.startsWith("curious") ? "curious" : moodName;
      root.dataset.mood = baseName;
      orb?.setMoodValues(MOODS[moodName] || MOODS.neutral);
    };

    const lookBrieflyAt = (lx, ly, durationMs = 700) => {
      lookOverridePoint = { x: lx, y: ly };
      lookOverrideUntil = performance.now() + durationMs;
    };

    let lastRootTf = "";
    let lastBodyTf = "";
    const renderTransform = (
      tiltDeg = 0,
      bobY = 0,
      scaleX = 1,
      scaleY = 1,
      extraX = 0
    ) => {
      const rootTf = `translate3d(${(x + extraX).toFixed(2)}px, ${(y + bobY).toFixed(2)}px, 0)`;
      if (rootTf !== lastRootTf) {
        lastRootTf = rootTf;
        root.style.transform = rootTf;
      }
      const noScale = scaleX === 1 && scaleY === 1;
      const bodyTf =
        noScale && Math.abs(tiltDeg) < 0.04
          ? "none"
          : noScale
            ? `rotate(${tiltDeg.toFixed(2)}deg)`
            : `rotate(${tiltDeg.toFixed(2)}deg) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;
      if (bodyTf !== lastBodyTf) {
        lastBodyTf = bodyTf;
        body.style.transform = bodyTf;
      }
    };
    renderTransform();

    function refreshInterestCache() {
      interestEls = [...document.querySelectorAll(INTEREST_SELECTOR)];
      sectionEls = [...document.querySelectorAll(SECTION_SELECTOR)];
      avoidEls = [...document.querySelectorAll(CONTENT_AVOID_SELECTOR)];
      obstaclesDirty = true;
    }

    function updateViewportCache() {
      orbSize = root.offsetWidth || 56;
      vpW = window.innerWidth;
      vpH = window.innerHeight;
      obstaclesDirty = true;
    }

    function scanProximity(px, py) {
      let bestEl = null;
      let bestRect = null;
      let bestDist = 115;

      for (const el of interestEls) {
        const rect = el.getBoundingClientRect();
        if (
          rect.width <= 0 ||
          rect.height <= 0 ||
          rect.bottom < 0 ||
          rect.top > vpH
        ) {
          continue;
        }
        const cx = clamp(px, rect.left, rect.right);
        const cy = clamp(py, rect.top, rect.bottom);
        const dist = Math.hypot(px - cx, py - cy);
        if (dist < bestDist) {
          bestDist = dist;
          bestEl = el;
          bestRect = rect;
        }
      }

      let foundSec = null;
      for (const sec of sectionEls) {
        const r = sec.getBoundingClientRect();
        if (py >= r.top && py <= r.bottom && px >= r.left && px <= r.right) {
          foundSec = sec;
          break;
        }
      }

      return { bestEl, bestRect, foundSec };
    }

    function computePerchPoint(el, rect, px, py) {
      const size = orbSize;

      if (el.classList.contains("about-terminal") && rect.top > 85) {
        const sitX = clamp(
          px - size / 2,
          rect.left + 90,
          Math.max(rect.left + 90, rect.right - size - 20)
        );
        return clampPos(sitX, rect.top - size * 0.86);
      }

      if (el.classList.contains("coverflow-stage")) {
        const activeCard =
          el.querySelector('.coverflow-card[aria-current="true"]') || el;
        const cardRect = activeCard.getBoundingClientRect();
        const rightSide = px < cardRect.left + cardRect.width / 2;
        return clampPos(
          rightSide ? cardRect.right + 16 : cardRect.left - size - 16,
          cardRect.top + 18
        );
      }

      const gap = 14;
      const options = [
        { x: rect.right + gap, y: rect.top - size * 0.35 },
        { x: rect.left - size - gap, y: rect.top - size * 0.35 },
        { x: rect.right - size - 8, y: rect.top - size - gap },
        { x: rect.right + gap, y: rect.bottom - size },
        { x: rect.left - size - gap, y: rect.bottom - size },
      ];

      let best = null;
      let bestScore = -Infinity;
      for (const opt of options) {
        const clamped = clampPos(opt.x, opt.y);
        const cx = clamped.x + size / 2;
        const cy = clamped.y + size / 2;
        const distFromMouse = Math.hypot(cx - px, cy - py);
        const overlapPenalty =
          cx > rect.left - 8 &&
          cx < rect.right + 8 &&
          cy > rect.top - 8 &&
          cy < rect.bottom + 8
            ? 240
            : 0;
        const edgeShiftPenalty = Math.hypot(clamped.x - opt.x, clamped.y - opt.y) * 1.4;
        const score = Math.min(distFromMouse, 190) - overlapPenalty - edgeShiftPenalty;
        if (score > bestScore) {
          bestScore = score;
          best = clamped;
        }
      }
      return best || clampPos(px + 92, py + 72);
    }

    function pickAutonomousTarget() {
      const size = orbSize;
      const visibleCards = interestEls.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top > 76 && r.bottom < vpH - 20;
      });

      if (visibleCards.length > 0 && Math.random() < 0.72) {
        const pick = visibleCards[Math.floor(Math.random() * visibleCards.length)];
        const r = pick.getBoundingClientRect();
        if (pick.classList.contains("about-terminal") && r.top > 90) {
          return {
            point: clampPos(r.right - size - 28, r.top - size * 0.86),
            focusEl: pick,
          };
        }
        const sideRight = r.right + size + 24 < vpW;
        const px = sideRight ? r.right + 14 : r.left - size - 14;
        const py = r.top + Math.min(24, r.height * 0.2);
        return { point: clampPos(px, py), focusEl: pick };
      }

      const m = getMargin() + 12;
      const rx = m + Math.random() * Math.max(40, vpW - size - m * 2);
      const ry =
        Math.max(m, 92) +
        Math.random() * Math.max(40, vpH - size - m * 2 - 60);
      return { point: clampPos(rx, ry), focusEl: null };
    }

    function computeCompanionOffset(px, py) {
      const size = orbSize;
      const preferLeft = px > vpW * 0.62;
      const preferAbove = py > vpH * 0.68;
      const ox = preferLeft ? -size - 72 : 72;
      const oy = preferAbove ? -size - 64 : 64;
      return clampPos(px + ox, py + oy);
    }

    const tickPhysics = (now) => {
      physicsRaf = 0;
      const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameAt) / 1000));
      lastFrameAt = now;

      if (reducedMotion.matches) {
        const rest = clampPos(vpW - orbSize - 24, vpH - orbSize - 24);
        x = rest.x;
        y = rest.y;
        applyMood("neutral");
        renderTransform(0, 0, 1, 1);
        return;
      }

      if (!dragState?.moved) {
        smoothPointerSpeed *= Math.exp(-dt * 8);
        nearShakeEnergy *= Math.exp(-dt * 3.2);
        bodySpin *= Math.exp(-dt * 6.5);
        if (Math.abs(bodySpin) < 0.35) bodySpin = 0;

        const idleTime = now - lastActivityAt;
        const canRest = !playingAudioEl && now >= balloonsActiveUntil && !isHovered;
        const isSleepy = idleTime >= SLEEP_IDLE_MS && canRest;
        const isDrowsy = !isSleepy && idleTime >= DROWSY_IDLE_MS && canRest;
        const isScrolling = isNativeScrolling || now < scrollingUntil;
        const pointerWindowMs = lastPointerType === "touch" ? 1400 : 2600;
        const pointerActive =
          hasPointer && now - lastPointerAt < pointerWindowMs && !isSleepy;

        const distToOrb = Math.hypot(
          pointerX - (x + orbSize / 2),
          pointerY - (y + orbSize / 2)
        );
        const wasShyStill = isShyStill;
        if (
          pointerActive &&
          lastPointerType !== "touch" &&
          !isHovered &&
          !isScrolling &&
          now >= dodgeUntil
        ) {
          if (!isShyStill) {
            isShyStill = distToOrb < 165 && smoothPointerSpeed < 680;
          } else {
            isShyStill = distToOrb < 220 && smoothPointerSpeed < 850;
          }
        } else {
          isShyStill = false;
        }
        if (isShyStill && !wasShyStill) {
          shySince = now;
          orb?.triggerBlink();
          if (!tempMood) setTempMood(Math.random() < 0.5 ? "curiousL" : "curiousR", 750);
          if (Math.random() < 0.55) {
            speakThought("shy", { spontaneous: true, autoCloseMs: 5200 });
          }
        } else if (!isShyStill) {
          shySince = 0;
        }

        if (isDrowsy && !wasDrowsyState) {
          wasDrowsyState = true;
          orb?.triggerBlink();
        } else if (!isDrowsy && wasDrowsyState) {
          wasDrowsyState = false;
        }

        if (isSleepy && !wasSleepyState) {
          wasSleepyState = true;
          if (Math.random() < 0.55) {
            speakThought("sleepy", { spontaneous: true, autoCloseMs: 4200 });
          }
        } else if (!isSleepy && wasSleepyState) {
          wasSleepyState = false;
        }

        let desiredMood = "neutral";
        const lookAt = (tx, ty) => orb?.lookAtViewportPoint(tx, ty, x, y, orbSize);

        if (isSleepy && (!speechOpen || speechCategory === "sleepy")) {
          const napSpot = document.body.classList.contains("skills-page")
            ? clampPos(vpW - orbSize - 28, 92)
            : clampPos(vpW - orbSize - 36, vpH - orbSize - 22);
          targetX = napSpot.x;
          targetY = napSpot.y;
          desiredMood = "sleepy";
          orb?.nudgeLook(0, -0.25);
          if (activeInterestEl) {
            activeInterestEl = null;
            activeInterestRect = null;
            root.classList.remove("is-near-section");
          }
        } else if (isDrowsy && !speechOpen) {
          targetX = x;
          targetY = y;
          desiredMood = "drowsy";
          orb?.nudgeLook(0, -0.14);
        } else if (speechOpen) {
          // Pendant que la bulle de pensée est affichée, l'orb reste posée à côté
          targetX = x;
          targetY = y;
          if (speechPhase === "thinking") {
            desiredMood = "pondering";
            orb?.nudgeLook(0.56, 0.54);
          } else if (hasPointer && !isScrolling) {
            lookAt(pointerX, pointerY);
          }
        } else if (now < balloonsActiveUntil) {
          desiredMood = "happy";
          orb?.nudgeLook(Math.sin(now * 0.003) * 0.45, 0.88);
          targetX = roamTarget.x;
          targetY = roamTarget.y;
        } else if (playingAudioEl && !pointerActive && !isHovered) {
          if (!isScrolling && now - lastProximityScanAt >= 120) {
            lastProximityScanAt = now;
            const ar = playingAudioEl.getBoundingClientRect();
            if (ar.width > 0 && ar.bottom > 0 && ar.top < vpH) {
              const perch = clampPos(ar.right + 14, ar.top - 10);
              targetX = perch.x;
              targetY = perch.y;
              lookAt(ar.left + ar.width / 2, ar.top + ar.height / 2);
            }
          }
          desiredMood = "happy";
        } else if (isHovered) {
          targetX = x;
          targetY = y;
          lookAt(pointerX, pointerY);
        } else if (isShyStill) {
          // Approche lente : l'orb s'arrête puis rougit si tu restes près d'elle
          targetX = x;
          targetY = y;
          if (shySince && now - shySince > 950) {
            desiredMood = "blush";
            orb?.nudgeLook(-0.35, -0.35);
          } else {
            lookAt(pointerX, pointerY);
          }
        } else if (document.body.classList.contains("skills-page") && window.scrollY < 260) {
          // Sur la scène 3D /competences, l'orb reste posée calmement en haut à droite
          // sans pourchasser le curseur au milieu des orbites ni couvrir le B. 3D
          const calmSpot = clampPos(vpW - orbSize - 28, 92);
          targetX = calmSpot.x;
          targetY = calmSpot.y;
          if (hasPointer && !isScrolling) {
            lookAt(pointerX, pointerY);
          }
        } else if (pointerActive) {
          // Zéro getBoundingClientRect pendant le défilement actif ; scan à ~8 Hz au calme
          if (!isScrolling && now - lastProximityScanAt >= 120) {
            lastProximityScanAt = now;
            const scan = scanProximity(pointerX, pointerY);

            if (scan.foundSec !== activeSectionEl) {
              activeSectionEl = scan.foundSec;
              if (scan.foundSec) {
                orb?.triggerBlink();
                if (!tempMood) setTempMood(Math.random() < 0.5 ? "curiousL" : "curiousR", 900);
              }
            }

            if (scan.bestEl !== activeInterestEl) {
              activeInterestEl = scan.bestEl;
              activeInterestRect = scan.bestRect;
              root.classList.toggle("is-near-section", Boolean(scan.bestEl));
              if (scan.bestEl) {
                orb?.triggerBlink();
                triggerPulse();
                if (scan.bestEl.classList.contains("nav-cta")) {
                  setTempMood(Math.random() < 0.45 ? "smug" : "happy", 1200);
                  playWink("right");
                  vy -= 140;
                } else if (scan.bestEl.classList.contains("contact-link-item")) {
                  setTempMood("smug", 1250);
                  playWink("right");
                  vy -= 120;
                } else if (scan.bestEl.classList.contains("about-terminal")) {
                  setTempMood("code", 1450);
                } else if (scan.bestEl.classList.contains("skill-card")) {
                  const cat = getSkillCategory(scan.bestEl);
                  if (cat === "skill_dev") {
                    setTempMood("code", 1300);
                  } else {
                    setTempMood(Math.random() < 0.5 ? "curiousL" : "curiousR", 1050);
                  }
                  if (Math.random() < 0.22) {
                    speakThought(cat, {
                      spontaneous: true,
                      autoCloseMs: 5600,
                    });
                  }
                } else {
                  setTempMood(Math.random() < 0.5 ? "curiousL" : "curiousR", 950);
                }
              }
            } else {
              activeInterestRect = scan.bestRect;
            }
          }

          if (activeInterestEl && activeInterestRect && !isScrolling) {
            const perch = computePerchPoint(
              activeInterestEl,
              activeInterestRect,
              pointerX,
              pointerY
            );
            targetX = perch.x;
            targetY = perch.y;

            const hoveringDevSkill =
              activeInterestEl.classList.contains("skill-card") &&
              getSkillCategory(activeInterestEl) === "skill_dev";

            if (activeInterestEl.classList.contains("about-terminal") || hoveringDevSkill) {
              desiredMood = "code";
              const sweepX =
                activeInterestRect.left +
                activeInterestRect.width * (0.5 + 0.28 * Math.sin(now * 0.0022));
              const sweepY =
                activeInterestRect.top + activeInterestRect.height * 0.52;
              lookAt(sweepX, sweepY);
            } else {
              if (
                activeInterestEl.classList.contains("nav-cta") ||
                activeInterestEl.classList.contains("contact-link-item")
              ) {
                desiredMood = "happy";
              }
              if (now < lookOverrideUntil && lookOverridePoint) {
                lookAt(lookOverridePoint.x, lookOverridePoint.y);
              } else {
                if (now - lastLookSwitchAt > 1100) {
                  lastLookSwitchAt = now;
                  glanceAtElement = !glanceAtElement;
                }
                if (glanceAtElement) {
                  lookAt(
                    activeInterestRect.left + activeInterestRect.width / 2,
                    activeInterestRect.top + activeInterestRect.height / 2
                  );
                } else {
                  lookAt(pointerX, pointerY);
                }
              }
            }
          } else {
            const comp = computeCompanionOffset(pointerX, pointerY);
            targetX = comp.x;
            targetY = comp.y;
            if (!isScrolling) {
              if (now < lookOverrideUntil && lookOverridePoint) {
                lookAt(lookOverridePoint.x, lookOverridePoint.y);
              } else {
                lookAt(pointerX, pointerY);
              }
            }
          }
        } else {
          if (activeInterestEl) {
            activeInterestEl = null;
            activeInterestRect = null;
            root.classList.remove("is-near-section");
          }
          if (!isScrolling && now >= nextRoamAt) {
            const next = pickAutonomousTarget();
            roamTarget = next.point;
            nextRoamAt = now + 2600 + Math.random() * 2600;
            if (next.focusEl) {
              const r = next.focusEl.getBoundingClientRect();
              lookAt(r.left + r.width / 2, r.top + r.height / 2);
              if (Math.random() < 0.65) {
                orb?.triggerBlink();
                setTempMood(Math.random() < 0.5 ? "curiousL" : "curiousR", 900);
              }
            } else if (Math.random() < 0.28) {
              playWink(Math.random() < 0.5 ? "left" : "right");
            }
          }
          targetX = roamTarget.x;
          targetY = roamTarget.y;
          if (!isScrolling && now < lookOverrideUntil && lookOverridePoint) {
            lookAt(lookOverridePoint.x, lookOverridePoint.y);
          }
        }

        if (tempMood && now < tempMoodUntil) {
          desiredMood = tempMood;
        } else {
          tempMood = null;
        }
        applyMood(desiredMood);

        const stiffness = isSleepy ? 4.5 : pointerActive ? 14 : 6.8;
        const damping = isShyStill ? 12 : isSleepy ? 6.0 : pointerActive ? 7.2 : 5.2;
        const ax = (targetX - x) * stiffness - vx * damping;
        const ay = (targetY - y) * stiffness - vy * damping;

        vx += ax * dt;
        vy += ay * dt;
        x += vx * dt;
        y += vy * dt;

        const speedBeforeClamp = Math.hypot(vx, vy);
        const clamped = clampPos(x, y);
        if (clamped.x !== x) {
          x = clamped.x;
          vx *= -0.35;
          if (speedBeforeClamp > 560 && desiredMood !== "dizzy") {
            setTempMood("startled", 520);
          }
        }
        if (clamped.y !== y) {
          y = clamped.y;
          vy *= -0.35;
          if (speedBeforeClamp > 560 && desiredMood !== "dizzy") {
            setTempMood("startled", 520);
          }
        }

        scrollDriftTarget *= Math.exp(-dt * 7.5);
        scrollDrift += (scrollDriftTarget - scrollDrift) * (1 - Math.exp(-dt * 14));
        if (Math.abs(scrollDriftTarget) < 0.05) scrollDriftTarget = 0;
        if (Math.abs(scrollDrift) < 0.05 && scrollDriftTarget === 0) scrollDrift = 0;

        const speed = Math.hypot(vx, vy);
        const lean = now < coverflowLeanUntil ? coverflowLean : 0;
        const winkRot = now < winkTiltUntil ? winkTilt : 0;
        const audioSway = playingAudioEl ? Math.sin(now * 0.0065) * 7 : 0;
        const scrollTilt = clamp(-scrollDrift * 0.22, -3.5, 3.5);

        // Roulis + orbite vacillante quand étourdie / secouée
        let dizzyTilt = 0;
        let dizzyOrbitX = 0;
        if (desiredMood === "dizzy") {
          const remain = Math.max(0, (tempMoodUntil - now) / 1800);
          dizzyTilt = Math.sin(now * 0.024) * 22 * (0.4 + remain);
          dizzyOrbitX = Math.sin(now * 0.018) * 9 * remain;
        }
        const startledX = desiredMood === "startled" ? Math.sin(now * 0.088) * 3.1 : 0;

        const baseTilt = clamp(vx * 0.022 + lean + winkRot + audioSway + dizzyTilt + scrollTilt, -24, 24);
        const tilt = baseTilt + bodySpin;

        const bob =
          (playingAudioEl ? Math.abs(Math.sin(now * 0.0065)) * -5.5 : 0) +
          scrollDrift;

        const purrX =
          (desiredMood === "happy" || desiredMood === "love") && isHovered
            ? Math.sin(now * 0.045) * 1.6
            : 0;

        // Zéro déformation scale(sx, sy) pendant le défilement pour ne jamais re-rastériser la couche
        const sy = isScrolling ? 1 : 1 + Math.min(0.05, speed * 0.0001);
        const sx = isScrolling ? 1 : 1 / Math.sqrt(Math.max(0.75, sy));

        renderTransform(tilt, bob, sx, sy, purrX + dizzyOrbitX + startledX);
        if (speechOpen && (Math.abs(vx) > 0.8 || Math.abs(vy) > 0.8)) {
          positionSpeechBubble(false);
        }

        const distRemaining = Math.hypot(targetX - x, targetY - y);
        const stillMoving =
          distRemaining > 0.45 ||
          speed > 0.8 ||
          Math.abs(scrollDrift) > 0.15 ||
          Math.abs(scrollDriftTarget) > 0.15 ||
          Math.abs(bodySpin) > 0.4 ||
          now < winkTiltUntil ||
          now < coverflowLeanUntil ||
          now < balloonsActiveUntil ||
          desiredMood === "dizzy" ||
          desiredMood === "startled" ||
          Boolean(playingAudioEl) ||
          ((desiredMood === "happy" || desiredMood === "love") && isHovered) ||
          (!isScrolling && activeInterestEl?.classList.contains("about-terminal"));

        const idleNow = !stillMoving && !isScrolling && !isSleepy && !isHovered && now >= dodgeUntil;
        if (idleNow !== lastIdleClass) {
          lastIdleClass = idleNow;
          root.classList.toggle("is-idle", idleNow);
        }

        if (stillMoving && document.visibilityState !== "hidden") {
          physicsRaf = requestAnimationFrame(tickPhysics);
        } else if (!isSleepy && !speechOpen && !isHovered && !isShyStill) {
          const nextStepMs = isDrowsy ? SLEEP_IDLE_MS - idleTime + 50 : DROWSY_IDLE_MS - idleTime + 50;
          const waitRoam = Math.max(250, Math.min(nextRoamAt - now, nextStepMs));
          roamWakeTimer = setTimeout(startPhysics, waitRoam);
        }
        return;
      }

      if (lastIdleClass) {
        lastIdleClass = false;
        root.classList.remove("is-idle");
      }
      if (document.visibilityState !== "hidden") {
        physicsRaf = requestAnimationFrame(tickPhysics);
      }
    };

    const startPhysics = () => {
      if (roamWakeTimer) {
        clearTimeout(roamWakeTimer);
        roamWakeTimer = null;
      }
      if (physicsRaf) return;
      lastFrameAt = performance.now();
      physicsRaf = requestAnimationFrame(tickPhysics);
    };

    window.addEventListener(
      "pointermove",
      (e) => {
        const now = performance.now();
        const dt = Math.max(1, now - prevPointerAt);
        const moveDx = e.clientX - prevPointerX;
        const moveDy = e.clientY - prevPointerY;
        const distMove = Math.hypot(moveDx, moveDy);
        pointerSpeed = (distMove / dt) * 1000;
        smoothPointerSpeed += (pointerSpeed - smoothPointerSpeed) * 0.35;

        const wasSleeping = activeMood === "sleepy";

        pointerX = e.clientX;
        pointerY = e.clientY;
        lastPointerType = e.pointerType || "mouse";
        hasPointer = true;
        lastPointerAt = now;
        lastActivityAt = now;

        if (wasSleeping) {
          orb?.triggerBlink();
          setTempMood("surprised", 450);
          if (Math.random() < 0.6) {
            speakThought("wake", { spontaneous: true, autoCloseMs: 5200 });
          }
        }

        if (!reducedMotion.matches && !dragState?.moved && lastPointerType !== "touch") {
          const cx = x + orbSize / 2;
          const cy = y + orbSize / 2;
          const toOrbX = cx - pointerX;
          const toOrbY = cy - pointerY;
          const dist = Math.hypot(toOrbX, toOrbY);

          // Secousse rapide du curseur sur/autour de l'orb -> shaking / dizzy (@ @)
          if (dist < 145 && !isShyStill && pointerSpeed > 700 && Math.abs(moveDx) > 6) {
            const dir = Math.sign(moveDx);
            if (nearDirX !== 0 && dir !== nearDirX) {
              nearShakeEnergy += Math.min(40, Math.abs(moveDx) * 1.15);
              if (nearShakeEnergy > 82) {
                nearShakeEnergy = 0;
                dodgeUntil = now + 1900;
                setTempMood("dizzy", 1900);
                triggerPulse();
                speakThought("dizzy", { spontaneous: true, autoCloseMs: 6000 });
              }
            }
            nearDirX = dir;
          } else if (!isHovered && pointerSpeed > 1550 && dist < 95 && now >= dodgeUntil) {
            // Fonce droit dessus à grande vitesse -> esquive
            const moveLen = Math.max(1, distMove);
            const dot =
              (moveDx / moveLen) * (toOrbX / Math.max(1, dist)) +
              (moveDy / moveLen) * (toOrbY / Math.max(1, dist));

            if (dot > 0.72) {
              const nx = toOrbX / Math.max(1, dist);
              const ny = toOrbY / Math.max(1, dist);
              vx += nx * 360 + (Math.random() - 0.5) * 160;
              vy += ny * 320 - 180;
              dodgeUntil = now + 650;
              isShyStill = false;
              setTempMood("surprised", 650);
              triggerPulse();
              if (Math.random() < 0.42) {
                speakThought("dodge", { spontaneous: true, autoCloseMs: 5200 });
              }
            }
          }
        }

        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
        prevPointerAt = now;
        startPhysics();
      },
      { passive: true }
    );

    window.addEventListener(
      "pointerdown",
      (e) => {
        lastActivityAt = performance.now();
        if (root.contains(e.target) || speech.contains(e.target)) return;
        if (speechOpen) closeSpeech();
        lookBrieflyAt(e.clientX, e.clientY, 700);
        const interactiveTarget = e.target.closest?.("a, button, summary, .coverflow-card");
        if (interactiveTarget) {
          orb?.triggerBlink();
          setTempMood("happy", 650);
        } else {
          setTempMood("surprised", 420);
        }
      },
      { passive: true }
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && speechOpen) {
        closeSpeech();
        launcher.focus({ preventScroll: true });
      }
    });

    const settleScroll = () => {
      clearTimeout(scrollSettleTimer);
      scrollSettleTimer = null;
      isNativeScrolling = false;
      scrollingUntil = 0;
      orb?.notifyScrolling?.(0);
      obstaclesDirty = true;
      if (hasPointer) lastProximityScanAt = 0;
      if (speechOpen) positionSpeechBubble(true);
      startPhysics();
    };

    window.addEventListener(
      "scroll",
      () => {
        const now = performance.now();
        const wasSleeping = activeMood === "sleepy";
        lastActivityAt = now;
        isNativeScrolling = true;
        scrollingUntil = now + 300;
        obstaclesDirty = true;
        orb?.notifyScrolling?.(300);

        if (lastIdleClass) {
          lastIdleClass = false;
          root.classList.remove("is-idle");
        }

        const currentY = window.scrollY;
        const delta = currentY - lastScrollY;
        lastScrollY = currentY;

        clearTimeout(scrollSettleTimer);
        scrollSettleTimer = setTimeout(settleScroll, 320);

        if (wasSleeping) {
          setTempMood("startled", 440);
        }
        if (!reducedMotion.matches && !dragState?.moved && !speechOpen) {
          // Dérive inertielle douce et bornée (±15 px) sans à-coup brutal sur vy
          scrollDriftTarget = clamp(scrollDriftTarget - delta * 0.09, -15, 15);
          if (Math.abs(delta) > 35) {
            const dir = Math.sign(delta);
            if (scrollLastDir !== 0 && dir !== scrollLastDir) {
              if (now - scrollReversalStart > 1800) {
                scrollReversals = 1;
                scrollReversalStart = now;
              } else {
                scrollReversals += 1;
              }
              if (scrollReversals >= 4) {
                scrollReversals = 0;
                setTempMood("sweatdrop", 1800);
                if (Math.random() < 0.45) {
                  speakThought("sweatdrop", { spontaneous: true, autoCloseMs: 5000 });
                }
              }
            }
            scrollLastDir = dir;
          }
          if (Math.abs(delta) > 125) {
            setTempMood("surprised", 460);
            if (Math.random() < 0.28) {
              speakThought("fastScroll", { spontaneous: true, autoCloseMs: 5000 });
            }
          }
          startPhysics();
        }
      },
      { passive: true }
    );

    window.addEventListener("scrollend", settleScroll, { passive: true });

    const triggerPetReward = () => {
      const nowPet = performance.now();
      const sustainedLove = nowPet - lastPetSuccessAt < 4500;
      lastPetSuccessAt = nowPet;
      if (sustainedLove) {
        setTempMood("love", 2400);
        triggerPulse();
        if (Math.random() < 0.85) {
          speakThought("pet_love", { spontaneous: true, autoCloseMs: 5800 });
        }
      } else {
        setTempMood("happy", 1800);
        triggerPulse();
        if (Math.random() < 0.78) {
          speakThought("pet", { spontaneous: true, autoCloseMs: 5800 });
        }
      }
    };

    launcher.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch") return;
      isHovered = true;
      petLastX = e.clientX;
      petDir = 0;
      petFlips = 0;
      petWindowStart = performance.now();
      orb?.triggerBlink();
      triggerPulse();
    });

    launcher.addEventListener("pointermove", (e) => {
      if (dragState?.moved) {
        if (e.pointerType === "touch" && pointerSpeed < 420) {
          const dtMove = e.clientX - petLastX;
          if (Math.abs(dtMove) > 6) {
            const dir = Math.sign(dtMove);
            if (petDir !== 0 && dir !== petDir) {
              petFlips += 1;
              if (petFlips >= 3) {
                petFlips = 0;
                triggerPetReward();
              }
            }
            petDir = dir;
            petLastX = e.clientX;
          }
        }
        return;
      }
      if (!isHovered) return;
      const now = performance.now();
      if (now - petWindowStart > 1000) {
        petFlips = 0;
        petWindowStart = now;
      }
      const dx = e.clientX - petLastX;
      if (Math.abs(dx) > 4 && pointerSpeed < 740) {
        const dir = Math.sign(dx);
        if (petDir !== 0 && dir !== petDir) {
          petFlips += 1;
          if (petFlips >= 3) {
            petFlips = 0;
            triggerPetReward();
          }
        }
        petDir = dir;
        petLastX = e.clientX;
      }
    });

    launcher.addEventListener("pointerleave", () => {
      isHovered = false;
      petFlips = 0;
    });

    launcher.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      lastActivityAt = performance.now();
      dragShakeEnergy = 0;
      prevDragDx = 0;
      dragTravelDist = 0;
      dragState = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        originX: x,
        originY: y,
        moved: false,
      };
      launcher.setPointerCapture(e.pointerId);
    });

    launcher.addEventListener("pointermove", (e) => {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      if (!dragState.moved && Math.hypot(dx, dy) > 6) {
        dragState.moved = true;
        root.classList.add("is-dragging");
      }
      if (dragState.moved) {
        if (speechOpen) closeSpeech();
        const stepDx = e.clientX - dragState.lastX;
        if (prevDragDx !== 0 && Math.sign(stepDx) !== Math.sign(prevDragDx) && Math.abs(stepDx) > 4) {
          dragShakeEnergy += Math.abs(stepDx) * 1.45;
        }
        dragShakeEnergy = Math.max(0, dragShakeEnergy * 0.94 + Math.abs(stepDx) * 0.42);
        prevDragDx = stepDx || prevDragDx;
        dragState.lastX = e.clientX;
        dragTravelDist = Math.hypot(dx, dy);

        const pos = clampPos(dragState.originX + dx, dragState.originY + dy);
        x = pos.x;
        y = pos.y;
        vx = 0;
        vy = 0;
        applyMood(dragShakeEnergy > 60 ? "dizzy" : "surprised");
        renderTransform(clamp(stepDx * 0.55, -20, 20), 0, 0.96, 0.96);
      }
    });

    const endDrag = (e) => {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      const wasMoved = dragState.moved;
      const wasShaken = dragShakeEnergy > 60;
      const movedDist = dragTravelDist;
      dragState = null;
      if (e.pointerType === "touch") isHovered = false;
      root.classList.remove("is-dragging");
      if (launcher.hasPointerCapture(e.pointerId)) {
        launcher.releasePointerCapture(e.pointerId);
      }
      if (wasMoved) {
        suppressClick = true;
        roamTarget = { x, y };
        nextRoamAt = performance.now() + 1800;
        if (wasShaken) {
          setTempMood("dizzy", 1850);
          triggerPulse();
          setTimeout(() => orb?.triggerBlink(), 1800);
          speakThought("dizzy", { spontaneous: true, autoCloseMs: 6000 });
        } else if (dragShakeEnergy > 30) {
          setTempMood("sweatdrop", 1450);
          triggerPulse();
        } else if (movedDist > 90 && Math.random() < 0.5) {
          setTempMood("happy", 950);
          speakThought("drag", { spontaneous: true, autoCloseMs: 5400 });
        }
        setTimeout(() => {
          suppressClick = false;
        }, 0);
      }
    };

    launcher.addEventListener("pointerup", endDrag);
    launcher.addEventListener("pointercancel", endDrag);

    launcher.addEventListener("click", () => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      const now = performance.now();
      if (speechOpen && now - lastClickAt > 360) {
        closeSpeech();
        lastClickAt = now;
        return;
      }
      lastClickAt = now;
      userClickCount += 1;
      // Ne parle pas systématiquement à chaque clic : alterne avec des sauts/clins d'œil muets
      if (userClickCount === 1 || Math.random() < 0.62) {
        speakThought(detectContextKey(true), { spontaneous: false, autoCloseMs: 6500 });
        return;
      }
      setTempMood("happy", 1000);
      playWink(Math.random() < 0.5 ? "left" : "right");
      triggerPulse();
      if (!reducedMotion.matches) {
        vy -= 300;
        vx += (Math.random() > 0.5 ? 1 : -1) * 160;
      }
    });

    launcher.addEventListener("dblclick", () => {
      if (reducedMotion.matches) return;
      bodySpin = (Math.random() < 0.5 ? 1 : -1) * 360;
      vy -= 340;
      setTempMood("startled", 240);
      setTimeout(() => setTempMood("happy", 1200), 230);
      triggerPulse();
      if (Math.random() < 0.72) {
        speakThought("bounce", { spontaneous: false, autoCloseMs: 5600 });
      }
      startPhysics();
    });

    const coverflowTitle = document.getElementById("coverflowTitle");
    const coverflowPrev = document.getElementById("coverflowPrev");
    const coverflowNext = document.getElementById("coverflowNext");
    const coverflowDots = document.getElementById("coverflowDots");
    if (coverflowPrev) {
      coverflowPrev.addEventListener("click", () => {
        coverflowUserNavigated = true;
        coverflowLean = -10;
        coverflowLeanUntil = performance.now() + 450;
      });
    }
    if (coverflowNext) {
      coverflowNext.addEventListener("click", () => {
        coverflowUserNavigated = true;
        coverflowLean = 10;
        coverflowLeanUntil = performance.now() + 450;
      });
    }
    if (coverflowDots) {
      coverflowDots.addEventListener("click", () => {
        coverflowUserNavigated = true;
      });
    }
    if (coverflowTitle) {
      let lastTitle = coverflowTitle.textContent;
      const cfObserver = new MutationObserver(() => {
        if (coverflowTitle.textContent !== lastTitle) {
          lastTitle = coverflowTitle.textContent;
          refreshInterestCache();
          orb?.triggerBlink();
          const nowCf = performance.now();
          if (coverflowUserNavigated) {
            if (nowCf - cfFlipStart > 3500) {
              cfFlips = 1;
              cfFlipStart = nowCf;
            } else {
              cfFlips += 1;
            }
          }
          if (cfFlips >= 4) {
            cfFlips = 0;
            setTempMood("sweatdrop", 1750);
            if (Math.random() < 0.55) {
              speakThought("sweatdrop", { spontaneous: true, autoCloseMs: 5200 });
            }
          } else {
            setTempMood(Math.random() < 0.5 ? "curiousL" : "curiousR", 800);
            if (coverflowUserNavigated && Math.random() < 0.45) {
              speakThought(getCurrentCoverflowKey(), { spontaneous: true, autoCloseMs: 5800 });
            }
          }
        }
      });
      cfObserver.observe(coverflowTitle, { childList: true, characterData: true, subtree: true });
    }

    document.querySelectorAll(".nav-logo, .case-logo").forEach((logo) => {
      logo.addEventListener("click", () => {
        balloonsActiveUntil = performance.now() + 3600;
        setTempMood("happy", 3600);
        triggerPulse();
        vy -= 220;
        speakThought("balloons", { spontaneous: true, autoCloseMs: 6000 });
      });
    });

    const bodyObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node instanceof HTMLElement && node.classList.contains("balloons-layer")) {
            balloonsActiveUntil = performance.now() + 3600;
            setTempMood("happy", 3600);
          }
        }
      }
    });
    bodyObserver.observe(document.body, { childList: true });

    document.querySelectorAll("audio").forEach((audio) => {
      audio.addEventListener("play", () => {
        playingAudioEl = audio;
        setTempMood("happy", 1000);
        triggerPulse();
        speakThought("audio", { spontaneous: true, autoCloseMs: 6000 });
      });
      const stopAudio = () => {
        if (playingAudioEl === audio) playingAudioEl = null;
      };
      audio.addEventListener("pause", stopAudio);
      audio.addEventListener("ended", stopAudio);
    });

    window.addEventListener("resize", () => {
      updateViewportCache();
      const clamped = clampPos(x, y);
      x = clamped.x;
      y = clamped.y;
      roamTarget = clampPos(roamTarget.x, roamTarget.y);
      refreshInterestCache();
      if (speechOpen) positionSpeechBubble(true);
      renderTransform();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") startPhysics();
    });

    const mobileMenu = document.getElementById("mobileMenu");
    if (mobileMenu) {
      const menuObserver = new MutationObserver(() => {
        document.body.classList.toggle(
          "menu-open",
          mobileMenu.classList.contains("active")
        );
      });
      menuObserver.observe(mobileMenu, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    // Exposition légère pour piloter/inspecter l'orb (non intrusif)
    window.LiveOrb.companion = {
      setMood(moodName, ms = 2500) {
        if (moodName === "sleepy") {
          lastActivityAt = performance.now() - SLEEP_IDLE_MS - 500;
          wasSleepyState = false;
          tempMood = null;
          startPhysics();
        } else {
          lastActivityAt = performance.now();
          setTempMood(moodName, ms);
        }
      },
      wink(side = "right") {
        playWink(side);
      },
      spin() {
        bodySpin = 360;
        vy -= 300;
        setTempMood("happy", 1200);
        triggerPulse();
        startPhysics();
      },
      speak(categoryKey) {
        speakThought(categoryKey || detectContextKey(true), { spontaneous: false });
      },
    };

    window.addEventListener("bl:contact-copy", () => {
      lastActivityAt = performance.now();
      setTempMood("smug", 1850);
      playWink("right");
      triggerPulse();
      if (!reducedMotion.matches) vy -= 150;
      speakThought("contact_copy", { spontaneous: false, autoCloseMs: 5200 });
    });

    window.addEventListener("bl:terminal-tab", (e) => {
      lastActivityAt = performance.now();
      setTempMood(e.detail?.tab === "status" ? "smug" : "code", 1600);
      orb?.triggerBlink();
      triggerPulse();
      if (e.detail?.tab === "status" && !dragState?.moved) {
        speakThought("terminal_tab", { spontaneous: false, autoCloseMs: 5800 });
      }
    });

    window.addEventListener("bl:skill-select", (e) => {
      const d = e.detail;
      if (!d?.tool) return;
      lastActivityAt = performance.now();
      refreshInterestCache();
      const isCodeCluster = d.clusterId === "ai" || d.clusterId === "code";
      setTempMood(isCodeCluster ? "code" : "starstruck", 1800);
      triggerPulse();
      if (!reducedMotion.matches) vy -= 110;
      const cat =
        d.clusterId === "ai"
          ? "skill_ai"
          : d.clusterId === "code"
            ? "skill_dev"
            : d.clusterId === "design"
              ? "skill_design"
              : "skill_audio";
      if (Math.random() < 0.72) {
        speakThought(cat, { spontaneous: false, autoCloseMs: 5200 });
      }
    });

    const VISITED_PROJECTS_KEY = "bl:orb-visited-projects";
    const recordProjectVisit = () => {
      const p = window.location.pathname.toLowerCase();
      let slug = "";
      if (p.includes("kaobucha")) slug = "kaobucha";
      else if (p.includes("mojo")) slug = "mojo";
      else if (p.includes("star-wars")) slug = "starwars";
      else if (p.includes("podcast")) slug = "podcast";
      else if (p.includes("coiffure")) slug = "coiffure";
      if (!slug) return;
      try {
        sessionStorage.setItem(
          LAST_PROJECT_KEY,
          JSON.stringify({ slug, at: Date.now() })
        );
        const list = JSON.parse(sessionStorage.getItem(VISITED_PROJECTS_KEY) || "[]");
        if (Array.isArray(list) && !list.includes(slug)) {
          list.push(slug);
          sessionStorage.setItem(VISITED_PROJECTS_KEY, JSON.stringify(list));
        }
      } catch {
        /* ignore storage restrictions */
      }
    };
    recordProjectVisit();

    const maybeSpeakReturnFromProject = () => {
      const isHome = ["/", "/index.html"].includes(window.location.pathname);
      if (!isHome) return;
      try {
        const raw = sessionStorage.getItem(LAST_PROJECT_KEY);
        if (!raw) return;
        sessionStorage.removeItem(LAST_PROJECT_KEY);
        const info = JSON.parse(raw);
        if (!info?.slug || Date.now() - Number(info.at || 0) > 600000) return;
        const visitedList = JSON.parse(sessionStorage.getItem(VISITED_PROJECTS_KEY) || "[]");
        const multiVisited = Array.isArray(visitedList) && visitedList.length >= 2;
        const key = multiVisited && Math.random() < 0.6 ? "starstruck" : `return_${info.slug}`;
        if (!THOUGHT_BANK[key]) return;
        setTimeout(() => {
          if (!speechOpen && !dragState?.moved && activeMood !== "sleepy") {
            lastSpontaneousAt = performance.now();
            setTempMood(multiVisited ? "starstruck" : "happy", multiVisited ? 2400 : 1200);
            if (!multiVisited) playWink("right");
            speakThought(key, { spontaneous: false, autoCloseMs: 5800 });
          }
        }, 1500);
      } catch {
        /* ignore */
      }
    };

    const revealOrb = () => {
      updateViewportCache();
      const clamped = clampPos(x, y);
      x = clamped.x;
      y = clamped.y;
      roamTarget = { x, y };
      refreshInterestCache();
      root.classList.add("is-ready");
      startPhysics();
      maybeSpeakReturnFromProject();
    };

    const loader = document.getElementById("loader");
    if (!loader || loader.classList.contains("hidden")) {
      setTimeout(revealOrb, 220);
    } else {
      const mo = new MutationObserver(() => {
        if (loader.classList.contains("hidden")) {
          mo.disconnect();
          revealOrb();
        }
      });
      mo.observe(loader, { attributes: true, attributeFilter: ["class"] });
      setTimeout(() => {
        mo.disconnect();
        revealOrb();
      }, 3000);
    }

    window.addEventListener("pagehide", () => {
      clearSpeechTimers();
      clearTimeout(scrollSettleTimer);
      if (roamWakeTimer) clearTimeout(roamWakeTimer);
      cancelAnimationFrame(physicsRaf);
      bodyObserver.disconnect();
      orb?.destroy();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPortfolioOrb);
  } else {
    initPortfolioOrb();
  }
})();
