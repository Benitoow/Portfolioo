/* Galerie des projets du portfolio. */
(() => {
  function initProjectCoverflow() {
    const root = document.getElementById("projectCoverflow");
    if (!root) return;

    const projects = [
      { title: "Kaobucha, identité de marque", description: "Marque fictive de boisson énergisante naturelle : nom, logo, packaging et campagne pensée pour trois marchés. SAE 1.02.", type: "Scolaire", tags: "Branding · Design · Marketing", image: "images/thumbs/mockup-mango.webp", href: "./projets/kaobucha" },
      { title: "Mojo Tunes, refonte d'identité", description: "Nouvelle identité visuelle pour une enseigne de musique locale à Troyes, de la recherche à la charte. SAE 1.03.", type: "Scolaire", tags: "Branding · Charte Graphique", image: "images/thumbs/moodboard.webp", href: "./projets/mojo-tunes" },
      { title: "Star Wars, site interactif en PHP", description: "Site en PHP relié à une base JSON, développé de bout en bout pour la SAE 1.05.", type: "Scolaire", tags: "PHP · JSON · Web Dev", image: "images/thumbs/banner_light.webp", href: "./projets/star-wars" },
      { title: "Fiction sonore, podcast horreur et humour", description: "Écriture, enregistrement en studio et sound design d'un épisode. À écouter au casque.", type: "Scolaire", tags: "Audio · Scénario · Studio", image: "images/thumbs/Affiche_Podcast.webp", href: "./projets/podcast" },
      { title: "Aux P'tits Soins Coiffure", description: "Site d'un salon de coiffure, en ligne et maintenu depuis 2024, avec sa section prothèses capillaires médicales.", type: "Personnel", tags: "HTML · CSS · JavaScript", image: "images/thumbs/sitecoiff.webp", href: "./projets/sitecoiffure" },
      { title: "Gestion de communautés en ligne", description: "Modération du serveur Discord officiel d'OpenAI, environ 480 000 membres, et animation d'une communauté de jeu ARK d'environ 200 joueurs. Visuels et photos de profil à la demande.", type: "Personnel", tags: "Discord · Modération · Community", image: "images/thumbs/discord.webp" },
      { title: "TikTok @benitoow, 37k abonnés", description: "Compte d'édits vidéo montés sur CapCut. Arrêté par choix.", type: "Personnel", tags: "CapCut · TikTok", image: "images/thumbs/tiktok-benitoow.webp", href: "https://www.tiktok.com/@ww2__tank", external: true },
      { title: "Astral Covenant", description: "Édits Star Wars montés sur Premiere Pro et After Effects. Le compte continue de grandir.", type: "Personnel", tags: "Premiere Pro · After Effects", image: "images/thumbs/astral-covenant.webp", href: "https://www.tiktok.com/@astralcovenant", external: true },
    ];

    const stage = document.getElementById("coverflowStage");
    const track = document.getElementById("coverflowTrack");
    const dotsContainer = document.getElementById("coverflowDots");
    const count = document.getElementById("coverflowCount");
    const title = document.getElementById("coverflowTitle");
    const description = document.getElementById("coverflowDescription");
    const type = document.getElementById("coverflowType");
    const tags = document.getElementById("coverflowTags");
    const link = document.getElementById("coverflowLink");
    const noLink = document.getElementById("coverflowNoLink");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Le numéro des cartes sans visuel est décoratif : posé en CSS (`::before`)
    // il reste visible sans entrer dans le texte de la carte, ce qui laisse le
    // nom accessible (le titre) contenir exactement le texte lu à l'écran.
    const cardLabel = (index, verb) => `${verb} ${projects[index].title}`;

    const cards = projects.map((project, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "coverflow-card";
      card.setAttribute("aria-label", cardLabel(index, "Sélectionner"));
      card.tabIndex = -1;

      if (project.image) {
        const image = document.createElement("img");
        image.src = project.image;
        image.alt = project.title;
        image.loading = "lazy";
        image.decoding = "async";
        image.draggable = false;
        // Dimensions connues : la carte ne bouge pas quand la vignette arrive.
        image.width = 440;
        image.height = 330;
        card.append(image);
      } else {
        const placeholder = document.createElement("span");
        placeholder.className = "coverflow-placeholder";
        placeholder.dataset.index = String(index + 1).padStart(2, "0");
        const name = document.createElement("span");
        name.className = "coverflow-placeholder-title";
        name.textContent = project.title;
        placeholder.append(name);
        card.append(placeholder);
      }

      track.append(card);
      return card;
    });

    const dots = projects.map((project, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "coverflow-dot";
      dot.setAttribute("aria-label", `Projet ${index + 1} : ${project.title}`);
      dot.addEventListener("click", () => goTo(index));
      dotsContainer.append(dot);
      return dot;
    });

    let position = 0;
    let target = 0;
    let selected = -1;
    let frame = null;
    let drag = null;
    let ignoreClick = false;
    let cardWidth = 0;
    let wheelTimer = null;
    let wheelStart = 0;

    const wrap = (value) => ((value % projects.length) + projects.length) % projects.length;

    function paint() {
      if (!cardWidth) return;
      const pitch = cardWidth * 0.79;

      cards.forEach((card, index) => {
        let offset = wrap(index - position);
        if (offset > projects.length / 2) offset -= projects.length;
        const distance = Math.abs(offset);
        const ramp = Math.pow(distance, 0.65);
        const tilt = Math.min(37 * ramp, 78) * Math.sign(offset);
        const edge = Math.min(1, Math.max(0, 3.7 - distance));
        const visible = distance < 3.7;

        card.style.transform =
          `translateX(calc(-50% + ${offset * pitch}px)) ` +
          `translateZ(${-cardWidth * 0.28 * ramp}px) rotateY(${-tilt}deg)`;
        card.style.opacity = String(Math.max(0, 1 - distance * 0.13) * edge);
        card.style.zIndex = String(100 - Math.round(distance));
        card.style.visibility = visible ? "visible" : "hidden";
        card.style.pointerEvents = visible ? "auto" : "none";
        card.classList.toggle("is-in-range", visible);
        card.setAttribute("aria-hidden", String(!visible));
      });
    }

    function showSelection(index) {
      if (index === selected) return;
      selected = index;
      const project = projects[index];
      count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(projects.length).padStart(2, "0")}`;
      title.textContent = project.title;
      description.textContent = project.description;
      type.textContent = project.type;
      tags.textContent = project.tags || "—";

      link.hidden = !project.href;
      noLink.hidden = Boolean(project.href);
      if (project.href) {
        link.href = project.href;
        if (project.external) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        } else {
          link.removeAttribute("target");
          link.removeAttribute("rel");
        }
      } else {
        link.removeAttribute("href");
      }

      cards.forEach((card, cardIndex) => {
        if (cardIndex === index) card.setAttribute("aria-current", "true");
        else card.removeAttribute("aria-current");
        card.setAttribute(
          "aria-label",
          cardLabel(
            cardIndex,
            cardIndex === index && project.href ? "Ouvrir" : "Sélectionner",
          ),
        );
      });
      dots.forEach((dot, dotIndex) => {
        dot.setAttribute("aria-current", String(dotIndex === index));
      });
    }

    function stopAnimation() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    }

    function settle(next) {
      target = next;

      if (reducedMotion.matches) {
        stopAnimation();
        position = next;
        paint();
        showSelection(wrap(Math.round(position)));
        return;
      }

      if (frame !== null) return;
      let lastTime = performance.now();
      function step(now) {
        const elapsed = Math.min(50, now - lastTime);
        lastTime = now;
        const remaining = target - position;
        if (Math.abs(remaining) < 0.001) {
          position = target;
          paint();
          showSelection(wrap(Math.round(position)));
          frame = null;
          return;
        }
        position += remaining * (1 - Math.exp(-elapsed / 105));
        paint();
        showSelection(wrap(Math.round(position)));
        frame = requestAnimationFrame(step);
      }
      frame = requestAnimationFrame(step);
    }

    function goTo(index) {
      clearTimeout(wheelTimer);
      wheelTimer = null;
      const next = index + Math.round((target - index) / projects.length) * projects.length;
      settle(next);
    }

    function nudge(direction) {
      clearTimeout(wheelTimer);
      wheelTimer = null;
      settle(Math.round(target) + direction);
    }

    cards.forEach((card, index) => {
      card.addEventListener("click", () => {
        if (ignoreClick) return;
        if (selected === index) {
          if (projects[index].href) link.click();
        } else {
          goTo(index);
        }
      });
    });

    track.addEventListener("click", (event) => {
      if (!ignoreClick) return;
      event.preventDefault();
      event.stopPropagation();
      ignoreClick = false;
    }, true);

    stage.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        nudge(event.key === "ArrowLeft" ? -1 : 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(projects.length - 1);
      }
    });

    stage.addEventListener("wheel", (event) => {
      if (event.ctrlKey) return; // pincement : le navigateur garde le zoom
      // Une molette de souris n'émet que deltaY, un pavé tactile les deux :
      // on retient l'axe dominant, le sens du geste donne celui du défilement
      // (haut/gauche revient, bas/droite avance). Sur les cartes, la galerie
      // prend la molette ; ailleurs la page défile normalement.
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const pixels = delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1);
      if (Math.abs(pixels) < 0.5) return;
      event.preventDefault();
      if (wheelTimer === null) wheelStart = Math.round(target);
      clearTimeout(wheelTimer);
      settle(target + Math.max(-1, Math.min(1, pixels / 120)));
      wheelTimer = setTimeout(() => {
        const offset = target - wheelStart;
        settle(wheelStart + Math.sign(offset) * Math.round(Math.abs(offset)));
        wheelTimer = null;
      }, 160);
    }, { passive: false });

    stage.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      clearTimeout(wheelTimer);
      wheelTimer = null;
      stopAnimation();
      target = position;
      drag = { id: event.pointerId, x: event.clientX, start: position,
        lastX: event.clientX, lastTime: performance.now(), velocity: 0, moved: false };
    });

    stage.addEventListener("pointermove", (event) => {
      if (!drag || drag.id !== event.pointerId || !cardWidth) return;
      const delta = event.clientX - drag.x;
      if (!drag.moved && Math.abs(delta) < 5) return;
      if (!drag.moved) {
        drag.moved = true;
        stage.setPointerCapture(event.pointerId);
      }

      const now = performance.now();
      const pitch = cardWidth * 0.79;
      drag.velocity = -((event.clientX - drag.lastX) / pitch) * 1000 / Math.max(1, now - drag.lastTime);
      drag.lastX = event.clientX;
      drag.lastTime = now;
      position = drag.start - delta / pitch;
      paint();
      showSelection(wrap(Math.round(position)));
    });

    function finishDrag(event) {
      if (!drag || drag.id !== event.pointerId) return;
      const moved = drag.moved;
      const momentum = Math.max(-2, Math.min(2, drag.velocity * 0.14));
      drag = null;
      if (moved) {
        ignoreClick = true;
        setTimeout(() => { ignoreClick = false; }, 0);
        settle(Math.round(position + momentum));
      }
    }

    stage.addEventListener("pointerup", finishDrag);
    stage.addEventListener("pointercancel", finishDrag);
    document.getElementById("coverflowPrev").addEventListener("click", () => nudge(-1));
    document.getElementById("coverflowNext").addEventListener("click", () => nudge(1));

    link.addEventListener("click", () => {
      if (link.target === "_blank") return;
      title.style.viewTransitionName = "vt-projet";
    });

    root.hidden = false;
    showSelection(0);

    function measure() {
      cardWidth = cards[0].offsetWidth;
      paint();
    }
    measure();
    if ("ResizeObserver" in window) {
      new ResizeObserver(measure).observe(stage);
    } else {
      window.addEventListener("resize", measure);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProjectCoverflow);
  } else {
    initProjectCoverflow();
  }
})();
