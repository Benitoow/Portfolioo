import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { BackgroundPixelStars } from "@/components/ui/background-pixel-stars";
import {
  SKILLS_CLUSTERS,
  SOFT_HIGHLIGHTS,
  type SkillCluster,
  type SkillTool,
} from "../data/skillsCatalog";

type FilterId = "all" | SkillCluster["id"];
type ViewMode = "galaxy" | "grid";

interface SelectionState {
  cluster: SkillCluster;
  tool: SkillTool;
}

interface HoverTip {
  name: string;
  role: string;
  x: number;
  y: number;
}

interface NodeRefMap {
  [key: string]: HTMLButtonElement | null;
}

function buildMonogramBGeometry(): THREE.ExtrudeGeometry {
  const bShape = new THREE.Shape();
  bShape.moveTo(-1.05, -1.1);
  bShape.lineTo(0.12, -1.1);
  bShape.bezierCurveTo(0.68, -1.1, 0.88, -0.78, 0.88, -0.45);
  bShape.bezierCurveTo(0.88, -0.18, 0.72, -0.02, 0.45, 0.05);
  bShape.bezierCurveTo(0.68, 0.14, 0.8, 0.3, 0.8, 0.56);
  bShape.bezierCurveTo(0.8, 0.88, 0.56, 1.1, 0.06, 1.1);
  bShape.lineTo(-1.05, 1.1);
  bShape.closePath();

  const topHole = new THREE.Path();
  topHole.moveTo(-0.52, 0.24);
  topHole.lineTo(-0.52, 0.72);
  topHole.lineTo(-0.02, 0.72);
  topHole.bezierCurveTo(0.22, 0.72, 0.3, 0.6, 0.3, 0.48);
  topHole.bezierCurveTo(0.3, 0.35, 0.22, 0.24, -0.02, 0.24);
  topHole.closePath();
  bShape.holes.push(topHole);

  const botHole = new THREE.Path();
  botHole.moveTo(-0.52, -0.72);
  botHole.lineTo(-0.52, -0.14);
  botHole.lineTo(0.06, -0.14);
  botHole.bezierCurveTo(0.32, -0.14, 0.38, -0.28, 0.38, -0.43);
  botHole.bezierCurveTo(0.38, -0.58, 0.3, -0.72, 0.06, -0.72);
  botHole.closePath();
  bShape.holes.push(botHole);

  const geom = new THREE.ExtrudeGeometry(bShape, {
    depth: 0.38,
    bevelEnabled: true,
    bevelSegments: 8,
    steps: 1,
    bevelSize: 0.068,
    bevelThickness: 0.088,
    curveSegments: 36,
  });
  geom.translate(0, 0, -0.19);
  geom.computeVertexNormals();
  return geom;
}

function buildDotGeometry(): THREE.ExtrudeGeometry {
  const dot = new THREE.Shape();
  dot.absarc(1.26, -0.84, 0.24, 0, Math.PI * 2, false);
  const geom = new THREE.ExtrudeGeometry(dot, {
    depth: 0.38,
    bevelEnabled: true,
    bevelSegments: 7,
    steps: 1,
    bevelSize: 0.058,
    bevelThickness: 0.078,
    curveSegments: 32,
  });
  geom.translate(0, 0, -0.19);
  geom.computeVertexNormals();
  return geom;
}

function createStarburstSeeds(count: number, seedOffset: number) {
  const dots: { angle: number; dist: number; size: number; alpha: number }[] = [];
  for (let i = 0; i < count; i += 1) {
    const s1 = Math.sin((i + 1 + seedOffset) * 12.9898) * 43758.5453;
    const s2 = Math.sin((i + 7 + seedOffset) * 78.233) * 19341.123;
    const r1 = s1 - Math.floor(s1);
    const r2 = s2 - Math.floor(s2);
    dots.push({
      angle: (i / count) * Math.PI * 2 + (r1 - 0.5) * 0.42,
      dist: 0.48 + r2 * 0.64,
      size: 1.05 + r1 * 1.9,
      alpha: 0.22 + r2 * 0.5,
    });
  }
  return dots;
}

const SHORT_DOMAIN_LABELS: Record<SkillCluster["id"], string> = {
  ai: "IA & Code",
  design: "Design",
  video: "Vidéo",
  code: "Web & Cloud",
};

