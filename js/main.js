// ===== FONCTIONNALITÉS PRINCIPALES DU PORTFOLIO =====

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== VARIABLES ET SÉLECTEURS =====
    const navbar = document.querySelector('.navbar');
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const projectCards = document.querySelectorAll('.project-card');
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');
    const skillCategories = document.querySelectorAll('.skill-category');
    
    // ===== EFFET DE DÉFILEMENT POUR LA BARRE DE NAVIGATION =====
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // ===== MENU MOBILE =====
    menuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        // Change l'icône du menu selon l'état
        const icon = menuBtn.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
    
    // ===== LIENS DE NAVIGATION FLUIDE =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            // Ferme le menu mobile si ouvert
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                menuBtn.querySelector('i').classList.remove('fa-times');
                menuBtn.querySelector('i').classList.add('fa-bars');
            }
            
            // Défilement fluide vers la section
            if (targetId !== "#") {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // ===== ANIMATION DES CARTES DE PROJET AU DÉFILEMENT =====
    // Observer pour animer l'apparition des projets
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
            }
        });
    }, { 
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe chaque carte de projet
    projectCards.forEach((card, index) => {
        observer.observe(card);
        // Ajoute un délai pour l'animation séquentielle
        card.style.animationDelay = `${index * 0.1}s`;
    });    // ===== ANIMATION DES COMPÉTENCES =====
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('in-view');
                }, index * 200);
            }
        });
    }, { threshold: 0.3 });
    
    skillCategories.forEach((category, index) => {
        skillObserver.observe(category);
    });
    
    // ===== EFFET DE PARALLAXE LÉGER =====
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.hero::after');
        
        parallaxElements.forEach(element => {
            const speed = 0.5;
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
    
    // ===== EFFET DE TYPING POUR LE SOUS-TITRE =====
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) {
        const text = subtitle.textContent;
        subtitle.textContent = '';
        subtitle.style.borderRight = '2px solid #6C63FF';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                subtitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            } else {
                // Effet de clignotement du curseur
                setInterval(() => {
                    subtitle.style.borderRight = subtitle.style.borderRight === 'none' 
                        ? '2px solid #6C63FF' 
                        : 'none';
                }, 500);
            }
        };
        
        // Démarre l'effet après un délai
        setTimeout(typeWriter, 1000);
    }
    
    // ===== GESTION DU FORMULAIRE DE CONTACT =====
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simulation d'envoi du formulaire
            const name = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            const message = this.querySelector('textarea').value;
            
            // Vérification basique des entrées
            if (name && email && message) {
                // Ici, vous pourriez intégrer votre logique d'envoi d'e-mail réelle
                // Pour l'exemple, nous simulons juste un succès après un délai
                
                // Message de chargement
                formMessage.textContent = "Envoi en cours...";
                formMessage.className = "form-message";
                formMessage.style.display = "block";
                
                setTimeout(() => {
                    // Simuler un succès
                    formMessage.textContent = "Votre message a été envoyé avec succès ! Je vous répondrai dès que possible.";
                    formMessage.className = "form-message success";
                    
                    // Réinitialisation du formulaire
                    contactForm.reset();
                }, 1500);
            } else {
                // Afficher un message d'erreur
                formMessage.textContent = "Veuillez remplir tous les champs du formulaire.";
                formMessage.className = "form-message error";
                formMessage.style.display = "block";
            }
        });
    }
    
    // ===== INITIALISATION DES ANIMATIONS DE DÉFILEMENT =====
    // Animation des sections au défilement
    const sections = document.querySelectorAll('.section');
    
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    sections.forEach(section => {
        section.style.opacity = 0;
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        sectionObserver.observe(section);
    });
    
    // ===== DARK MODE TOGGLE =====
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Applique le thème sauvegardé
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'dark') {
        themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Change l'icône
        const icon = this.querySelector('i');
        if (newTheme === 'dark') {
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
        }
        
        // Ajoute un petit effet de rotation
        this.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            this.style.transform = 'rotate(0deg)';
        }, 300);
    });
    
    // ===== DETECTION DU THEME SYSTEME =====
    if (!localStorage.getItem('theme')) {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', systemTheme);
        if (systemTheme === 'dark') {
            themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        }
    }
      // ===== SCROLL PROGRESS BAR =====
    const scrollProgress = document.getElementById('scrollProgress');
    
    window.addEventListener('scroll', () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.pageYOffset / scrollHeight) * 100;
        scrollProgress.style.width = scrolled + '%';
    });
      // ===== ANIMATED COUNTERS =====
    const counters = document.querySelectorAll('.stat-number');
    let countersAnimated = false;
    
    const animateCounters = () => {
        if (countersAnimated) return;
        countersAnimated = true;
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            let current = 0;
            const increment = target / 50; // Plus fluide
            
            const updateCounter = () => {
                if (current < target) {
                    current += increment;
                    counter.textContent = Math.floor(current);
                    setTimeout(updateCounter, 40);
                } else {
                    counter.textContent = target;
                }
            };
            
            updateCounter();
        });
    };
    
    // Observer pour déclencher l'animation des compteurs
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !countersAnimated) {
                setTimeout(() => animateCounters(), 500);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    // Observe les compteurs dans hero-stats
    const heroStatsSection = document.querySelector('.hero-stats');
    if (heroStatsSection) {
        counterObserver.observe(heroStatsSection);
    }
    
    // Observe aussi stats-container si elle existe (pour autres pages)
    const statsSection = document.querySelector('.stats-container');
    if (statsSection) {
        counterObserver.observe(statsSection);
    }
    
    // ==================== HERO PARTICLES ANIMATION ====================
    function createHeroParticles() {
        const particlesContainer = document.getElementById('heroParticles');
        if (!particlesContainer) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        particlesContainer.appendChild(canvas);

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const particles = [];
        const particleCount = 50;

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = (Math.random() - 0.5) * 2;
                this.size = Math.random() * 3 + 1;
                this.opacity = Math.random() * 0.5 + 0.2;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 123, 255, ${this.opacity})`;
                ctx.fill();
            }
        }

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            // Draw connections
            particles.forEach((particle, i) => {
                particles.slice(i + 1).forEach(otherParticle => {
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.strokeStyle = `rgba(0, 123, 255, ${0.2 * (1 - distance / 100)})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                });
            });

            requestAnimationFrame(animate);
        }

        animate();    }

    // ==================== TIMELINE ANIMATION ====================
    function animateTimeline() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        
        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '0px 0px -100px 0px'
        });

        timelineItems.forEach(item => {
            timelineObserver.observe(item);
        });
    }

    // ==================== HERO STATS COUNTER ====================
    function animateHeroStats() {
        const statNumbers = document.querySelectorAll('.hero-content .stat-number');
        let animated = false;

        const heroObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !animated) {
                    animated = true;
                    
                    statNumbers.forEach(stat => {
                        const target = parseInt(stat.getAttribute('data-target'));
                        animateCounter(stat, 0, target, 2000);
                    });
                    
                    heroObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        const heroSection = document.querySelector('.hero-content');
        if (heroSection) {
            heroObserver.observe(heroSection);
        }
    }

    // ==================== ENHANCED COUNTER ANIMATION ====================
    function animateCounter(element, start, end, duration) {
        const range = end - start;
        const startTime = performance.now();
        
        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (range * easeOut));
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = end;
            }
        }
        
        requestAnimationFrame(updateCounter);
    }

    // ==================== SCROLL ENHANCEMENTS ====================
    function enhanceScrollEffects() {
        // Parallax effect for hero section
        const hero = document.querySelector('.hero');
        if (hero) {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const parallax = scrolled * 0.5;
                hero.style.transform = `translateY(${parallax}px)`;
            });
        }

        // Add scroll indicator
        const scrollIndicator = document.createElement('div');
        scrollIndicator.className = 'scroll-indicator';
        scrollIndicator.innerHTML = '<i class="fas fa-chevron-down"></i>';
        
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.appendChild(scrollIndicator);
        }
    }

    // ==================== TYPEWRITER EFFECT ====================
    function initTypewriterEffect() {
        const typewriterElement = document.querySelector('.typewriter');
        if (!typewriterElement) return;

        const text = typewriterElement.textContent;
        typewriterElement.textContent = '';
        typewriterElement.style.borderRight = '0.15em solid var(--primary-color)';
        
        let i = 0;
        function typeWriter() {
            if (i < text.length) {
                typewriterElement.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            } else {
                // Start blinking cursor
                setInterval(() => {
                    const cursor = typewriterElement.style.borderRightColor;
                    typewriterElement.style.borderRightColor = 
                        cursor === 'transparent' ? 'var(--primary-color)' : 'transparent';
                }, 500);
            }
        }

        setTimeout(typeWriter, 1000);
    }

    // ==================== TECH ITEMS HOVER EFFECT ====================
    function initTechItemsEffect() {
        const techItems = document.querySelectorAll('.tech-item');
        
        techItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                const icon = item.querySelector('i');
                icon.style.transform = 'rotateY(360deg)';
                icon.style.transition = 'transform 0.6s ease';
            });
            
            item.addEventListener('mouseleave', () => {
                const icon = item.querySelector('i');
                icon.style.transform = 'rotateY(0deg)';
            });
        });
    }

    // ==================== ENHANCED MAIN INITIALIZATION ====================
    // Initialize all existing functionality
    initThemeToggle();
    setupMobileMenu();
    initSmoothScrolling();
    setupScrollProgress();
    initProjectFilters();
    initContactForm();
    initAnimations(); // From existing code    // Initialize new enhanced features
    createHeroParticles();
    animateTimeline();
    animateHeroStats();
    enhanceScrollEffects();
    initTypewriterEffect();
    initTechItemsEffect();

    console.log('🚀 Portfolio enhancements loaded successfully!');
});
