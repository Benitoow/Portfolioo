/* ===== PORTFOLIO — GSAP ANIMATIONS & INTERACTIONS ===== */
/* Page d'accueil uniquement. Le commun vit dans shared.js, chargé avant. */
/* Editorial style, inspired by chimdibam.co */
/* Author: Benjamin LELEU · 2026 */

// ===== WAIT FOR GSAP =====
function bootPortfolioApp() {
  // Les pages projets chargent shared.js seul : rien à animer ici.
  if (!document.getElementById("hero")) return;

  // Indépendant de GSAP : valable aussi en repli et en mouvement réduit.
  initTitleMorph();

  if (isReducedMotion()) {
    document.body.classList.add("reduced-motion");
    initReducedApp();
    return;
  }

  // Small delay to make sure GSAP is loaded (deferred)
  const checkGSAP = setInterval(() => {
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      clearInterval(checkGSAP);
      gsap.registerPlugin(ScrollTrigger);
      initApp();
    }
  }, 50);

  // Fallback: if GSAP doesn't load in 3s, init without animations
  setTimeout(() => {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      clearInterval(checkGSAP);
      initAppFallback();
    }
  }, 3000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootPortfolioApp);
} else {
  bootPortfolioApp();
}

// ===== MAIN INIT =====
function initApp() {
  initLoader();
  initCursor();
  initNav();
  initMobileMenu();
  initRevealAnimations();
  initProjectHovers();
  initProjectPreview();
  initStatsCounter();
  initTimelineAnimations();
  initSkillAnimations();
  initContactAnimations();
  initScrollDepth();
  initBgCanvas();
  initVideoBackground();
  initMarquee();
  ensureVisibleAfterAnimations();

  console.log("✦ Portfolio loaded with GSAP");
}

// Fallback if GSAP fails to load
function initAppFallback() {
  const loader = document.getElementById("loader");
  if (loader) loader.classList.add("hidden");

  revealStaticContent();

  initNav();
  initMobileMenu();
  initBgCanvas();
  initVideoBackground();
  initMarquee();

  console.log("✦ Portfolio loaded (fallback, no GSAP)");
}

function initReducedApp() {
  const loader = document.getElementById("loader");
  if (loader) loader.classList.add("hidden");

  revealStaticContent();
  initNav();
  initMobileMenu();
  initMarquee();

  console.log("✦ Portfolio loaded (reduced motion)");
}

function revealStaticContent() {
  document
    .querySelectorAll(
      ".reveal-text, .hero-label, .hero-subtitle, .hero-description, .hero-availability",
    )
    .forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });

  document
    .querySelectorAll(
      ".hero-line-inner, .section-label, .project-item, .skill-category, .skill-chip, .timeline-item, .contact-link-item",
    )
    .forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
}

function ensureVisibleAfterAnimations() {
  // Safety net — force visibility if ScrollTrigger didn't fire
  setTimeout(() => {
    document
      .querySelectorAll(
        ".reveal-text, .section-label, .project-item, .skill-category, .skill-chip, .timeline-item, .contact-link-item",
      )
      .forEach((el) => {
        if (parseFloat(getComputedStyle(el).opacity) < 0.1) {
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      });
  }, 4000);
}

// ===== MARQUEE — AUTO-FILL TO FULL WIDTH =====
function initMarquee() {
  const marquee = document.querySelector(".marquee");
  const inner = marquee?.querySelector(".marquee-inner");
  if (!marquee || !inner) return;

  const sourceTrack = inner.querySelector(".marquee-track");
  if (!sourceTrack) return;

  // Preserve original content to avoid infinite growth on resize
  if (!sourceTrack.dataset.baseHtml) {
    sourceTrack.dataset.baseHtml = sourceTrack.innerHTML.trim();
  }

  const ensureSecondTrack = () => {
    let secondTrack = inner.querySelector('.marquee-track[aria-hidden="true"]');
    if (!secondTrack) {
      secondTrack = sourceTrack.cloneNode(true);
      secondTrack.setAttribute("aria-hidden", "true");
      inner.appendChild(secondTrack);
    }
    return secondTrack;
  };

  const fillTrackToWidth = () => {
    sourceTrack.innerHTML = sourceTrack.dataset.baseHtml;

    const marqueeWidth = marquee.clientWidth || window.innerWidth;
    const minWidth = marqueeWidth * 1.2;

    const temp = document.createElement("div");
    temp.innerHTML = sourceTrack.dataset.baseHtml;
    const baseItems = Array.from(temp.children);

    let currentWidth = sourceTrack.scrollWidth;
    let safety = 0;

    while (currentWidth < minWidth && safety < 50) {
      baseItems.forEach((node) =>
        sourceTrack.appendChild(node.cloneNode(true)),
      );
      currentWidth = sourceTrack.scrollWidth;
      safety++;
    }

    const secondTrack = ensureSecondTrack();
    secondTrack.innerHTML = sourceTrack.innerHTML;
  };

  fillTrackToWidth();

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      fillTrackToWidth();
    }, 150);
  });
}