/** For the 3D orbital view, exclude any tool whose logo is already the cluster's central hub logo */
function getOrbitSatellites(cluster: SkillCluster): SkillTool[] {
  return cluster.tools.filter((t) => t.logo !== cluster.hubLogo);
}

function getHubPrimaryTool(cluster: SkillCluster): SkillTool {
  return cluster.tools.find((t) => t.logo === cluster.hubLogo) || cluster.tools[0];
}

export default function SkillsOrbit3D() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ringCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const nodeRefs = useRef<NodeRefMap>({});

  const [filter, setFilter] = useState<FilterId>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("galaxy");
  const [hoveredCluster, setHoveredCluster] = useState<SkillCluster["id"] | null>(null);
  const [hoveredToolId, setHoveredToolId] = useState<string | null>(null);
  const [hoverTip, setHoverTip] = useState<HoverTip | null>(null);
  const [selected, setSelected] = useState<SelectionState | null>(null);

  const interactionRef = useRef({
    filter: "all" as FilterId,
    hoveredCluster: null as SkillCluster["id"] | null,
    hoveredToolId: null as string | null,
    selectedToolId: "",
    pointerX: 0,
    pointerY: 0,
    bTargetYaw: -0.22,
    bTargetPitch: 0.06,
    bVelYaw: 0,
    dragging: false,
    dragLastX: 0,
    dragLastY: 0,
    dragLastTime: 0,
    reducedMotion: false,
  });

  useEffect(() => {
    interactionRef.current.filter = filter;
    interactionRef.current.hoveredCluster = hoveredCluster;
    interactionRef.current.hoveredToolId = hoveredToolId;
    interactionRef.current.selectedToolId = selected?.tool.id ?? "";
  }, [filter, hoveredCluster, hoveredToolId, selected?.tool.id]);

  const starburstByCluster = useMemo(() => {
    const out: Record<string, ReturnType<typeof createStarburstSeeds>> = {};
    SKILLS_CLUSTERS.forEach((c, idx) => {
      out[c.id] = createStarburstSeeds(22, idx * 31);
    });
    return out;
  }, []);

  const totalToolCount = useMemo(
    () => SKILLS_CLUSTERS.reduce((acc, c) => acc + c.tools.length, 0),
    []
  );

  const handleSelectTool = (cluster: SkillCluster, tool: SkillTool) => {
    setSelected({ cluster, tool });
    window.dispatchEvent(
      new CustomEvent("bl:skill-select", {
        detail: { clusterId: cluster.id, clusterLabel: cluster.label, tool },
      })
    );
  };

  const showNodeTooltip = (el: HTMLElement | null, name: string, role: string) => {
    if (!el || !stageRef.current) return;
    const stageRect = stageRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setHoverTip({
      name,
      role,
      x: clampNum(r.left - stageRect.left + r.width / 2, 90, stageRect.width - 90),
      y: Math.max(46, r.top - stageRect.top - 12),
    });
  };

  // Three.js liquid chrome sculptural "B." — isolated physics
  useEffect(() => {
    if (viewMode !== "galaxy") return;
    const canvas = threeCanvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    interactionRef.current.reducedMotion = mqReduce.matches;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.035);
    roomEnv.dispose();
    pmrem.dispose();

    const scene = new THREE.Scene();
    scene.environment = envTarget.texture;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
    camera.position.set(0, -0.05, 8.8);

    const group = new THREE.Group();
    group.scale.setScalar(0.36);
    scene.add(group);

    const bGeom = buildMonogramBGeometry();
    const dotGeom = buildDotGeometry();

    const chromeMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#cfd6e6"),
      metalness: 1.0,
      roughness: 0.06,
      envMapIntensity: 1.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      iridescence: 1.0,
      iridescenceIOR: 1.4,
      iridescenceThicknessRange: [160, 600],
    });

    const accentChromeMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#a5b8ff"),
      metalness: 0.96,
      roughness: 0.08,
      envMapIntensity: 1.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      iridescence: 0.9,
    });

    const bMesh = new THREE.Mesh(bGeom, chromeMat);
    const dotMesh = new THREE.Mesh(dotGeom, accentChromeMat);
    group.add(bMesh);
    group.add(dotMesh);

    const keyLight = new THREE.DirectionalLight(0xeef3ff, 2.2);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const blueRim = new THREE.PointLight(0x6c8cff, 10, 20, 1.4);
    blueRim.position.set(-4.8, -2.5, 4.5);
    scene.add(blueRim);

    const violetRim = new THREE.PointLight(0xa78bfa, 10, 20, 1.4);
    violetRim.position.set(4.8, 3.2, 4.0);
    scene.add(violetRim);

    const syncSize = () => {
      const w = Math.max(300, stage.clientWidth);
      const h = Math.max(360, stage.clientHeight);
      renderer?.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = w < 680 ? 11.4 : 8.6;
      camera.updateProjectionMatrix();
    };
    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(stage);

    const BASE_YAW = -0.22;
    const BASE_PITCH = 0.06;
    let raf = 0;
    let lastT = performance.now();
    let elapsed = 0;
    let curYaw = BASE_YAW;
    let curPitch = BASE_PITCH;
    let smoothPtrX = 0;
    let smoothPtrY = 0;

    const renderThree = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
      lastT = now;

      if (document.visibilityState !== "hidden") {
        const st = interactionRef.current;
        const reduce = st.reducedMotion;
        if (!reduce) elapsed += dt;

        const ptrAlpha = 1 - Math.exp(-dt * 3.2);
        smoothPtrX += (st.pointerX - smoothPtrX) * ptrAlpha;
        smoothPtrY += (st.pointerY - smoothPtrY) * ptrAlpha;

        if (!st.dragging) {
          if (Math.abs(st.bVelYaw) > 0.001) {
            st.bTargetYaw += st.bVelYaw * dt;
            st.bVelYaw *= Math.exp(-dt * 3.8);
          } else {
            st.bVelYaw = 0;
          }
          // Gentle magnetic righting spring toward the nearest full revolution of the hero 3/4 pose
          // so the B. never remains stuck edge-on at 90° after a drag or spin
          const nearestRestYaw =
            Math.round((st.bTargetYaw - BASE_YAW) / (Math.PI * 2)) * (Math.PI * 2) + BASE_YAW;
          const springRate = 1 - Math.exp(-dt * (Math.abs(st.bVelYaw) > 0.25 ? 0.35 : 1.45));
          st.bTargetYaw += (nearestRestYaw - st.bTargetYaw) * springRate;
          st.bTargetPitch += (BASE_PITCH - st.bTargetPitch) * (1 - Math.exp(-dt * 2.2));
        }

        const subtleYaw = smoothPtrX * 0.065 + (reduce ? 0 : Math.sin(elapsed * 0.45) * 0.045);
        const subtlePitch = -smoothPtrY * 0.04 + (reduce ? 0 : Math.cos(elapsed * 0.35) * 0.03);

        const followRate = st.dragging ? 1 - Math.exp(-dt * 24) : 1 - Math.exp(-dt * 12);
        curYaw += (st.bTargetYaw + subtleYaw - curYaw) * followRate;
        curPitch += (st.bTargetPitch + subtlePitch - curPitch) * followRate;

        group.rotation.y = curYaw;
        group.rotation.x = curPitch;
        group.position.y = reduce ? -0.05 : -0.05 + Math.sin(elapsed * 0.9) * 0.03;

        renderer?.render(scene, camera);
      }

      raf = requestAnimationFrame(renderThree);
    };
    raf = requestAnimationFrame(renderThree);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      bGeom.dispose();
      dotGeom.dispose();
      chromeMat.dispose();
      accentChromeMat.dispose();
      envTarget.dispose();
      renderer?.dispose();
    };
  }, [viewMode]);

  // Steady 3D Orbital Projection (no mouse-move wobble, zero intra-cluster overlap, core clearance)
  useEffect(() => {
    if (viewMode !== "galaxy") return;
    const stage = stageRef.current;
    const ringCanvas = ringCanvasRef.current;
    if (!stage || !ringCanvas) return;
    const ctx = ringCanvas.getContext("2d");
    if (!ctx) return;

    let stageW = stage.clientWidth || 1280;
    let stageH = stage.clientHeight || 800;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resizeOverlay = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      stageW = Math.max(300, stage.clientWidth);
      stageH = Math.max(360, stage.clientHeight);
      ringCanvas.width = Math.round(stageW * dpr);
      ringCanvas.height = Math.round(stageH * dpr);
      ringCanvas.style.width = `${stageW}px`;
      ringCanvas.style.height = `${stageH}px`;
    };
    resizeOverlay();
    const ro = new ResizeObserver(resizeOverlay);
    ro.observe(stage);

    let raf = 0;
    let orbitClock = 0;
    let orbitSpeed = 1;
    let lastNow = performance.now();

    const FIXED_ELEV = 0.52;
    const FIXED_ROLL = -0.095;
    const cosR = Math.cos(FIXED_ROLL);
    const sinR = Math.sin(FIXED_ROLL);
    const cosE = Math.cos(FIXED_ELEV);
    const sinE = Math.sin(FIXED_ELEV);

    const project = (x3: number, y3: number, z3: number) => {
      const xr = x3 * cosR - z3 * sinR;
      const zr = x3 * sinR + z3 * cosR;

      const yScreen = y3 * cosE + zr * sinE;
      const zDepth = zr * cosE - y3 * sinE;

      const camDist = 1350;
      const depthScale = camDist / Math.max(320, camDist - zDepth);
      return {
        x: stageW * 0.52 + xr * depthScale,
        y: stageH * 0.535 + yScreen * depthScale,
        z: zDepth,
        scale: depthScale,
      };
    };

    const drawLoop = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastNow) / 1000));
      lastNow = now;

      if (document.visibilityState !== "hidden") {
        const st = interactionRef.current;
        const isLockedHover = Boolean(st.hoveredCluster) || Boolean(st.hoveredToolId);

        const targetSpeed = st.reducedMotion || isLockedHover ? 0 : st.filter !== "all" ? 0.35 : 1;
        const speedRate = isLockedHover ? 1 - Math.exp(-dt * 18) : 1 - Math.exp(-dt * 4.5);
        orbitSpeed += (targetSpeed - orbitSpeed) * speedRate;
        if (orbitSpeed < 0.002 && targetSpeed === 0) orbitSpeed = 0;
        orbitClock += dt * orbitSpeed;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, stageW, stageH);

        const isMobile = stageW < 680;
        const isTablet = stageW < 1040;
        const coreCenterX = stageW * 0.505;
        const coreCenterY = stageH * 0.5;
        const coreKeepoutRx = isMobile ? 96 : 172;
        const coreKeepoutRy = isMobile ? 88 : 148;

        const rxBase = isMobile
          ? stageW * 0.32
          : isTablet
            ? stageW * 0.34
            : Math.min(445, stageW * 0.35);
        const ryVert = isMobile ? stageH * 0.025 : stageH * 0.032;

        const QUADRANT_ANGLES: Record<SkillCluster["id"], number> = {
          design: -2.42,
          video: -0.56,
          ai: 0.65,
          code: 2.58,
        };

        const rings = [
          { rX: rxBase * 0.82, rZ: rxBase * 0.78, yOff: -ryVert * 0.35, alpha: 0.14 },
          { rX: rxBase * 1.06, rZ: rxBase * 0.96, yOff: ryVert * 0.35, alpha: 0.11 },
          { rX: rxBase * 1.24, rZ: rxBase * 1.12, yOff: 0, alpha: 0.045 },
        ];

        rings.forEach((ring, idx) => {
          ctx.beginPath();
          const steps = 96;
          for (let i = 0; i <= steps; i += 1) {
            const a = (i / steps) * Math.PI * 2;
            const pt = project(
              Math.cos(a) * ring.rX,
              ring.yOff,
              Math.sin(a) * ring.rZ
            );
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.strokeStyle =
            idx === 0
              ? `rgba(182, 200, 255, ${ring.alpha + 0.03})`
              : `rgba(166, 182, 240, ${ring.alpha})`;
          ctx.lineWidth = idx === 0 ? 1 : 0.75;
          ctx.stroke();
        });

        const visibleClusters =
          st.filter === "all"
            ? SKILLS_CLUSTERS
            : SKILLS_CLUSTERS.filter((c) => c.id === st.filter);

        SKILLS_CLUSTERS.forEach((cluster, cIdx) => {
          const activeCluster = st.filter === "all" || st.filter === cluster.id;
          const hubEl = nodeRefs.current[`hub:${cluster.id}`];
          const satellites = getOrbitSatellites(cluster);

          if (!activeCluster) {
            if (hubEl) {
              hubEl.style.opacity = "0";
              hubEl.style.pointerEvents = "none";
            }
            satellites.forEach((tool) => {
              const tEl = nodeRefs.current[`tool:${tool.id}`];
              if (tEl) {
                tEl.style.opacity = "0";
                tEl.style.pointerEvents = "none";
              }
            });
            return;
          }

          const ring = rings[cluster.orbitRing];
          const isSingleFiltered = visibleClusters.length === 1;
          // Each constellation gently glides along its dedicated 3D elliptical quadrant arc
          // while its tool satellites revolve a full continuous 360° around the hub
          const baseAngle = isSingleFiltered
            ? Math.PI * 0.5
            : (QUADRANT_ANGLES[cluster.id] ?? cluster.initialAngle) +
              Math.sin(orbitClock * 0.36 + cIdx * 1.57) * 0.11;

          const hubX3 = isSingleFiltered ? 0 : Math.cos(baseAngle) * ring.rX;
          const hubZ3 = isSingleFiltered ? (isMobile ? 90 : 150) : Math.sin(baseAngle) * ring.rZ;
          const hubY3 = isSingleFiltered ? (isMobile ? 12 : 18) : ring.yOff;
          const hubProj = project(hubX3, hubY3, hubZ3);

          const isClusterHovered = st.hoveredCluster === cluster.id;
          const depthAlpha = clampNum(0.5 + (hubProj.scale - 0.78) * 1.4, 0.42, 1);

          const burstRadius = isMobile
            ? isSingleFiltered ? 92 : 62
            : isSingleFiltered ? 146 : 84;
          const seeds = starburstByCluster[cluster.id] || [];
          seeds.forEach((seed) => {
            const sx =
              hubProj.x + Math.cos(seed.angle + orbitClock * 0.1) * burstRadius * seed.dist * hubProj.scale;
            const sy =
              hubProj.y +
              Math.sin(seed.angle + orbitClock * 0.1) * burstRadius * 0.68 * seed.dist * hubProj.scale;
            ctx.beginPath();
            ctx.moveTo(hubProj.x, hubProj.y);
            ctx.lineTo(sx, sy);
            ctx.strokeStyle = `rgba(182, 198, 255, ${seed.alpha * 0.14 * depthAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(sx, sy, seed.size * 0.9 * hubProj.scale, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(198, 212, 255, ${seed.alpha * 0.55 * depthAlpha})`;
            ctx.fill();
          });

          if (hubEl) {
            const sc = clampNum(hubProj.scale * (isSingleFiltered ? 1.06 : 1), 0.78, 1.18);
            hubEl.style.transform = `translate3d(${hubProj.x.toFixed(1)}px, ${hubProj.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${sc.toFixed(3)})`;
            hubEl.style.zIndex = String(Math.round(500 + hubProj.z * 0.4 + (isClusterHovered ? 80 : 0)));
            hubEl.style.opacity = isSingleFiltered ? "0.98" : depthAlpha.toFixed(2);
            hubEl.style.pointerEvents = "auto";
          }

          // Calibrated per-cluster radii so satellite buttons never overlap each other or their hub
          const satCount = satellites.length;
          const satRx = isMobile
            ? isSingleFiltered
              ? 108
              : satCount > 6 ? 68 : satCount > 4 ? 62 : 56
            : isSingleFiltered
              ? 198
              : satCount > 6 ? 104 : satCount > 4 ? 92 : 84;
          const satRy = isMobile
            ? isSingleFiltered
              ? 76
              : satCount > 6 ? 50 : satCount > 4 ? 46 : 42
            : isSingleFiltered
              ? 124
              : satCount > 6 ? 78 : satCount > 4 ? 68 : 64;

          const padX = isMobile ? 36 : 54;
          const padTop = isMobile ? 142 : 114;
          const padBot = isMobile ? 128 : 86;

          satellites.forEach((tool, tIdx) => {
            const toolEl = nodeRefs.current[`tool:${tool.id}`];
            if (!toolEl) return;

            const tAngle =
              (tIdx / satCount) * Math.PI * 2 +
              orbitClock * (cluster.orbitRing === 0 ? 0.14 : -0.12) * (isSingleFiltered ? 0.4 : 1) +
              (cluster.id === "design" ? 0.45 : 0.2);

            const localX = Math.cos(tAngle) * satRx;
            const localY = Math.sin(tAngle) * satRy;
            const localZ = Math.sin(tAngle) * 26;

            let rawX = hubProj.x + localX * hubProj.scale;
            let rawY = hubProj.y + localY * hubProj.scale;

            // Elliptical keep-out buffer around the central 3D B. sculpture so no logo grazes it
            if (!isSingleFiltered) {
              const dxCore = rawX - coreCenterX;
              const dyCore = rawY - coreCenterY;
              const normDist = Math.hypot(dxCore / coreKeepoutRx, dyCore / coreKeepoutRy);
              if (normDist > 0.01 && normDist < 1) {
                const push = 1 / normDist;
                rawX = coreCenterX + dxCore * push;
                rawY = coreCenterY + dyCore * push;
              }
            }

            const satX = clampNum(rawX, padX, stageW - padX);
            const satY = clampNum(rawY, padTop, stageH - padBot);
            const satDepth = hubProj.scale * (1 + localZ / 520);
            const isSelectedTool = st.selectedToolId === tool.id;
            const isHoveredTool = st.hoveredToolId === tool.id;

            ctx.beginPath();
            ctx.moveTo(hubProj.x, hubProj.y);
            ctx.lineTo(satX, satY);
            ctx.strokeStyle =
              isSelectedTool || isHoveredTool
                ? "rgba(218, 228, 255, 0.75)"
                : `rgba(176, 192, 255, ${0.18 * depthAlpha})`;
            ctx.lineWidth = isSelectedTool || isHoveredTool ? 1.2 : 0.65;
            ctx.stroke();

            const finalScale = clampNum(
              satDepth * (isSingleFiltered ? 1.04 : 0.94),
              0.76,
              1.14
            );
            toolEl.style.transform = `translate3d(${satX.toFixed(1)}px, ${satY.toFixed(1)}px, 0) translate(-50%, -50%) scale(${finalScale.toFixed(3)})`;
            toolEl.style.zIndex = String(
              Math.round(520 + hubProj.z * 0.4 + localZ + (isHoveredTool || isSelectedTool ? 200 : 0))
            );
            toolEl.style.opacity = (
              isHoveredTool || isSelectedTool ? 1 : clampNum(depthAlpha + 0.12, 0.5, 0.98)
            ).toFixed(2);
            toolEl.style.pointerEvents = "auto";
          });
        });
      }

      raf = requestAnimationFrame(drawLoop);
    };

    raf = requestAnimationFrame(drawLoop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [viewMode, starburstByCluster]);

  const displayedClusters =
    filter === "all"
      ? SKILLS_CLUSTERS
      : SKILLS_CLUSTERS.filter((c) => c.id === filter);

  return (
    <div className="skills-studio" data-view={viewMode}>
      <BackgroundPixelStars />
      {viewMode === "galaxy" ? (
        <section
          ref={stageRef}
          className="skills-stage-full"
          aria-label="Carte orbitale 3D des outils"
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            interactionRef.current.pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            interactionRef.current.pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            if (interactionRef.current.dragging) {
              const now = performance.now();
              const dtMove = Math.max(0.008, (now - interactionRef.current.dragLastTime) / 1000);
              const dx = e.clientX - interactionRef.current.dragLastX;
              const dy = e.clientY - interactionRef.current.dragLastY;
              const dYaw = dx * 0.022;
              interactionRef.current.bTargetYaw += dYaw;
              interactionRef.current.bTargetPitch = clampNum(
                interactionRef.current.bTargetPitch + dy * 0.008,
                -0.65,
                0.65
              );
              interactionRef.current.bVelYaw = clampNum((dYaw / dtMove) * 0.35, -8, 8);
              interactionRef.current.dragLastX = e.clientX;
              interactionRef.current.dragLastY = e.clientY;
              interactionRef.current.dragLastTime = now;
            }
          }}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("button, a, aside")) return;
            interactionRef.current.dragging = true;
            interactionRef.current.bVelYaw = 0;
            interactionRef.current.dragLastX = e.clientX;
            interactionRef.current.dragLastY = e.clientY;
            interactionRef.current.dragLastTime = performance.now();
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              /* ignore synthetic events without active pointerId */
            }
          }}
          onPointerUp={(e) => {
            if (performance.now() - interactionRef.current.dragLastTime > 65) {
              interactionRef.current.bVelYaw = 0;
            }
            interactionRef.current.dragging = false;
            try {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            } catch {
              /* ignore */
            }
          }}
          onPointerCancel={() => {
            interactionRef.current.dragging = false;
            interactionRef.current.bVelYaw = 0;
          }}
          onPointerLeave={() => {
            if (!interactionRef.current.dragging) {
              interactionRef.current.pointerX = 0;
              interactionRef.current.pointerY = 0;
            }
            setHoverTip(null);
          }}
        >
          <div className="stage-editorial-title">
            <h1>Outils &amp; pratique</h1>
            <p>
              {totalToolCount} logiciels et langages réunis autour du studio. Survoler pour figer,
              glisser pour tourner le B. à 360°, cliquer un logo pour ouvrir la note.
            </p>
          </div>

          <canvas ref={threeCanvasRef} className="skills-three-canvas" aria-hidden="true" />
          <canvas ref={ringCanvasRef} className="skills-ring-canvas" aria-hidden="true" />

          <div className="skills-nodes-layer">
            {SKILLS_CLUSTERS.map((cluster) => {
              const hubTool = getHubPrimaryTool(cluster);
              const satellites = getOrbitSatellites(cluster);
              const isHubSelected = selected?.tool.id === hubTool.id && hubTool.logo === cluster.hubLogo;
              return (
                <React.Fragment key={cluster.id}>
                  <button
                    ref={(el) => {
                      nodeRefs.current[`hub:${cluster.id}`] = el;
                    }}
                    type="button"
                    className={`orbit-hub ${hoveredCluster === cluster.id ? "is-hovered" : ""} ${isHubSelected ? "is-selected" : ""}`}
                    style={{ "--hub-rgb": cluster.accentRgb } as React.CSSProperties}
                    aria-label={`${hubTool.logo === cluster.hubLogo ? `${hubTool.name} — ` : ""}Pôle ${cluster.label}`}
                    onMouseEnter={(e) => {
                      setHoveredCluster(cluster.id);
                      showNodeTooltip(
                        e.currentTarget,
                        hubTool.logo === cluster.hubLogo
                          ? `${hubTool.name} · ${cluster.label}`
                          : cluster.label,
                        cluster.subtitle
                      );
                    }}
                    onMouseLeave={() => {
                      setHoveredCluster(null);
                      setHoverTip(null);
                    }}
                    onClick={() => {
                      handleSelectTool(cluster, hubTool);
                    }}
                  >
                    <span className="orbit-hub-chip">
                      <img src={cluster.hubLogo} alt={cluster.label} width={28} height={28} />
                    </span>
                  </button>

                  {satellites.map((tool) => {
                    const isSel = selected?.tool.id === tool.id;
                    const isHov = hoveredToolId === tool.id;
                    return (
                      <button
                        key={tool.id}
                        ref={(el) => {
                          nodeRefs.current[`tool:${tool.id}`] = el;
                        }}
                        type="button"
                        className={`orbit-tool ${isSel ? "is-selected" : ""} ${isHov ? "is-hovered" : ""}`}
                        style={{ "--hub-rgb": cluster.accentRgb } as React.CSSProperties}
                        aria-label={`${tool.name} — ${tool.role}`}
                        onMouseEnter={(e) => {
                          setHoveredCluster(cluster.id);
                          setHoveredToolId(tool.id);
                          showNodeTooltip(e.currentTarget, tool.name, tool.role);
                        }}
                        onMouseLeave={() => {
                          setHoveredCluster(null);
                          setHoveredToolId(null);
                          setHoverTip(null);
                        }}
                        onFocus={(e) => {
                          setHoveredCluster(cluster.id);
                          showNodeTooltip(e.currentTarget, tool.name, tool.role);
                        }}
                        onBlur={() => {
                          setHoveredCluster(null);
                          setHoverTip(null);
                        }}
                        onClick={() => handleSelectTool(cluster, tool)}
                      >
                        <span className="orbit-tool-chip">
                          <img src={tool.logo} alt={tool.name} width={22} height={22} />
                        </span>
                      </button>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>

          {hoverTip && (
            <div
              className="orbit-tooltip"
              role="status"
              style={{
                left: `${hoverTip.x}px`,
                top: `${hoverTip.y}px`,
              }}
            >
              <strong>{hoverTip.name}</strong>
              <span>{hoverTip.role}</span>
            </div>
          )}

          {selected && (
            <aside
              className="margin-note"
              aria-live="polite"
              style={{ "--note-rgb": selected.cluster.accentRgb } as React.CSSProperties}
            >
              <div className="margin-note-top">
                <div className="margin-note-id">
                  <img src={selected.tool.logo} alt={selected.tool.name} width={28} height={28} />
                  <div>
                    <h2>{selected.tool.name}</h2>
                    <p>{selected.tool.role}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="margin-note-close"
                  aria-label="Fermer la note"
                  onClick={() => setSelected(null)}
                >
                  Fermer
                </button>
              </div>
              <p className="margin-note-desc">{selected.tool.detail}</p>
              <div className="margin-note-links">
                {selected.tool.projects.map((p) => (
                  <a
                    key={p.label}
                    href={p.href}
                    {...(p.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {p.label}
                  </a>
                ))}
              </div>
            </aside>
          )}

          <div className="stage-bottom-bar" role="toolbar" aria-label="Filtrer par domaine">
            <div className="stage-domain-links">
              <button
                type="button"
                className={`domain-link ${filter === "all" ? "is-active" : ""}`}
                onClick={() => setFilter("all")}
              >
                Tout voir
              </button>
              {SKILLS_CLUSTERS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`domain-link ${filter === c.id ? "is-active" : ""}`}
                  style={{ "--domain-accent": c.accent } as React.CSSProperties}
                  onClick={() => setFilter(c.id)}
                >
                  {SHORT_DOMAIN_LABELS[c.id]}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="view-switch-link"
              onClick={() => setViewMode("grid")}
            >
              Index complet ({totalToolCount})
            </button>
          </div>
        </section>
      ) : (
        <section className="skills-ledger-view" aria-label="Index complet des outils">
          <div className="ledger-top">
            <div>
              <h1>Index des {totalToolCount} outils</h1>
              <p>Parcours linéaire de l’ensemble de l’outillage, classé par domaine de production.</p>
            </div>
            <div className="ledger-actions">
              <div className="stage-domain-links">
                <button
                  type="button"
                  className={`domain-link ${filter === "all" ? "is-active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  Tout voir
                </button>
                {SKILLS_CLUSTERS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`domain-link ${filter === c.id ? "is-active" : ""}`}
                    style={{ "--domain-accent": c.accent } as React.CSSProperties}
                    onClick={() => setFilter(c.id)}
                  >
                    {SHORT_DOMAIN_LABELS[c.id]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="view-switch-link"
                onClick={() => setViewMode("galaxy")}
              >
                Revenir en vue 3D
              </button>
            </div>
          </div>

          <div className="ledger-groups">
            {displayedClusters.map((cluster) => (
              <section key={cluster.id} className="ledger-group">
                <div className="ledger-group-title">
                  <img src={cluster.hubLogo} alt={cluster.label} width={24} height={24} />
                  <h2>{cluster.label}</h2>
                  <span>{cluster.subtitle}</span>
                </div>
                <ul className="ledger-rows">
                  {cluster.tools.map((tool) => (
                    <li key={tool.id} className="ledger-row">
                      <button
                        type="button"
                        className="ledger-row-btn"
                        onClick={() => handleSelectTool(cluster, tool)}
                      >
                        <span className="ledger-tool-id">
                          <img src={tool.logo} alt={tool.name} width={24} height={24} />
                          <strong>{tool.name}</strong>
                        </span>
                        <span className="ledger-tool-role">{tool.role}</span>
                        <span className="ledger-tool-detail">{tool.detail}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      )}

      <section className="skills-notes-ledger" aria-label="Terrain et langues">
        <div className="notes-ledger-inner">
          <h2 className="notes-ledger-heading">Sur le terrain</h2>
          <dl className="notes-ledger-list">
            {SOFT_HIGHLIGHTS.map((item) => (
              <div key={item.title} className="notes-ledger-row">
                <dt>{item.title}</dt>
                <dd>{item.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}

function clampNum(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}
