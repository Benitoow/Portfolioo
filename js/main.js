/* ===== PORTFOLIO — GSAP ANIMATIONS & INTERACTIONS ===== */
/* Editorial style, inspired by chimdibam.co */
/* Author: Benjamin LELEU · 2026 */

// ===== WAIT FOR GSAP ===== 
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to make sure GSAP is loaded (deferred)
    const checkGSAP = setInterval(() => {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            clearInterval(checkGSAP);
            gsap.registerPlugin(ScrollTrigger);
            initApp();
        }
    }, 50);

    // Fallback: if GSAP doesn't load in 3s, init without animations
    setTimeout(() => {
        if (typeof gsap === 'undefined') {
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
    initHeroAnimation();
    initRevealAnimations();
    initProjectHovers();
    initProjectThumbnails();
    initStatsCounter();
    initTimelineAnimations();
    initSkillAnimations();
    initContactAnimations();
    initSmoothScroll();
    initBgCanvas();
    initVideoBackground();

    // Safety net — force visibility if ScrollTrigger didn't fire
    setTimeout(() => {
        document.querySelectorAll('.reveal-text, .section-label, .project-item, .skill-category, .skill-chip, .timeline-item, .contact-link-item').forEach(el => {
            if (parseFloat(getComputedStyle(el).opacity) < 0.1) {
                el.style.opacity = '1';
                el.style.transform = 'none';
            }
        });
    }, 4000);

    console.log('✦ Portfolio loaded with GSAP');
}

// Fallback if GSAP fails to load
function initAppFallback() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');

    // Show everything
    document.querySelectorAll('.reveal-text, .hero-label, .hero-subtitle, .hero-description, .hero-availability, .hero-scroll').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
    });
    document.querySelectorAll('.hero-line-inner').forEach(el => {
        el.style.transform = 'none';
    });

    initNav();
    initMobileMenu();
    initScrollProgress();
    initSmoothScroll();
    initProjectThumbnails();
    initBgCanvas();
    initVideoBackground();

    console.log('✦ Portfolio loaded (fallback, no GSAP)');
}

// ===== LOADER =====
function initLoader() {
    const loader = document.getElementById('loader');
    const loaderTexts = document.querySelectorAll('.loader-text');
    const loaderProgress = document.querySelector('.loader-progress');

    if (!loader) return;

    const tl = gsap.timeline({
        onComplete: () => {
            loader.classList.add('hidden');
            initHeroAnimation();
        }
    });

    tl.to(loaderTexts, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out'
    })
    .to(loaderProgress, {
        width: '100%',
        duration: 1.2,
        ease: 'power2.inOut'
    }, '-=0.3')
    .to(loaderTexts, {
        opacity: 0,
        y: -20,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.in'
    }, '+=0.3')
    .to(loader, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.inOut'
    }, '-=0.2');
}

// ===== CUSTOM CURSOR =====
function initCursor() {
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursorFollower');

    if (!cursor || !follower || window.matchMedia('(pointer: coarse)').matches) return;

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Smooth follow
    function updateCursor() {
        cursorX += (mouseX - cursorX) * 0.2;
        cursorY += (mouseY - cursorY) * 0.2;
        followerX += (mouseX - followerX) * 0.08;
        followerY += (mouseY - followerY) * 0.08;

        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        follower.style.left = followerX + 'px';
        follower.style.top = followerY + 'px';

        requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Hover effects on interactive elements
    const hoverTargets = document.querySelectorAll('a, button, .project-item, .skill-chip, .contact-link-item');
    hoverTargets.forEach(target => {
        target.addEventListener('mouseenter', () => {
            cursor.classList.add('hovering');
            follower.classList.add('hovering');
        });
        target.addEventListener('mouseleave', () => {
            cursor.classList.remove('hovering');
            follower.classList.remove('hovering');
        });
    });
}

// ===== NAVIGATION =====
function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    let lastScroll = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const currentScroll = window.scrollY;

                if (currentScroll > 100) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }

                // Hide nav on scroll down, show on scroll up
                if (currentScroll > lastScroll && currentScroll > 300) {
                    nav.style.transform = 'translateY(-100%)';
                } else {
                    nav.style.transform = 'translateY(0)';
                }
                nav.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.4s, backdrop-filter 0.4s';

                lastScroll = currentScroll;
                ticking = false;
            });
            ticking = true;
        }
    });
}

