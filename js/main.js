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
    initStatsCounter();
    initTimelineAnimations();
    initSkillAnimations();
    initContactAnimations();
    initSmoothScroll();

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
                start: 'top 85%',
                end: 'bottom 20%',
                toggleActions: 'play none none none'
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
        gsap.from(label, {
            scrollTrigger: {
                trigger: label,
                start: 'top 90%'
            },
            opacity: 0,
            x: -30,
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
        gsap.from(project, {
            scrollTrigger: {
                trigger: project,
                start: 'top 90%'
            },
            opacity: 0,
            y: 30,
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
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 85%'
            },
            opacity: 0,
            x: -40,
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
        gsap.from(cat, {
            scrollTrigger: {
                trigger: cat,
                start: 'top 85%'
            },
            opacity: 0,
            y: 40,
            duration: 0.6,
            delay: index * 0.1,
            ease: 'power3.out'
        });

        // Stagger chips
        const chips = cat.querySelectorAll('.skill-chip');
        gsap.from(chips, {
            scrollTrigger: {
                trigger: cat,
                start: 'top 80%'
            },
            opacity: 0,
            scale: 0.8,
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
        gsap.from(link, {
            scrollTrigger: {
                trigger: link,
                start: 'top 90%'
            },
            opacity: 0,
            x: -30,
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
