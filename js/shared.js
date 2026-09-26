/* ===== PORTFOLIO — COMPORTEMENTS PARTAGÉS ===== */
/* Chargé par index.html ET les pages projets. */
/* Author: Benjamin LELEU · 2026 */

const isReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isSaveDataEnabled = () => {
  const connection =
    navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return !!(connection && connection.saveData);
};

// Année du footer — évite de la coder en dur
function initFooterYear() {
  const el = document.getElementById("footer-year");
  if (el) el.textContent = new Date().getFullYear();
}

// ===== SCROLL PROGRESS =====
function initScrollProgress() {
  const progressBar = document.getElementById("scrollProgress");
  if (!progressBar) return;

  // Hauteur de document mise en cache : la relire à chaque événement de
  // défilement force un calcul de mise en page synchrone.
  let maxScroll = 0;
  const measure = () => {
    maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );
  };
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);

  window.addEventListener(
    "scroll",
    () => {
      const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
      progressBar.style.width = progress + "%";
    },
    { passive: true },
  );
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navHeight =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--nav-height",
          ),
        ) || 80;
      const targetPosition =
        target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: isReducedMotion() ? "auto" : "smooth",
      });
    });
  });
}

// Les polices web peuvent modifier la hauteur des sections après que le
// navigateur a appliqué une ancre initiale. On recale une fois le layout final
// connu, sinon les liens partagés comme `/#journey` atterrissent trop tôt.
function initInitialHashScroll() {
  if (!window.location.hash || window.location.hash === "#") return;

  const targetId = decodeURIComponent(window.location.hash.slice(1));
  const target = document.getElementById(targetId);
  if (!target) return;

  const pageLoaded =
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise((resolve) =>
          window.addEventListener("load", resolve, { once: true }),
        );
  const fontsLoaded = document.fonts?.ready || Promise.resolve();

  Promise.all([pageLoaded, fontsLoaded]).then(() => {
    requestAnimationFrame(() => {
      const navHeight =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--nav-height",
          ),
        ) || 80;
      const targetPosition =
        target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({ top: targetPosition, behavior: "auto" });
    });
  });
}

function initSmoothCursor() {
  const cursor = document.createElement("div");
  cursor.className = "smooth-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = '<svg viewBox="0 0 50 54" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42.6817 41.1495 27.5103 6.79925c-.7834-1.77368-3.3021-1.77367-4.1176 0L7.59814 41.1495c-.83981 1.8264.92898 3.7407 2.81436 3.0459L24.3757 39.0496a2.4 2.4 0 0 1 1.5665 0l13.8699 5.1458c1.8728.6949 3.6763-1.2195 2.8696-3.0459Z" fill="#111" stroke="#fff" stroke-width="2.3" /></svg>';
  document.body.append(cursor);

  let x = 0, y = 0, targetX = 0, targetY = 0;
  let rotation = 0, targetRotation = 0, scale = 1;
  let filteredVX = 0, filteredVY = 0;
  let lastX = 0, lastY = 0, lastMoveTime = 0, lastFrame = 0;
  let movingUntil = 0, initialized = false, frame = null;

  function animate(now) {
    const dt = Math.min(50, Math.max(1, lastFrame ? now - lastFrame : 16));
    lastFrame = now;
    const follow = 1 - Math.exp(-dt / 82);
    const turn = 1 - Math.exp(-dt / 145);
    const resize = 1 - Math.exp(-dt / 105);

    x += (targetX - x) * follow;
    y += (targetY - y) * follow;
    rotation += (targetRotation - rotation) * turn;
    const targetScale = now < movingUntil ? 0.98 : 1;
    scale += (targetScale - scale) * resize;
    cursor.style.transform = `translate3d(${x - 12.5}px, ${y - 13.5}px, 0) rotate(${rotation}deg) scale(${scale})`;

    if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.15 ||
        Math.abs(targetRotation - rotation) > 0.1 ||
        Math.abs(targetScale - scale) > 0.003 || now < movingUntil) {
      frame = requestAnimationFrame(animate);
    } else {
      frame = null;
      lastFrame = 0;
    }
  }

  window.addEventListener("mousemove", (event) => {
    if (window.matchMedia("(pointer: coarse)").matches || isReducedMotion()) {
      cursor.style.opacity = "0";
      document.body.classList.remove("has-custom-cursor");
      initialized = false;
      return;
    }

    const now = performance.now();
    targetX = event.clientX;
    targetY = event.clientY;
    if (!initialized) {
      x = targetX;
      y = targetY;
      lastMoveTime = now;
      filteredVX = 0;
      filteredVY = 0;
      initialized = true;
      cursor.style.opacity = "1";
      cursor.style.transform = `translate3d(${x - 12.5}px, ${y - 13.5}px, 0) rotate(${rotation}deg)`;
      document.body.classList.add("has-custom-cursor");
    } else {
      const dx = targetX - lastX;
      const dy = targetY - lastY;
      const elapsed = Math.max(1, now - lastMoveTime);
      if (Math.hypot(dx, dy) > 1.25) {
        const blend = 1 - Math.exp(-elapsed / 60);
        filteredVX += (dx / elapsed - filteredVX) * blend;
        filteredVY += (dy / elapsed - filteredVY) * blend;
        const nextAngle = Math.atan2(filteredVY, filteredVX) * 180 / Math.PI + 90;
        const difference = ((nextAngle - targetRotation + 540) % 360 + 360) % 360 - 180;
        targetRotation += difference;
        movingUntil = now + 135;
      }
    }
    lastX = targetX;
    lastY = targetY;
    lastMoveTime = now;
    if (frame === null) frame = requestAnimationFrame(animate);
  }, { passive: true });

  document.addEventListener("mouseleave", () => {
    cursor.style.opacity = "0";
    document.body.classList.remove("has-custom-cursor");
    initialized = false;
  });
}

