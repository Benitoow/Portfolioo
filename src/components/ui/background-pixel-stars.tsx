"use client";

import { memo, useCallback, useEffect, useRef } from "react";

// Palette spatiale sobre (blanc étoilé, bleu glacier, lavande, champagne discret)
const STAR_COLORS = [
  "#F4F7FF",
  "#C7D7FF",
  "#C4B5FD",
  "#96B2FF",
  "#EAE2CA",
] as const;

export interface BackgroundPixelStarsProps {
  className?: string;
  pixelSize?: number;
  density?: number;
}

type BackgroundStar = {
  x: number;
  y: number;
  size: number;
  color: string;
  baseOpacity: number;
  twinkle: boolean;
  twinkleSpeed: number;
  twinklePhase: number;
};

type TrailPoint = {
  x: number;
  y: number;
  opacity: number;
};

type ShootingStar = {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  distance: number;
  trail: TrailPoint[];
};

const TWINKLE_PROB = 0.65;
const MIN_TWINKLE_SPEED = 0.9;
const MAX_TWINKLE_SPEED = 2.4;
const SHOOTING_PIXEL_SIZE = 2;

export const BackgroundPixelStars = memo(
  ({ className = "", pixelSize = 2, density = 0.00013 }: BackgroundPixelStarsProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const shootTimerRef = useRef<number | null>(null);

    const starsRef = useRef<BackgroundStar[]>([]);
    const shootingRef = useRef<ShootingStar[]>([]);

    const createStar = useCallback(
      (w: number, h: number): BackgroundStar => {
        const size = Math.random() < 0.2 ? pixelSize + 1 : pixelSize;
        const gridX = Math.floor(Math.random() * Math.max(1, w / pixelSize)) * pixelSize;
        const gridY = Math.floor(Math.random() * Math.max(1, h / pixelSize)) * pixelSize;
        const color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]!;
        const baseOpacity = 0.25 + Math.random() * 0.55;

        return {
          x: gridX,
          y: gridY,
          size,
          color,
          baseOpacity,
          twinkle: Math.random() < TWINKLE_PROB,
          twinkleSpeed:
            MIN_TWINKLE_SPEED + Math.random() * (MAX_TWINKLE_SPEED - MIN_TWINKLE_SPEED),
          twinklePhase: Math.random() * Math.PI * 2,
        };
      },
      [pixelSize]
    );

    const initBackgroundStars = useCallback((): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const area = canvas.width * canvas.height;
      const count = Math.min(340, Math.floor(area * density));
      starsRef.current = Array.from({ length: count }, () =>
        createStar(canvas.width, canvas.height)
      );
    }, [createStar, density]);

    const createNewShootingStar = useCallback((): ShootingStar => {
      const w = window.innerWidth;
      return {
        id: Date.now() + Math.random(),
        x: Math.random() * w,
        y: 0,
        angle: 38 + Math.random() * 104,
        speed: 380 + Math.random() * 220, // pixels par seconde
        distance: 0,
        trail: [],
      };
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      let destroyed = false;
      let lastTime = performance.now();

      const drawStaticOnce = () => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        starsRef.current.forEach((star) => {
          ctx.fillStyle = star.color;
          ctx.globalAlpha = star.baseOpacity;
          ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        ctx.globalAlpha = 1;
      };

      const syncCanvasSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initBackgroundStars();
        if (reducedMotion.matches) drawStaticOnce();
      };

      syncCanvasSize();

      const animateCanvas = (now: number): void => {
        if (destroyed) return;
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
        lastTime = now;

        if (document.visibilityState === "hidden" || reducedMotion.matches) {
          rafRef.current = requestAnimationFrame(animateCanvas);
          return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          rafRef.current = requestAnimationFrame(animateCanvas);
          return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        starsRef.current.forEach((star) => {
          let alpha = star.baseOpacity;
          if (star.twinkle) {
            star.twinklePhase += dt * star.twinkleSpeed;
            const wave = 0.5 + 0.5 * Math.sin(star.twinklePhase);
            alpha = star.baseOpacity * (0.32 + 0.68 * wave);
          }
          ctx.fillStyle = star.color;
          ctx.globalAlpha = alpha;
          ctx.fillRect(star.x, star.y, star.size, star.size);
        });

        if (shootingRef.current.length > 0) {
          shootingRef.current = shootingRef.current
            .map((star) => {
              const rad = (star.angle * Math.PI) / 180;
              const step = star.speed * dt;
              const newX = star.x + step * Math.cos(rad);
              const newY = star.y + step * Math.sin(rad);
              const newDistance = star.distance + step;

              const newTrail = [...star.trail];
              if (Math.floor(newDistance / 6) > Math.floor(star.distance / 6)) {
                newTrail.push({ x: star.x, y: star.y, opacity: 0.85 });
              }

              const updatedTrail = newTrail
                .map((p) => ({ ...p, opacity: p.opacity - dt * 2.4 }))
                .filter((p) => p.opacity > 0);

              return { ...star, x: newX, y: newY, distance: newDistance, trail: updatedTrail };
            })
            .filter(
              (star) =>
                star.x >= -40 &&
                star.x <= window.innerWidth + 40 &&
                star.y >= -40 &&
                star.y <= window.innerHeight + 40
            );

          shootingRef.current.forEach((star) => {
            const rad = (star.angle * Math.PI) / 180;
            star.trail.forEach((point) => {
              ctx.save();
              ctx.translate(point.x, point.y);
              ctx.rotate(rad);
              ctx.translate(-point.x, -point.y);
              ctx.fillStyle = `rgba(186, 212, 255, ${point.opacity * 0.75})`;
              ctx.fillRect(point.x, point.y, SHOOTING_PIXEL_SIZE, SHOOTING_PIXEL_SIZE);
              ctx.restore();
            });

            ctx.save();
            ctx.translate(star.x, star.y);
            ctx.rotate(rad);
            ctx.translate(-star.x, -star.y);
            ctx.fillStyle = "#F4F7FF";
            ctx.globalAlpha = 0.95;

            for (let y = 0; y < 2; y++) {
              for (let x = 0; x < 4; x++) {
                if ((x === 0 && y === 1) || (x === 3 && y === 0)) continue;
                ctx.fillRect(
                  star.x + x * SHOOTING_PIXEL_SIZE,
                  star.y + y * SHOOTING_PIXEL_SIZE,
                  SHOOTING_PIXEL_SIZE,
                  SHOOTING_PIXEL_SIZE
                );
              }
            }
            ctx.restore();
          });
        }

        ctx.globalAlpha = 1;
        rafRef.current = requestAnimationFrame(animateCanvas);
      };

      rafRef.current = requestAnimationFrame(animateCanvas);

      const scheduleShootingStar = () => {
        if (destroyed) return;
        const delay = 4000 + Math.random() * 5500;
        shootTimerRef.current = window.setTimeout(() => {
          if (destroyed) return;
          if (!reducedMotion.matches && document.visibilityState !== "hidden") {
            shootingRef.current = [...shootingRef.current, createNewShootingStar()];
          }
          scheduleShootingStar();
        }, delay);
      };
      scheduleShootingStar();

      window.addEventListener("resize", syncCanvasSize);

      return () => {
        destroyed = true;
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        if (shootTimerRef.current !== null) clearTimeout(shootTimerRef.current);
        window.removeEventListener("resize", syncCanvasSize);
      };
    }, [createNewShootingStar, initBackgroundStars]);

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-0 ${className}`.trim()}
        style={{ imageRendering: "pixelated" }}
      />
    );
  },
  () => true
);

export default BackgroundPixelStars;
