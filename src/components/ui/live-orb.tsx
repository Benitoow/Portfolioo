"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export type LiveOrbVariant = "white" | "black" | "webgl" | "custom"

export type LiveOrbTheme = "light" | "dark" | "auto"

export type LiveOrbMoodValues = {
  happy?: number
  surprise?: number
  squint?: number
  curious?: number
  sleepy?: number
  dizzy?: number
}

export type LiveOrbOptions = {
  variant?: LiveOrbVariant
  theme?: LiveOrbTheme
  color?: string
  eyeColor?: string
  colors?: string[]
  interactive?: boolean
  blink?: boolean
  lookMode?: "element" | "viewport"
  onHasGl?: (ok: boolean) => void
}

export type LiveOrbInstance = {
  setOptions: (options: Partial<LiveOrbOptions>) => void
  setMoodValues: (values: LiveOrbMoodValues) => void
  triggerBlink: () => void
  triggerWink: (side?: "left" | "right") => void
  lookAtViewportPoint: (
    clientX: number,
    clientY: number,
    orbLeft?: number,
    orbTop?: number,
    orbSize?: number
  ) => void
  nudgeLook: (x: number, y: number) => void
  destroy: () => void
}

export const WHITE = { color: "#F4F4F5", eyeColor: "#09090B" } as const
export const BLACK = { color: "#18181B", eyeColor: "#F4F4F5" } as const
export const KODAK = { color: "#F2C94C", eyeColor: "#1E1B18" } as const
export const CUSTOM_DEFAULT = KODAK
export const WEBGL_COLORS = ["#7C6AF7", "#7DD3C7", "#E8B4D4"]

export function isDarkTheme(): boolean {
  if (typeof document === "undefined") return true
  const root = document.documentElement
  if (root.classList.contains("dark")) return true
  if (root.classList.contains("light")) return false
  const dataTheme = root.getAttribute("data-theme")
  if (dataTheme === "dark") return true
  if (dataTheme === "light") return false
  return true
}

export function resolveDark(theme: LiveOrbTheme = "auto"): boolean {
  if (theme === "dark") return true
  if (theme === "light") return false
  return isDarkTheme()
}

export function watchTheme(onChange: () => void): () => void {
  if (typeof document === "undefined") return () => {}
  const mo = new MutationObserver(onChange)
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme", "style"],
  })
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  mq.addEventListener("change", onChange)
  return () => {
    mo.disconnect()
    mq.removeEventListener("change", onChange)
  }
}

export function defaultVariant(dark: boolean): LiveOrbVariant {
  return dark ? "white" : "black"
}

