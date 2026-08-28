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

  window.addEventListener(
    "scroll",
    () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
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

function bootShared() {
  initFooterYear();
  initScrollProgress();
  initSmoothScroll();
  initInitialHashScroll();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootShared);
} else {
  bootShared();
}