// ===== LOADER =====
// Première visite de la session seulement. Sans ça, revenir d'une page projet
// rejoue 2,5 s de rideau plein écran par-dessus la transition de page — et
// l'animation du hero avec.
const LOADER_KEY = "bl:loader-vu";

function loaderDejaVu() {
  try {
    return sessionStorage.getItem(LOADER_KEY) === "1";
  } catch {
    return false; // sessionStorage indisponible (navigation privée stricte)
  }
}

function marquerLoaderVu() {
  try {
    sessionStorage.setItem(LOADER_KEY, "1");
  } catch {
    /* sans effet : le loader se rejouera, ce n'est pas bloquant */
  }
}

function initLoader() {
  const loader = document.getElementById("loader");
  const loaderTexts = document.querySelectorAll(".loader-text");
  const loaderProgress = document.querySelector(".loader-progress");

  if (!loader) return;

  if (loaderDejaVu()) {
    loader.classList.add("is-skipped");
    initHeroAnimation();
    return;
  }
  marquerLoaderVu();

  const tl = gsap.timeline({
    onComplete: () => {
      loader.classList.add("hidden");
      initHeroAnimation();
    },
  });

  tl.to(loaderTexts, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: 0.15,
    ease: "power3.out",
  })
    .to(
      loaderProgress,
      {
        width: "100%",
        duration: 1.2,
        ease: "power2.inOut",
      },
      "-=0.3",
    )
    .to(
      loaderTexts,
      {
        opacity: 0,
        y: -20,
        duration: 0.4,
        stagger: 0.05,
        ease: "power2.in",
      },
      "+=0.3",
    )
    .to(
      loader,
      {
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut",
      },
      "-=0.2",
    );
}