// ===== MOBILE MENU =====
function initMobileMenu() {
    const menuBtn = document.getElementById('navMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (!menuBtn || !mobileMenu) return;

    menuBtn.addEventListener('click', () => {
        const isActive = mobileMenu.classList.contains('active');

        menuBtn.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = isActive ? '' : 'hidden';

        if (!isActive && typeof gsap !== 'undefined') {
            gsap.from(mobileLinks, {
                opacity: 0,
                y: 40,
                duration: 0.5,
                stagger: 0.08,
                ease: 'power3.out',
                delay: 0.2
            });
        }
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            menuBtn.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// ===== SCROLL PROGRESS =====
function initScrollProgress() {
    const progressBar = document.getElementById('scrollProgress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;
        progressBar.style.width = progress + '%';
    });
}

// ===== HERO ANIMATION =====
function initHeroAnimation() {
    const heroLines = document.querySelectorAll('.hero-line-inner');
    const heroLabel = document.querySelector('.hero-label');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroDesc = document.querySelector('.hero-description');
    const heroAvail = document.querySelector('.hero-availability');
    const heroScroll = document.querySelector('.hero-scroll');

    if (!heroLines.length) return;

    const tl = gsap.timeline({ delay: 0.2 });

    tl.to(heroLines, {
        y: '0%',
        duration: 1,
        stagger: 0.15,
        ease: 'power4.out'
    })
    .to(heroLabel, {
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
    }, '-=0.5')
    .to(heroSubtitle, {
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
    }, '-=0.3')
    .to(heroDesc, {
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
    }, '-=0.2')
    .to(heroAvail, {
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
    }, '-=0.2')
    .to(heroScroll, {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out'
    }, '-=0.1');
}

// ===== REVEAL ANIMATIONS =====
function initRevealAnimations() {
    const revealElements = document.querySelectorAll('.reveal-text');

    revealElements.forEach(el => {
        gsap.to(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 95%',
                once: true
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
        });
    });

    // Section labels
    const labels = document.querySelectorAll('.section-label');
    labels.forEach(label => {
        gsap.set(label, { opacity: 0, x: -30 });

        gsap.to(label, {
            scrollTrigger: {
                trigger: label,
                start: 'top 95%',
                once: true
            },
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: 'power3.out'
        });
    });
}

// ===== PROJECT HOVERS =====
function initProjectHovers() {
    const projects = document.querySelectorAll('.project-item');

    projects.forEach((project, index) => {
        // Entrance animation
        gsap.set(project, { opacity: 0, y: 30 });

        gsap.to(project, {
            scrollTrigger: {
                trigger: project,
                start: 'top 95%',
                once: true
            },
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: index * 0.05,
            ease: 'power3.out'
        });
    });
}

// ===== STATS COUNTER =====
function initStatsCounter() {
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');

    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));

        ScrollTrigger.create({
            trigger: stat,
            start: 'top 85%',
            once: true,
            onEnter: () => {
                gsap.to(stat, {
                    duration: 2,
                    ease: 'power2.out',
                    onUpdate: function() {
                        const progress = this.progress();
                        stat.textContent = Math.floor(target * progress);
                    },
                    onComplete: () => {
                        stat.textContent = target;
                    }
                });
            }
        });
    });
}

// ===== TIMELINE ANIMATIONS =====
function initTimelineAnimations() {
    const timelineItems = document.querySelectorAll('.timeline-item');

    timelineItems.forEach((item, index) => {
        gsap.set(item, { opacity: 0, x: -40 });

        gsap.to(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 90%',
                once: true
            },
            opacity: 1,
            x: 0,
            duration: 0.7,
            delay: index * 0.1,
            ease: 'power3.out'
        });
    });
}