const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

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
  float t
) {
  float facing = dot(n, e);
  float x = dot(n, right) - dot(e, right);
  float y = dot(n, up) - dot(e, up);

  float yc = y - clamp(y, -halfH, halfH);
  float dCap = length(vec2(x, yc)) - rad;

  float xArc = clamp(x, -0.095, 0.095);
  float yArc = 0.044 - 6.8 * xArc * xArc;
  float dHappy = length(vec2(x - xArc, y - yArc)) - 0.038;

  float xWink = clamp(x, -0.092, 0.092);
  float yWink = 0.036 - 0.58 * abs(xWink);
  float dWink = length(vec2(x - xWink, y - yWink)) - 0.032;

  float xSleep = clamp(x, -0.094, 0.094);
  float ySleep = -0.044 + 4.8 * xSleep * xSleep;
  float dSleep = length(vec2(x - xSleep, y - ySleep)) - 0.028;

  float d = mix(dCap, dHappy, happy);
  d = mix(d, dSleep, sleepy);
  d = mix(d, dWink, wink);

  float inward = -x * sideSign;
  float browTop = 0.052 - 0.42 * inward;
  float browBot = -0.048 + 0.1 * inward;
  float squintMask =
    (1.0 - smoothstep(browTop - 0.012, browTop + 0.012, y)) *
    smoothstep(browBot - 0.012, browBot + 0.012, y);

  float baseFill = 1.0 - smoothstep(-0.01, 0.01, d);
  float focusedFill = baseFill * mix(1.0, squintMask, squint * (1.0 - wink) * (1.0 - happy));

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

  float baseRad = 0.054;
  baseRad = mix(baseRad, 0.09, u_surprise);
  baseRad = mix(baseRad, 0.058, u_squint);

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
  vec3 col = mix(warmBody, u_eye, clamp(eyes, 0.0, 1.0));

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), edge);
}
`

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

  float yc = y - clamp(y, -halfH, halfH);
  float dCap = length(vec2(x, yc)) - rad;

  float xArc = clamp(x, -0.095, 0.095);
  float yArc = 0.044 - 6.8 * xArc * xArc;
  float dHappy = length(vec2(x - xArc, y - yArc)) - 0.038;

  float xWink = clamp(x, -0.092, 0.092);
  float yWink = 0.036 - 0.58 * abs(xWink);
  float dWink = length(vec2(x - xWink, y - yWink)) - 0.032;

  float xSleep = clamp(x, -0.094, 0.094);
  float ySleep = -0.044 + 4.8 * xSleep * xSleep;
  float dSleep = length(vec2(x - xSleep, y - ySleep)) - 0.028;

  float d = mix(dCap, dHappy, happy);
  d = mix(d, dSleep, sleepy);
  d = mix(d, dWink, wink);

  float inward = -x * sideSign;
  float browTop = 0.052 - 0.42 * inward;
  float browBot = -0.048 + 0.1 * inward;
  float squintMask =
    (1.0 - smoothstep(browTop - 0.012, browTop + 0.012, y)) *
    smoothstep(browBot - 0.012, browBot + 0.012, y);

  float baseFill = 1.0 - smoothstep(-0.01, 0.01, d);
  float focusedFill = baseFill * mix(1.0, squintMask, squint * (1.0 - wink) * (1.0 - happy));

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

  vec2 wobbleL = vec2(0.035 * sin(u_time * 11.0), 0.03 * cos(u_time * 11.0)) * u_dizzy;
  vec2 wobbleR = vec2(-0.035 * cos(u_time * 11.0 + 0.7), 0.03 * sin(u_time * 11.0 + 0.7)) * u_dizzy;

  vec3 eL = orient(normalize(vec3(-0.32 + wobbleL.x, 0.08 + wobbleL.y, 1.0)), look);
  vec3 eR = orient(normalize(vec3(0.32 + wobbleR.x, 0.08 + wobbleR.y, 1.0)), look);

  float baseHalfH = 0.128;
  baseHalfH = mix(baseHalfH, 0.016, u_surprise);
  baseHalfH = mix(baseHalfH, 0.072, u_squint);

  float baseRad = 0.054;
  baseRad = mix(baseRad, 0.09, u_surprise);
  baseRad = mix(baseRad, 0.058, u_squint);

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
`

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim()
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.padEnd(6, "0").slice(0, 6)
  const n = Number.parseInt(full, 16)
  if (Number.isNaN(n)) return [0.95, 0.79, 0.3]
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function resolveVariant(
  variant: LiveOrbVariant | undefined,
  color?: string,
  eyeColor?: string,
  colors?: string[],
  dark = true
) {
  let body: string = WHITE.color
  let eye: string = WHITE.eyeColor
  let mode = 0
  let palette: string[] = WEBGL_COLORS
  const preset = variant ?? defaultVariant(dark)

  if (preset === "black") {
    body = BLACK.color
    eye = BLACK.eyeColor
  } else if (preset === "webgl") {
    palette = colors && colors.length > 0 ? colors : WEBGL_COLORS
    body = palette[1] ?? WEBGL_COLORS[1]!
    eye = "#0C0C10"
    mode = 1
  } else if (preset === "custom") {
    body = color ?? CUSTOM_DEFAULT.color
    eye = eyeColor ?? CUSTOM_DEFAULT.eyeColor
  }

  return { body, eye, mode, palette }
}

export function fallbackFaceStyle(
  resolved: ReturnType<typeof resolveVariant>
): {
  backgroundColor?: string
  backgroundImage?: string
} {
  if (resolved.mode === 1) {
    const a = resolved.palette[0] ?? WEBGL_COLORS[0]
    const b = resolved.palette[1] ?? WEBGL_COLORS[1]
    const c = resolved.palette[2] ?? WEBGL_COLORS[2]
    return {
      backgroundImage: `linear-gradient(135deg, ${a}, ${b}, ${c})`,
    }
  }
  return { backgroundColor: resolved.body }
}

