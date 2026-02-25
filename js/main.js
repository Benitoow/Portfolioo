/* ===== PORTFOLIO — GSAP ANIMATIONS & INTERACTIONS ===== */
/* Editorial style, inspired by chimdibam.co */
/* Author: Benjamin LELEU · 2026 */

const isReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSaveDataEnabled = () => {
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;
  return !!(connection && connection.saveData);
};

// ===== WAIT FOR GSAP =====
document.addEventListener("DOMContentLoaded", () => {
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
});

// ===== MAIN INIT =====
function initApp() {
  initLoader();
  initCursor();
  initNav();
  initMobileMenu();
  initScrollProgress();
  initRevealAnimations();
  initProjectHovers();
  initStatsCounter();
  initTimelineAnimations();
  initSkillAnimations();
  initContactAnimations();
  initSmoothScroll();
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
  initScrollProgress();
  initSmoothScroll();
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
  initScrollProgress();
  initSmoothScroll();
  initMarquee();

  console.log("✦ Portfolio loaded (reduced motion)");
}

function revealStaticContent() {
  document
    .querySelectorAll(
      ".reveal-text, .hero-label, .hero-subtitle, .hero-description, .hero-availability, .hero-scroll",
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
function initLoader() {
  const loader = document.getElementById("loader");
  const loaderTexts = document.querySelectorAll(".loader-text");
  const loaderProgress = document.querySelector(".loader-progress");

  if (!loader) return;

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
    });
  });

  // Close on escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu.classList.contains("active")) {
      setMenuState(false);
    }
  });
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

// ===== HERO ANIMATION =====
function initHeroAnimation() {
  const heroLines = document.querySelectorAll(".hero-line-inner");
  const heroLabel = document.querySelector(".hero-label");
  const heroSubtitle = document.querySelector(".hero-subtitle");
  const heroDesc = document.querySelector(".hero-description");
  const heroAvail = document.querySelector(".hero-availability");
  const heroScroll = document.querySelector(".hero-scroll");

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
    )
    .to(
      heroScroll,
      {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
      },
      "-=0.1",
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
function initTimelineAnimations() {
  const timelineItems = document.querySelectorAll(".timeline-item");

  timelineItems.forEach((item, index) => {
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
      delay: index * 0.1,
      ease: "power3.out",
    });
  });
}

// ===== SKILL ANIMATIONS =====
function initSkillAnimations() {
  const skillCategories = document.querySelectorAll(".skill-category");

  skillCategories.forEach((cat, index) => {
    // Set initial hidden state explicitly
    gsap.set(cat, { opacity: 0, y: 40 });

    gsap.to(cat, {
      scrollTrigger: {
        trigger: cat,
        start: "top 90%",
        once: true,
      },
      opacity: 1,
      y: 0,
      duration: 0.6,
      delay: index * 0.1,
      ease: "power3.out",
    });

    // Stagger chips
    const chips = cat.querySelectorAll(".skill-chip");
    gsap.set(chips, { opacity: 0, scale: 0.8 });

    gsap.to(chips, {
      scrollTrigger: {
        trigger: cat,
        start: "top 85%",
        once: true,
      },
      opacity: 1,
      scale: 1,
      duration: 0.4,
      stagger: 0.05,
      delay: 0.3 + index * 0.1,
      ease: "back.out(1.5)",
    });
  });
}

// ===== CONTACT ANIMATIONS =====
function initContactAnimations() {
  const contactLinks = document.querySelectorAll(".contact-link-item");

  contactLinks.forEach((link, index) => {
    gsap.set(link, { opacity: 0, x: -30 });

    gsap.to(link, {
      scrollTrigger: {
        trigger: link,
        start: "top 95%",
        once: true,
      },
      opacity: 1,
      x: 0,
      duration: 0.5,
      delay: index * 0.08,
      ease: "power3.out",
    });
  });
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