// ===== CUSTOM CURSOR =====
function initCursor() {
  const cursor = document.getElementById("cursor");
  const follower = document.getElementById("cursorFollower");

  if (
    !cursor ||
    !follower ||
    window.matchMedia("(pointer: coarse)").matches ||
    isReducedMotion()
  )
    return;

  let mouseX = 0,
    mouseY = 0;
  let cursorX = 0,
    cursorY = 0;
  let followerX = 0,
    followerY = 0;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Smooth follow
  function updateCursor() {
    cursorX += (mouseX - cursorX) * 0.2;
    cursorY += (mouseY - cursorY) * 0.2;
    followerX += (mouseX - followerX) * 0.08;
    followerY += (mouseY - followerY) * 0.08;

    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    follower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0)`;

    requestAnimationFrame(updateCursor);
  }
  updateCursor();

  // Hover effects on interactive elements
  const hoverTargets = document.querySelectorAll(
    "a, button, .project-item, .skill-chip, .contact-link-item",
  );
  hoverTargets.forEach((target) => {
    target.addEventListener("mouseenter", () => {
      cursor.classList.add("hovering");
      follower.classList.add("hovering");
    });
    target.addEventListener("mouseleave", () => {
      cursor.classList.remove("hovering");
      follower.classList.remove("hovering");
    });
  });
}

// ===== NAVIGATION =====
function initNav() {
  const nav = document.getElementById("nav");
  if (!nav) return;

  let lastScroll = 0;
  let ticking = false;

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScroll = window.scrollY;

          if (currentScroll > 100) {
            nav.classList.add("scrolled");
          } else {
            nav.classList.remove("scrolled");
          }

          // Hide nav on scroll down, show on scroll up
          if (currentScroll > lastScroll && currentScroll > 300) {
            nav.style.transform = "translateY(-100%)";
          } else {
            nav.style.transform = "translateY(0)";
          }
          nav.style.transition =
            "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.4s, backdrop-filter 0.4s";

          lastScroll = currentScroll;
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true },
  );
}

// ===== MOBILE MENU =====
function initMobileMenu() {
  const menuBtn = document.getElementById("navMenu");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileLinks = document.querySelectorAll(".mobile-link");

  if (!menuBtn || !mobileMenu) return;

  const setMenuState = (isOpen) => {
    menuBtn.classList.toggle("active", isOpen);
    mobileMenu.classList.toggle("active", isOpen);
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    menuBtn.setAttribute(
      "aria-label",
      isOpen ? "Fermer le menu mobile" : "Ouvrir le menu mobile",
    );
    mobileMenu.setAttribute("aria-hidden", String(!isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  };
  setMenuState(false);

  menuBtn.addEventListener("click", () => {
    const isActive = mobileMenu.classList.contains("active");
    const willOpen = !isActive;

    setMenuState(willOpen);

    if (willOpen && typeof gsap !== "undefined" && !isReducedMotion()) {
      gsap.from(mobileLinks, {
        opacity: 0,
        y: 40,
        duration: 0.5,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.2,
      });
    }
  });

  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setMenuState(false);
      menuBtn.focus({ preventScroll: true });
    });
  });

  // Le panneau plein écran reste un vrai espace clavier : le focus ne part pas
  // visiter la page masquée derrière lui, et Escape revient au déclencheur.
  document.addEventListener("keydown", (e) => {
    if (!mobileMenu.classList.contains("active")) return;

    if (e.key === "Escape") {
      setMenuState(false);
      menuBtn.focus({ preventScroll: true });
      return;
    }

    if (e.key !== "Tab") return;

    const focusable = [menuBtn, ...mobileMenu.querySelectorAll("a[href]")];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

// ===== HERO ANIMATION =====
function initHeroAnimation() {
  const heroLines = document.querySelectorAll(".hero-line-inner");
  const heroLabel = document.querySelector(".hero-label");
  const heroSubtitle = document.querySelector(".hero-subtitle");
  const heroDesc = document.querySelector(".hero-description");
  const heroAvail = document.querySelector(".hero-availability");

  if (!heroLines.length) return;

  const tl = gsap.timeline({ delay: 0.2 });

  tl.to(heroLines, {
    y: "0%",
    duration: 1,
    stagger: 0.15,
    ease: "power4.out",
  })
    .to(
      heroLabel,
      {
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
      },
      "-=0.5",
    )
    .to(
      heroSubtitle,
      {
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
      },
      "-=0.3",
    )
    .to(
      heroDesc,
      {
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
      },
      "-=0.2",
    )
    .to(
      heroAvail,
      {
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
      },
      "-=0.2",
    );
}

// ===== REVEAL ANIMATIONS =====
function initRevealAnimations() {
  const revealElements = document.querySelectorAll(".reveal-text");

  revealElements.forEach((el) => {
    gsap.to(el, {
      scrollTrigger: {
        trigger: el,
        start: "top 95%",
        once: true,
      },
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
    });
  });

  // Section labels
  const labels = document.querySelectorAll(".section-label");
  labels.forEach((label) => {
    gsap.set(label, { opacity: 0, x: -30 });

    gsap.to(label, {
      scrollTrigger: {
        trigger: label,
        start: "top 95%",
        once: true,
      },
      opacity: 1,
      x: 0,
      duration: 0.6,
      ease: "power3.out",
    });
  });
}

// ===== PROJECT HOVERS =====
function initProjectHovers() {
  const projects = document.querySelectorAll(".project-item");
  if (!projects.length) return;

  gsap.set(projects, { opacity: 0, y: 30 });

  gsap.to(projects, {
    scrollTrigger: {
      trigger: "#work",
      start: "top 80%",
      once: true,
    },
    opacity: 1,
    y: 0,
    duration: 0.5,
    stagger: 0.04,
    ease: "power3.out",
  });
}

// ===== APERÇU PROJET AU SURVOL =====
function initProjectPreview() {
  const preview = document.getElementById("projectPreview");
  const img = preview?.querySelector("img");
  // Les lignes mises en avant affichent déjà leur visuel : un aperçu flottant
  // par-dessus ferait doublon.
  const items = document.querySelectorAll(
    ".project-item[data-thumb]:not(.project-item--featured)",
  );

  if (
    !preview ||
    !img ||
    !items.length ||
    window.matchMedia("(pointer: coarse)").matches ||
    isReducedMotion()
  )
    return;

  const OFFSET_X = 28;
  const OFFSET_Y = -24;

  let mouseX = 0,
    mouseY = 0,
    x = 0,
    y = 0,
    active = false,
    frame = null;

  // Le rAF ne tourne que pendant un survol, pas en permanence.
  function follow() {
    x += (mouseX - x) * 0.14;
    y += (mouseY - y) * 0.14;
    preview.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    if (active || Math.abs(mouseX - x) > 0.5 || Math.abs(mouseY - y) > 0.5) {
      frame = requestAnimationFrame(follow);
    } else {
      frame = null;
    }
  }

  function onMove(e) {
    // Bridé pour rester dans la fenêtre, quelle que soit la position du curseur.
    const w = preview.offsetWidth;
    const h = preview.offsetHeight;
    mouseX = Math.min(e.clientX + OFFSET_X, window.innerWidth - w - 12);
    mouseY = Math.min(
      Math.max(e.clientY + OFFSET_Y, 12),
      window.innerHeight - h - 12,
    );
  }

  document.addEventListener("mousemove", onMove, { passive: true });

  items.forEach((item) => {
    item.addEventListener("mouseenter", (e) => {
      const src = item.dataset.thumb;
      if (img.getAttribute("src") !== src) img.setAttribute("src", src);

      onMove(e);
      // Premier survol : on place sans interpoler, sinon l'aperçu arrive en glissant
      // depuis le coin de l'écran.
      if (!active && frame === null) {
        x = mouseX;
        y = mouseY;
      }

      active = true;
      preview.classList.add("is-visible");
      if (frame === null) frame = requestAnimationFrame(follow);
    });

    item.addEventListener("mouseleave", () => {
      active = false;
      preview.classList.remove("is-visible");
    });
  });

  // Décharge les vignettes quand la section approche, pour éviter
  // un blanc au premier survol.
  const prefetch = () => {
    items.forEach((item) => {
      const i = new Image();
      i.src = item.dataset.thumb;
    });
  };
  ScrollTrigger.create({
    trigger: "#work",
    start: "top 200%",
    once: true,
    onEnter: () =>
      "requestIdleCallback" in window
        ? requestIdleCallback(prefetch, { timeout: 2000 })
        : setTimeout(prefetch, 300),
  });
}

// ===== MORPHING DU TITRE VERS LA PAGE PROJET =====
// Le nom de transition est posé au clic, sur la seule ligne concernée : le
// nommer sur les 9 d'avance ferait capturer 9 éléments distincts, dont 8 sans
// équivalent sur la page d'arrivée.
function initTitleMorph() {
  if (!("startViewTransition" in document)) return;

  const liens = document.querySelectorAll('.project-item[href^="./projets/"]');

  liens.forEach((lien) => {
    lien.addEventListener("click", () => {
      liens.forEach((l) => {
        const t = l.querySelector(".project-name");
        if (t) t.style.viewTransitionName = "";
      });
      const titre = lien.querySelector(".project-name");
      if (titre) titre.style.viewTransitionName = "vt-projet";
    });
  });
}

// ===== STATS COUNTER =====
function initStatsCounter() {
  const statNumbers = document.querySelectorAll(".stat-number[data-target]");

  statNumbers.forEach((stat) => {
    const target = parseInt(stat.getAttribute("data-target"));

    ScrollTrigger.create({
      trigger: stat,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.to(stat, {
          duration: 2,
          ease: "power2.out",
          onUpdate: function () {
            const progress = this.progress();
            stat.textContent = Math.floor(target * progress);
          },
          onComplete: () => {
            stat.textContent = target;
          },
        });
      },
    });
  });
}

// ===== TIMELINE ANIMATIONS =====
// La frise fait ~1250 px : un déclencheur par élément, pour que chacun
// s'anime au moment où il entre. Pas de `delay` indexé — il ferait attendre
// le 4e élément 300 ms APRÈS son entrée à l'écran, ce qui se lit comme
// de la latence et non comme un décalage.
function initTimelineAnimations() {
  const timelineItems = document.querySelectorAll(".timeline-item");

  timelineItems.forEach((item) => {
    gsap.set(item, { opacity: 0, x: -40 });

    gsap.to(item, {
      scrollTrigger: {
        trigger: item,
        start: "top 90%",
        once: true,
      },
      opacity: 1,
      x: 0,
      duration: 0.7,
      ease: "power3.out",
    });
  });
}

// ===== SKILL ANIMATIONS =====
// La grille tient à l'écran : un seul déclencheur sur le conteneur, et
// c'est `stagger` qui orchestre — les cartes se répondent au lieu de
// s'animer chacune dans son coin.
function initSkillAnimations() {
  const grid = document.querySelector(".skills-grid");
  const cats = document.querySelectorAll(".skill-category");
  const chips = document.querySelectorAll(".skill-chip");
  if (!grid || !cats.length) return;

  gsap.set(cats, { opacity: 0, y: 40 });
  gsap.set(chips, { opacity: 0, scale: 0.8 });

  gsap
    .timeline({
      scrollTrigger: { trigger: grid, start: "top 85%", once: true },
    })
    .to(cats, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: "power3.out",
    })
    .to(
      chips,
      {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        stagger: 0.02,
        ease: "back.out(1.5)",
      },
      "-=0.35",
    );
}

// ===== CONTACT ANIMATIONS =====
// Les 5 lignes tiennent à l'écran : déclencheur unique + stagger.
function initContactAnimations() {
  const list = document.querySelector(".contact-links");
  const links = document.querySelectorAll(".contact-link-item");
  if (!list || !links.length) return;

  gsap.set(links, { opacity: 0, x: -30 });

  gsap.to(links, {
    scrollTrigger: { trigger: list, start: "top 88%", once: true },
    opacity: 1,
    x: 0,
    duration: 0.5,
    stagger: 0.07,
    ease: "power3.out",
  });
}

// ===== PROFONDEUR LIÉE AU SCROLL =====
// Jusqu'ici rien ne réagissait à la position de scroll : tout était
// déclenché une fois puis figé. Les halos dérivent doucement à contre-sens
// du défilement, ce qui donne un plan d'arrière-fond au contenu.
function initScrollDepth() {
  if (isReducedMotion() || isSaveDataEnabled()) return;

  document.querySelectorAll(".section-glow").forEach((glow) => {
    const section = glow.closest(".section");
    if (!section) return;

    gsap.fromTo(
      glow,
      { yPercent: -12 },
      {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      },
    );
  });

  // Le bloc hero se retire légèrement pendant qu'on le quitte.
  const heroInner = document.querySelector(".hero-inner");
  if (heroInner) {
    gsap.to(heroInner, {
      yPercent: 14,
      opacity: 0.35,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.4,
      },
    });
  }
}

// ===== GLOBAL BACKGROUND — ANIMATED MESH GRADIENT =====
function initBgCanvas() {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas || isReducedMotion() || isSaveDataEnabled()) return;

  const ctx = canvas.getContext("2d");
  let width, height;
  let animationId;
  let time = 0;
  let mouseX = 0.5,
    mouseY = 0.5; // normalized 0-1

  // Track mouse for subtle interactivity
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
  });

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener("resize", resize);

  // Blob definitions — forest palette
  const blobs = [
    { x: 0.2, y: 0.3, r: 0.45, color: [74, 93, 68], speed: 0.3, phase: 0 }, // Fern Green
    { x: 0.8, y: 0.2, r: 0.35, color: [62, 47, 40], speed: 0.25, phase: 2 }, // Redwood
    { x: 0.5, y: 0.7, r: 0.4, color: [42, 34, 29], speed: 0.2, phase: 4 }, // Dark bark deep
    { x: 0.15, y: 0.8, r: 0.3, color: [242, 201, 76], speed: 0.35, phase: 1 }, // Kodak Yellow (subtle)
    { x: 0.85, y: 0.6, r: 0.35, color: [50, 60, 45], speed: 0.15, phase: 3 }, // Dark fern
    { x: 0.4, y: 0.15, r: 0.3, color: [94, 118, 86], speed: 0.28, phase: 5 }, // Light fern
  ];

  function draw() {
    time += 0.003;

    // Fill with base dark color
    ctx.fillStyle = "#1E1B18";
    ctx.fillRect(0, 0, width, height);

    // Scroll offset — blobs shift as you scroll
    const scrollY = window.scrollY;
    const scrollFactor =
      scrollY / (document.body.scrollHeight - window.innerHeight || 1);

    // Draw each blob
    blobs.forEach((blob, i) => {
      // Animate position with sine/cosine orbits
      const bx =
        blob.x +
        Math.sin(time * blob.speed + blob.phase) * 0.12 +
        (mouseX - 0.5) * 0.03;
      const by =
        blob.y +
        Math.cos(time * blob.speed * 0.8 + blob.phase) * 0.08 +
        scrollFactor * 0.15 +
        (mouseY - 0.5) * 0.02;

      // Pulse radius
      const br = blob.r + Math.sin(time * 0.5 + i) * 0.05;

      // Create radial gradient for this blob
      const cx = bx * width;
      const cy = by * height;
      const radius = br * Math.max(width, height);

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      const [r, g, b] = blob.color;
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.18)`);
      gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.08)`);
      gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.02)`);
      gradient.addColorStop(1, "transparent");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    });

    // Soft overall vignette
    const vignette = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      width * 0.15,
      width * 0.5,
      height * 0.5,
      width * 0.75,
    );
    vignette.addColorStop(0, "transparent");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.4)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    animationId = requestAnimationFrame(draw);
  }

  // Start immediately
  draw();

  // Pause when tab not visible for performance
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    } else {
      if (!animationId) draw();
    }
  });
}