const IDLE_MS = 3200
const REST_LOOK = { x: 0, y: 0.08 }

export function createLiveOrb(
  canvas: HTMLCanvasElement,
  initial: LiveOrbOptions = {}
): LiveOrbInstance | null {
  let options: Required<Pick<LiveOrbOptions, "interactive" | "blink">> &
    LiveOrbOptions = {
    interactive: true,
    blink: true,
    lookMode: "viewport",
    ...initial,
  }
  let dark = resolveDark(options.theme)

  const look = { x: 0, y: 0.08 }
  const targetLook = { x: 0, y: 0.08 }
  const glance = { x: 0, y: 0.08 }

  const curMood = {
    happy: 0,
    surprise: 0,
    squint: 0,
    curious: 0,
    sleepy: 0,
    dizzy: 0,
  }
  const targetMood = { ...curMood }

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
  })
  if (!gl) return null

  const useFullShader = options.variant === "webgl"

  let vs: WebGLShader | null = null
  let fs: WebGLShader | null = null
  let program: WebGLProgram | null = null
  let buf: WebGLBuffer | null = null
  let uResolution: WebGLUniformLocation | null = null
  let uTime: WebGLUniformLocation | null = null
  let uSpeed: WebGLUniformLocation | null = null
  let uLook: WebGLUniformLocation | null = null
  let uBlinkL: WebGLUniformLocation | null = null
  let uBlinkR: WebGLUniformLocation | null = null
  let uWinkL: WebGLUniformLocation | null = null
  let uWinkR: WebGLUniformLocation | null = null
  let uHappy: WebGLUniformLocation | null = null
  let uSurprise: WebGLUniformLocation | null = null
  let uSquint: WebGLUniformLocation | null = null
  let uCurious: WebGLUniformLocation | null = null
  let uSleepy: WebGLUniformLocation | null = null
  let uDizzy: WebGLUniformLocation | null = null
  let uMode: WebGLUniformLocation | null = null
  let uBody: WebGLUniformLocation | null = null
  let uEye: WebGLUniformLocation | null = null
  let uC1: WebGLUniformLocation | null = null
  let uC2: WebGLUniformLocation | null = null
  let uC3: WebGLUniformLocation | null = null

  const initGl = () => {
    vs = compile(gl, gl.VERTEX_SHADER, VERT)
    fs = compile(gl, gl.FRAGMENT_SHADER, useFullShader ? FRAG : FRAG_KODAK)
    if (!vs || !fs) return false

    const prog = gl.createProgram()
    if (!prog) return false
    program = prog
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false
    gl.useProgram(prog)

    buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )
    const loc = gl.getAttribLocation(prog, "a_position")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    uResolution = gl.getUniformLocation(prog, "u_resolution")
    uTime = gl.getUniformLocation(prog, "u_time")
    uSpeed = gl.getUniformLocation(prog, "u_speed")
    uLook = gl.getUniformLocation(prog, "u_look")
    uBlinkL = gl.getUniformLocation(prog, "u_blinkL")
    uBlinkR = gl.getUniformLocation(prog, "u_blinkR")
    uWinkL = gl.getUniformLocation(prog, "u_winkL")
    uWinkR = gl.getUniformLocation(prog, "u_winkR")
    uHappy = gl.getUniformLocation(prog, "u_happy")
    uSurprise = gl.getUniformLocation(prog, "u_surprise")
    uSquint = gl.getUniformLocation(prog, "u_squint")
    uCurious = gl.getUniformLocation(prog, "u_curious")
    uSleepy = gl.getUniformLocation(prog, "u_sleepy")
    uDizzy = gl.getUniformLocation(prog, "u_dizzy")
    uMode = gl.getUniformLocation(prog, "u_mode")
    uBody = gl.getUniformLocation(prog, "u_body")
    uEye = gl.getUniformLocation(prog, "u_eye")
    uC1 = gl.getUniformLocation(prog, "u_c1")
    uC2 = gl.getUniformLocation(prog, "u_c2")
    uC3 = gl.getUniformLocation(prog, "u_c3")

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.viewport(0, 0, canvas.width, canvas.height)
    return true
  }

  if (!initGl()) return null
  options.onHasGl?.(true)

  let raf = 0
  let idleWakeTimer: ReturnType<typeof setTimeout> | null = null
  let destroyed = false
  let lost = false
  let onScreen = true
  let last = 0
  let clock = 0
  let nextBlink = 1600 + Math.random() * 2400
  let blinkAtL = -10_000
  let blinkAtR = -10_000
  let winkAtL = -10_000
  let winkAtR = -10_000
  let nextGlance = 600 + Math.random() * 900
  let pointerAt = -Infinity

  const resize = () => {
    const parent = canvas.parentElement
    if (!parent) return false
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = parent.clientWidth
    const h = parent.clientHeight
    if (w <= 0 || h <= 0) return false
    const width = Math.max(1, Math.floor(w * dpr))
    const height = Math.max(1, Math.floor(h * dpr))
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    if (width === canvas.width && height === canvas.height) return false
    canvas.width = width
    canvas.height = height
    gl.viewport(0, 0, canvas.width, canvas.height)
    return true
  }

  const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)")

  const moving = () =>
    onScreen && !mqReduce.matches && document.visibilityState !== "hidden"

  function wake() {
    if (idleWakeTimer) {
      clearTimeout(idleWakeTimer)
      idleWakeTimer = null
    }
    if (raf || destroyed || lost) return
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }

  function redraw() {
    if (destroyed || lost) return
    cancelAnimationFrame(raf)
    raf = 0
    last = performance.now()
    tick(last)
  }

  const lookAtViewportPoint = (
    clientX: number,
    clientY: number,
    orbLeft?: number,
    orbTop?: number,
    orbSize?: number
  ) => {
    let w = orbSize || 56
    let h = orbSize || 56
    let cx = 0
    let cy = 0
    if (typeof orbLeft === "number" && typeof orbTop === "number") {
      cx = orbLeft + w * 0.5
      cy = orbTop + h * 0.5
    } else {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      w = rect.width
      h = rect.height
      cx = rect.left + w * 0.5
      cy = rect.top + h * 0.5
    }

    const scaleX =
      options.lookMode === "viewport"
        ? Math.max(w * 0.5, window.innerWidth * 0.28)
        : w * 0.5
    const scaleY =
      options.lookMode === "viewport"
        ? Math.max(h * 0.5, window.innerHeight * 0.28)
        : h * 0.5

    const dx = (clientX - cx) / scaleX
    const dy = (cy - clientY) / scaleY
    targetLook.x = Math.min(1, Math.max(-1, dx))
    targetLook.y = Math.min(1, Math.max(-1, dy))
    pointerAt = performance.now()
    if (onScreen) wake()
  }

  const blinkCurve = (dtSec: number) => {
    if (dtSec < 0) return 0
    if (dtSec < 0.055) return dtSec / 0.055
    if (dtSec < 0.1) return 1
    if (dtSec < 0.18) return 1 - (dtSec - 0.1) / 0.08
    return 0
  }

  const winkCurve = (dtSec: number) => {
    if (dtSec < 0) return 0
    if (dtSec < 0.07) return dtSec / 0.07
    if (dtSec < 0.25) return 1
    if (dtSec < 0.42) return 1 - (dtSec - 0.25) / 0.17
    return 0
  }

  const tick = (now: number) => {
    raf = 0
    if (lost) return
    const dt = Math.min(50, Math.max(0, now - last))
    last = now
    const live = moving()
    if (live) clock += dt
    const reduce = mqReduce.matches

    const resolved = resolveVariant(
      options.variant,
      options.color,
      options.eyeColor,
      options.colors,
      dark
    )
    const time = clock / 1000

    const steering = options.interactive && now - pointerAt < IDLE_MS
    if (!steering && live && clock >= nextGlance && curMood.sleepy < 0.3) {
      const back = Math.random() < 0.3
      glance.x = back ? 0 : (Math.random() * 2 - 1) * 0.8
      glance.y = back ? 0.08 : (Math.random() * 2 - 1) * 0.5
      nextGlance = clock + 1100 + Math.random() * 2400
    }
    const goal = steering ? targetLook : reduce ? REST_LOOK : glance
    const ease = live ? (steering ? 0.18 : 0.1) : 1
    look.x += (goal.x - look.x) * ease
    look.y += (goal.y - look.y) * ease

    const moodEase = live ? 0.18 : 1
    let moodDelta = 0
    ;(Object.keys(curMood) as Array<keyof typeof curMood>).forEach((k) => {
      const diff = targetMood[k] - curMood[k]
      curMood[k] += diff * moodEase
      moodDelta += Math.abs(diff)
    })

    if (!reduce && options.blink && clock >= nextBlink && curMood.sleepy < 0.3) {
      blinkAtL = clock
      blinkAtR = clock
      nextBlink = clock + 2600 + Math.random() * 3800
    }

    const bL = !reduce && options.blink ? blinkCurve((clock - blinkAtL) / 1000) : 0
    const bR = !reduce && options.blink ? blinkCurve((clock - blinkAtR) / 1000) : 0
    const wL = !reduce ? winkCurve((clock - winkAtL) / 1000) : 0
    const wR = !reduce ? winkCurve((clock - winkAtR) / 1000) : 0

    const body = hexToRgb(resolved.body)
    const eye = hexToRgb(resolved.eye)
    const palette = [0, 1, 2].map((i) =>
      hexToRgb(
        resolved.palette[i % resolved.palette.length] ?? WEBGL_COLORS[i]!
      )
    )

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform2f(uResolution, canvas.width, canvas.height)
    gl.uniform1f(uTime, reduce ? 0 : time)
    gl.uniform1f(uSpeed, reduce ? 0 : 0.55)
    gl.uniform2f(uLook, look.x, look.y)
    gl.uniform1f(uBlinkL, bL)
    gl.uniform1f(uBlinkR, bR)
    gl.uniform1f(uWinkL, wL)
    gl.uniform1f(uWinkR, wR)
    gl.uniform1f(uHappy, reduce ? 0 : curMood.happy)
    gl.uniform1f(uSurprise, reduce ? 0 : curMood.surprise)
    gl.uniform1f(uSquint, reduce ? 0 : curMood.squint)
    gl.uniform1f(uCurious, reduce ? 0 : curMood.curious)
    gl.uniform1f(uSleepy, reduce ? 0 : curMood.sleepy)
    gl.uniform1f(uDizzy, reduce ? 0 : curMood.dizzy)
    gl.uniform1f(uMode, resolved.mode)
    gl.uniform3f(uBody, body[0], body[1], body[2])
    gl.uniform3f(uEye, eye[0], eye[1], eye[2])
    gl.uniform3f(uC1, palette[0]![0], palette[0]![1], palette[0]![2])
    gl.uniform3f(uC2, palette[1]![0], palette[1]![1], palette[1]![2])
    gl.uniform3f(uC3, palette[2]![0], palette[2]![1], palette[2]![2])

    gl.drawArrays(gl.TRIANGLES, 0, 6)

    if (!live || destroyed) return

    // Auto-veille GPU : si la couleur est unie (mode 0), que le regard/émotion est
    // stabilisé et qu'aucun clignement/spirale n'est en cours, on dort jusqu'au
    // prochain clignement ou coup d'œil au lieu de tourner à 60 fps pour rien.
    const lookDelta = Math.abs(goal.x - look.x) + Math.abs(goal.y - look.y)
    const activeAnim =
      resolved.mode > 0.5 ||
      curMood.dizzy > 0.01 ||
      bL > 0 ||
      bR > 0 ||
      wL > 0 ||
      wR > 0 ||
      lookDelta > 0.0025 ||
      moodDelta > 0.004

    if (activeAnim) {
      raf = requestAnimationFrame(tick)
    } else if (curMood.sleepy < 0.8) {
      const waitMs = Math.max(
        120,
        Math.min(nextBlink - clock, steering ? IDLE_MS : nextGlance - clock)
      )
      idleWakeTimer = setTimeout(() => {
        clock += waitMs
        wake()
      }, waitMs)
    }
  }

  const ro = new ResizeObserver(() => {
    if (resize()) redraw()
  })
  if (canvas.parentElement) ro.observe(canvas.parentElement)
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? true
    wake()
  })
  io.observe(canvas)
  const onVisibility = () => wake()
  document.addEventListener("visibilitychange", onVisibility)
  const onReduce = () => wake()
  mqReduce.addEventListener("change", onReduce)
  const syncTheme = () => {
    const next = resolveDark(options.theme)
    if (next === dark) return
    dark = next
    wake()
  }
  const unwatchTheme = watchTheme(syncTheme)

  const onLost = (e: Event) => {
    e.preventDefault()
    lost = true
    cancelAnimationFrame(raf)
    raf = 0
    canvas.style.visibility = "hidden"
    options.onHasGl?.(false)
  }
  const onRestored = () => {
    if (destroyed) return
    if (!initGl()) return
    lost = false
    canvas.style.visibility = ""
    options.onHasGl?.(true)
    wake()
  }
  canvas.addEventListener("webglcontextlost", onLost)
  canvas.addEventListener("webglcontextrestored", onRestored)

  resize()
  wake()

  return {
    setOptions(next) {
      options = { ...options, ...next }
      dark = resolveDark(options.theme)
      wake()
    },
    setMoodValues(values = {}) {
      ;(Object.keys(targetMood) as Array<keyof typeof targetMood>).forEach(
        (k) => {
          targetMood[k] = typeof values[k] === "number" ? values[k]! : 0
        }
      )
      wake()
    },
    triggerBlink() {
      if (mqReduce.matches) return
      blinkAtL = clock
      blinkAtR = clock
      nextBlink = clock + 2600 + Math.random() * 3800
      wake()
    },
    triggerWink(side = "right") {
      if (mqReduce.matches) return
      if (side === "left") winkAtL = clock
      else winkAtR = clock
      wake()
    },
    lookAtViewportPoint,
    nudgeLook(x, y) {
      targetLook.x = Math.min(1, Math.max(-1, x))
      targetLook.y = Math.min(1, Math.max(-1, y))
      pointerAt = performance.now()
      wake()
    },
    destroy() {
      destroyed = true
      if (idleWakeTimer) clearTimeout(idleWakeTimer)
      cancelAnimationFrame(raf)
      raf = 0
      ro.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      mqReduce.removeEventListener("change", onReduce)
      unwatchTheme()
      canvas.removeEventListener("webglcontextlost", onLost)
      canvas.removeEventListener("webglcontextrestored", onRestored)
      if (lost) canvas.style.visibility = ""
      options.onHasGl?.(false)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
      const lose = gl.getExtension("WEBGL_lose_context")
      queueMicrotask(() => {
        if (!canvas.isConnected && !gl.isContextLost()) lose?.loseContext()
      })
    },
  }
}