/* ===== ŒUF DE PÂQUES — LES BALLONS DU LOGO =====
   Le clic sur le B. lâche les ballons de 21st.dev : c'est la bibliothèque
   balloons-js (MIT) qui les dessine, avec sa perspective et ses ballons qui
   montent depuis le bas. Elle pèse 43 Ko, donc elle n'est chargée qu'au
   premier clic, et servie depuis ce domaine (js/vendor/) : aucune requête
   tierce, et un échec de chargement reste sans conséquence. */
const BALLOONS_SCRIPT = "/js/vendor/balloons-js.min.js";

let balloonsLib = null;
let balloonsLoading = null;
let balloonsLastLaunch = 0;

function loadBalloons() {
  if (balloonsLib) return Promise.resolve(balloonsLib);
  if (!balloonsLoading) {
    balloonsLoading = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = BALLOONS_SCRIPT;
      script.onload = () => {
        balloonsLib = window.balloonsJS || null;
        resolve(balloonsLib);
      };
      script.onerror = () => {
        balloonsLoading = null;
        resolve(null);
      };
      document.head.append(script);
    });
  }
  return balloonsLoading;
}

function launchBalloons() {
  if (isReducedMotion() || isSaveDataEnabled()) return;
  const now = performance.now();
  // Deux clics rapprochés ne lancent qu'une grappe.
  if (now - balloonsLastLaunch < 500) return;
  balloonsLastLaunch = now;
  loadBalloons().then((lib) => lib && lib.balloons());
}

function initLogoBalloons() {
  document.querySelectorAll(".nav-logo, .case-logo").forEach((logo) => {
    logo.addEventListener("click", (event) => {
      // Clic souris simple : les ballons remplacent le saut d'ancre (l'accueil
      // et les fiches ont d'autres liens pour la navigation). Le clavier
      // (`detail === 0`), le clic milieu et les combinaisons gardent le
      // comportement du lien.
      if (event.detail === 0 || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      launchBalloons();
    });
  });
}

function bootShared() {
  initFooterYear();
  initScrollProgress();
  initSmoothScroll();
  initInitialHashScroll();
  initSmoothCursor();
  initLogoBalloons();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootShared);
} else {
  bootShared();
}