// ===== VIDEO BACKGROUND — CROSSFADE ON SCROLL =====
function initVideoBackground() {
  const videoBg = document.getElementById("videoBg");
  const videos = document.querySelectorAll(".video-bg__vid");
  if (!videoBg || !videos.length) return;

  if (isReducedMotion() || isSaveDataEnabled()) {
    videoBg.style.display = "none";
    return;
  }

  // Map section IDs to their video elements
  const sectionMap = {};
  videos.forEach((vid, index) => {
    const sectionId = vid.getAttribute("data-section");
    sectionMap[sectionId] = vid;
    if (index > 0) {
      vid.preload = "none";
    }
  });

  // Sections to watch (in DOM order)
  const sectionIds = ["hero", "about", "work", "skills", "journey", "contact"];
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  let currentVideo = null;
  let videosLoaded = false;
  let switchLock = false;

  // Check if at least the first video can load
  const firstVideo = videos[0];

  function hideVideoBackground() {
    videoBg.style.display = "none";
    videos.forEach((video) => video.pause());
  }

  function onVideoReady() {
    if (videosLoaded) return;
    videosLoaded = true;
    // Hide the canvas fallback when video works
    const bgCanvas = document.getElementById("bgCanvas");
    if (bgCanvas) bgCanvas.style.opacity = "0";
  }

  function ensureSourceLoaded(video) {
    const source = video.querySelector("source");
    if (!source) return Promise.resolve();

    const dataSrc = source.getAttribute("data-src");
    if (!source.getAttribute("src") && dataSrc) {
      source.setAttribute("src", dataSrc);
      source.removeAttribute("data-src");
      video.load();
    }

    if (video.readyState >= 2) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const onReady = () => {
        video.removeEventListener("loadeddata", onReady);
        video.removeEventListener("canplay", onReady);
        video.removeEventListener("error", onReady);
        resolve();
      };

      video.addEventListener("loadeddata", onReady, { once: true });
      video.addEventListener("canplay", onReady, { once: true });
      video.addEventListener("error", onReady, { once: true });
    });
  }

  // If video already has data (cached), activate immediately
  ensureSourceLoaded(firstVideo).then(() => {
    if (firstVideo.readyState >= 2) {
      onVideoReady();
    }
    firstVideo.play().catch(() => {});
  });
  firstVideo.addEventListener("loadeddata", onVideoReady, { once: true });
  firstVideo.addEventListener("canplay", onVideoReady, { once: true });

  firstVideo.addEventListener(
    "error",
    () => {
      // Videos not found — keep canvas fallback visible
      hideVideoBackground();
      console.log("✦ Video backgrounds not found, using canvas fallback");
    },
    { once: true },
  );

  async function switchVideo(sectionId) {
    const targetVideo = sectionMap[sectionId];
    if (!targetVideo || targetVideo === currentVideo || switchLock) return;
    switchLock = true;

    await ensureSourceLoaded(targetVideo);

    // Fade out current
    const previousVideo = currentVideo;
    if (currentVideo) {
      currentVideo.classList.remove("active");
      // Pause after transition to save resources
      setTimeout(() => {
        if (previousVideo && !previousVideo.classList.contains("active")) {
          previousVideo.pause();
        }
      }, 1300);
    }

    // Fade in target
    targetVideo.classList.add("active");
    targetVideo.preload = "metadata";
    targetVideo.play().catch(() => {}); // Silently handle autoplay issues
    currentVideo = targetVideo;
    switchLock = false;
  }

  function prefetchSectionVideo(sectionId) {
    const video = sectionMap[sectionId];
    if (!video) return;
    ensureSourceLoaded(video).catch(() => {});
  }

  // Set initial video
  currentVideo = firstVideo;

  // Use IntersectionObserver to detect which section is in view
  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visibleEntries.length) return;

      const topEntry = visibleEntries[0];
      if (topEntry.intersectionRatio > 0.3) {
        const currentIndex = sectionIds.indexOf(topEntry.target.id);
        const nextId = sectionIds[currentIndex + 1];
        switchVideo(topEntry.target.id);
        if (nextId) prefetchSectionVideo(nextId);
      }
    },
    {
      threshold: [0.3, 0.5],
      rootMargin: "-10% 0px -10% 0px",
    },
  );

  sections.forEach((section) => observer.observe(section));

  document.addEventListener("visibilitychange", () => {
    if (!currentVideo) return;
    if (document.hidden) {
      currentVideo.pause();
    } else if (currentVideo.classList.contains("active")) {
      currentVideo.play().catch(() => {});
    }
  });
}