export type LiveOrbProps = Omit<LiveOrbOptions, "onHasGl"> & {
  className?: string
  size?: number
}

export function LiveOrb({
  className,
  size = 56,
  variant = "custom",
  color = KODAK.color,
  eyeColor = KODAK.eyeColor,
  colors,
  interactive = true,
  blink = true,
  theme = "dark",
}: LiveOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const instanceRef = useRef<LiveOrbInstance | null>(null)
  const [hasGl, setHasGl] = useState(false)
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const sync = () => setDark(resolveDark(theme))
    sync()
    return watchTheme(sync)
  }, [theme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    instanceRef.current = createLiveOrb(canvas, {
      variant,
      color,
      eyeColor,
      colors,
      interactive,
      blink,
      theme,
      onHasGl: setHasGl,
    })
    return () => {
      instanceRef.current?.destroy()
      instanceRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    instanceRef.current?.setOptions({
      variant,
      color,
      eyeColor,
      colors,
      interactive,
      blink,
      theme,
      onHasGl: setHasGl,
    })
  }, [variant, color, eyeColor, colors, interactive, blink, theme])

  const resolved = resolveVariant(variant, color, eyeColor, colors, dark)

  return (
    <div
      data-slot="live-orb"
      role="img"
      aria-label="Orb character"
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {!hasGl ? (
        <div
          aria-hidden
          className="absolute inset-[3%] overflow-hidden rounded-full"
          style={fallbackFaceStyle(resolved)}
        >
          <span
            className="absolute rounded-full"
            style={{
              backgroundColor: resolved.eye,
              width: "13%",
              height: "28%",
              left: "31%",
              top: "34%",
            }}
          />
          <span
            className="absolute rounded-full"
            style={{
              backgroundColor: resolved.eye,
              width: "13%",
              height: "28%",
              left: "56%",
              top: "34%",
            }}
          />
        </div>
      ) : null}
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  )
}