// ===== SKILL ANIMATIONS =====
function initSkillAnimations() {
    const skillCategories = document.querySelectorAll('.skill-category');

    skillCategories.forEach((cat, index) => {
        // Set initial hidden state explicitly
        gsap.set(cat, { opacity: 0, y: 40 });

        gsap.to(cat, {
            scrollTrigger: {
                trigger: cat,
                start: 'top 90%',
                once: true
            },
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: index * 0.1,
            ease: 'power3.out'
        });

        // Stagger chips
        const chips = cat.querySelectorAll('.skill-chip');
        gsap.set(chips, { opacity: 0, scale: 0.8 });

        gsap.to(chips, {
            scrollTrigger: {
                trigger: cat,
                start: 'top 85%',
                once: true
            },
            opacity: 1,
            scale: 1,
            duration: 0.4,
            stagger: 0.05,
            delay: 0.3 + index * 0.1,
            ease: 'back.out(1.5)'
        });
    });
}

// ===== CONTACT ANIMATIONS =====
function initContactAnimations() {
    const contactLinks = document.querySelectorAll('.contact-link-item');

    contactLinks.forEach((link, index) => {
        gsap.set(link, { opacity: 0, x: -30 });

        gsap.to(link, {
            scrollTrigger: {
                trigger: link,
                start: 'top 95%',
                once: true
            },
            opacity: 1,
            x: 0,
            duration: 0.5,
            delay: index * 0.08,
            ease: 'power3.out'
        });
    });
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();

            const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 80;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
}

// ===== GLOBAL BACKGROUND — ANIMATED MESH GRADIENT =====
function initBgCanvas() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let animationId;
    let time = 0;
    let mouseX = 0.5, mouseY = 0.5; // normalized 0-1

    // Track mouse for subtle interactivity
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX / window.innerWidth;
        mouseY = e.clientY / window.innerHeight;
    });

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    // Blob definitions — forest palette
    const blobs = [
        { x: 0.2,  y: 0.3,  r: 0.45, color: [74, 93, 68],     speed: 0.3,  phase: 0     },  // Fern Green
        { x: 0.8,  y: 0.2,  r: 0.35, color: [62, 47, 40],     speed: 0.25, phase: 2     },  // Redwood
        { x: 0.5,  y: 0.7,  r: 0.4,  color: [42, 34, 29],     speed: 0.2,  phase: 4     },  // Dark bark deep
        { x: 0.15, y: 0.8,  r: 0.3,  color: [242, 201, 76],   speed: 0.35, phase: 1     },  // Kodak Yellow (subtle)
        { x: 0.85, y: 0.6,  r: 0.35, color: [50, 60, 45],     speed: 0.15, phase: 3     },  // Dark fern
        { x: 0.4,  y: 0.15, r: 0.3,  color: [94, 118, 86],    speed: 0.28, phase: 5     },  // Light fern
    ];

    function draw() {
        time += 0.003;

        // Fill with base dark color
        ctx.fillStyle = '#1E1B18';
        ctx.fillRect(0, 0, width, height);

        // Scroll offset — blobs shift as you scroll
        const scrollY = window.scrollY;
        const scrollFactor = scrollY / (document.body.scrollHeight - window.innerHeight || 1);

        // Draw each blob
        blobs.forEach((blob, i) => {
            // Animate position with sine/cosine orbits
            const bx = blob.x + Math.sin(time * blob.speed + blob.phase) * 0.12
                        + (mouseX - 0.5) * 0.03;
            const by = blob.y + Math.cos(time * blob.speed * 0.8 + blob.phase) * 0.08
                        + scrollFactor * 0.15
                        + (mouseY - 0.5) * 0.02;

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
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        });

        // Soft overall vignette
        const vignette = ctx.createRadialGradient(
            width * 0.5, height * 0.5, width * 0.15,
            width * 0.5, height * 0.5, width * 0.75
        );
        vignette.addColorStop(0, 'transparent');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);

        animationId = requestAnimationFrame(draw);
    }

    // Start immediately
    draw();

    // Pause when tab not visible for performance
    document.addEventListener('visibilitychange', () => {
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

// ===== PROJECT FLOATING THUMBNAIL =====
function initProjectThumbnails() {
    const thumbnail = document.getElementById('projectThumbnail');
    const thumbnailImg = document.getElementById('projectThumbnailImg');
    const projects = document.querySelectorAll('.project-item[data-thumbnail]');

    if (!thumbnail || !thumbnailImg || !projects.length) return;

    // Don't init on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let mouseX = 0, mouseY = 0;
    let thumbX = 0, thumbY = 0;
    let isVisible = false;
    let rafId = null;

    function updatePosition() {
        thumbX += (mouseX - thumbX) * 0.1;
        thumbY += (mouseY - thumbY) * 0.1;

        thumbnail.style.left = thumbX + 20 + 'px';
        thumbnail.style.top = thumbY - 100 + 'px';

        if (isVisible) {
            rafId = requestAnimationFrame(updatePosition);
        }
    }

    projects.forEach(project => {
        const src = project.getAttribute('data-thumbnail');

        project.addEventListener('mouseenter', () => {
            thumbnailImg.src = src;
            thumbnailImg.alt = project.querySelector('.project-name').textContent;
            isVisible = true;
            thumbnail.classList.add('visible');
            rafId = requestAnimationFrame(updatePosition);
        });

        project.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        project.addEventListener('mouseleave', () => {
            isVisible = false;
            thumbnail.classList.remove('visible');
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        });
    });
}

// ===== VIDEO BACKGROUND — CROSSFADE ON SCROLL =====
function initVideoBackground() {
    const videos = document.querySelectorAll('.video-bg__vid');
    if (!videos.length) return;

    // Map section IDs to their video elements
    const sectionMap = {};
    videos.forEach(vid => {
        const sectionId = vid.getAttribute('data-section');
        sectionMap[sectionId] = vid;
    });

    // Sections to watch (in DOM order)
    const sectionIds = ['hero', 'about', 'work', 'skills', 'journey', 'contact'];
    const sections = sectionIds
        .map(id => document.getElementById(id))
        .filter(Boolean);

    let currentVideo = null;
    let videosLoaded = false;

    // Check if at least the first video can load
    const firstVideo = videos[0];
    firstVideo.addEventListener('loadeddata', () => {
        videosLoaded = true;
        // Hide the canvas fallback when video works
        const bgCanvas = document.getElementById('bgCanvas');
        if (bgCanvas) bgCanvas.style.opacity = '0';
    }, { once: true });

    firstVideo.addEventListener('error', () => {
        // Videos not found — keep canvas fallback visible
        const videoBg = document.getElementById('videoBg');
        if (videoBg) videoBg.style.display = 'none';
        console.log('✦ Video backgrounds not found, using canvas fallback');
    }, { once: true });

    function switchVideo(sectionId) {
        const targetVideo = sectionMap[sectionId];
        if (!targetVideo || targetVideo === currentVideo) return;

        // Fade out current
        if (currentVideo) {
            currentVideo.classList.remove('active');
            // Pause after transition to save resources
            setTimeout(() => {
                if (!currentVideo.classList.contains('active')) {
                    currentVideo.pause();
                }
            }, 1300);
        }

        // Fade in target
        targetVideo.classList.add('active');
        targetVideo.play().catch(() => {}); // Silently handle autoplay issues
        currentVideo = targetVideo;
    }

    // Set initial video
    currentVideo = firstVideo;

    // Use IntersectionObserver to detect which section is in view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                switchVideo(entry.target.id);
            }
        });
    }, {
        threshold: [0.3, 0.5],
        rootMargin: '-10% 0px -10% 0px'
    });

    sections.forEach(section => observer.observe(section));
}
