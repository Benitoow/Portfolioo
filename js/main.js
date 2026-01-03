/* ===== PORTFOLIO MAIN.JS - ENHANCED VERSION ===== */
/* Author: Benjamin LELEU */
/* Last Updated: 2025 */

// ===== CONFIGURATION =====
const CONFIG = {
    scrollOffset: 80,
    animationDuration: 300,
    typingSpeed: 100,
    particleCount: 50,
    statsAnimationDuration: 2000
};

// ===== UTILITY FUNCTIONS =====
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Debounce function for performance
function debounce(func, wait = 20) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit = 100) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Core functionality
    initNavigation();
    initThemeToggle();
    initScrollProgress();
    initScrollToTop();
    
    // Animations & Effects
    // initHeroParticles(); // DÉSACTIVÉ - Particules retirées
    initTypewriter();
    initStatsCounter();
    initScrollAnimations();
    initProjectCards();
    
    // Forms
    initContactForm();
    
    // Performance
    initLazyLoading();
    initSmoothScroll();
    
    console.log('🚀 Portfolio initialized successfully!');
}

// ===== NAVIGATION =====
function initNavigation() {
    const navbar = $('.navbar');
    const menuBtn = $('.menu-btn');
    const navLinks = $('.nav-links');
    const navItems = $$('.nav-links a');

    // Mobile menu toggle
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
            menuBtn.setAttribute('aria-expanded', !isExpanded);
            navLinks.classList.toggle('active');
            menuBtn.querySelector('i').classList.toggle('fa-bars');
            menuBtn.querySelector('i').classList.toggle('fa-times');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });
    }

    // Close menu on link click
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                menuBtn.setAttribute('aria-expanded', 'false');
                menuBtn.querySelector('i').classList.add('fa-bars');
                menuBtn.querySelector('i').classList.remove('fa-times');
                document.body.style.overflow = '';
            }
        });
    });

    // Navbar scroll effect
    const handleNavbarScroll = throttle(() => {
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        }
    }, 100);

    window.addEventListener('scroll', handleNavbarScroll);

    // Active link highlighting
    const sections = $$('section[id], header[id], .hero-content[id]');
    
    const highlightActiveLink = throttle(() => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - CONFIG.scrollOffset - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    }, 100);

    window.addEventListener('scroll', highlightActiveLink);
}

// ===== THEME TOGGLE =====
function initThemeToggle() {
    const themeToggle = $('#themeToggle');
    if (!themeToggle) return;

    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Add transition animation
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    });

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// ===== SCROLL PROGRESS =====
function initScrollProgress() {
    const progressBar = $('#scrollProgress');
    if (!progressBar) return;

    const updateProgress = throttle(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = `${scrollPercent}%`;
    }, 10);

    window.addEventListener('scroll', updateProgress);
}

// ===== SCROLL TO TOP =====
function initScrollToTop() {
    const scrollBtn = $('#scrollToTop');
    if (!scrollBtn) return;

    const toggleScrollBtn = throttle(() => {
        scrollBtn.classList.toggle('visible', window.scrollY > 300);
    }, 100);

    window.addEventListener('scroll', toggleScrollBtn);

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===== HERO PARTICLES =====
function initHeroParticles() {
    const container = $('#heroParticles');
    if (!container) return;

    // Create particles
    for (let i = 0; i < CONFIG.particleCount; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 5 + 2;
    const left = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = Math.random() * 10 + 10;
    
    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, rgba(108, 99, 255, 0.6), rgba(0, 217, 255, 0.6));
        border-radius: 50%;
        left: ${left}%;
        bottom: -10px;
        animation: floatUp ${duration}s ease-in-out ${delay}s infinite;
        pointer-events: none;
    `;
    
    container.appendChild(particle);
}

// ===== TYPEWRITER EFFECT =====
function initTypewriter() {
    const typewriter = $('.typewriter');
    if (!typewriter) return;

    const text = typewriter.textContent;
    typewriter.textContent = '';
    typewriter.style.visibility = 'visible';
    
    let index = 0;
    
    function type() {
        if (index < text.length) {
            typewriter.textContent += text.charAt(index);
            index++;
            setTimeout(type, CONFIG.typingSpeed);
        }
    }
    
    // Start after a small delay
    setTimeout(type, 500);
}

// ===== STATS COUNTER =====
function initStatsCounter() {
    const stats = $$('.stat-number[data-target]');
    if (!stats.length) return;

    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    stats.forEach(stat => observer.observe(stat));
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = CONFIG.statsAnimationDuration;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(easeOutQuart * target);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
    const animatedElements = $$('.section, .achievement-card, .skill-category, .timeline-item');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Stagger animation for grid items
                const children = entry.target.querySelectorAll('.achievement-card, .project-card, .skill-category');
                children.forEach((child, index) => {
                    child.style.animationDelay = `${index * 0.1}s`;
                    child.classList.add('animate-in');
                });
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => {
        el.classList.add('animate-ready');
        observer.observe(el);
    });
}

// ===== PROJECT CARDS =====
function initProjectCards() {
    const projectCards = $$('.project-card');
    
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    projectCards.forEach(card => observer.observe(card));

    // Add hover effects
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-12px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// ===== CONTACT FORM =====
function initContactForm() {
    const form = $('#contactForm');
    if (!form) return;

    const nameInput = $('#contactName');
    const emailInput = $('#contactEmail');
    const messageInput = $('#contactMessage');
    const formMessage = $('#formMessage');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset errors
        clearErrors();
        
        // Validate
        let isValid = true;
        
        if (!nameInput.value.trim()) {
            showError('nameError', 'Le nom est requis');
            isValid = false;
        }
        
        if (!emailInput.value.trim()) {
            showError('emailError', 'L\'email est requis');
            isValid = false;
        } else if (!isValidEmail(emailInput.value)) {
            showError('emailError', 'Veuillez entrer un email valide');
            isValid = false;
        }
        
        if (!messageInput.value.trim()) {
            showError('messageError', 'Le message est requis');
            isValid = false;
        }
        
        if (!isValid) return;

        // Simulate form submission
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            showFormMessage('success', '✅ Message envoyé avec succès ! Je vous répondrai bientôt.');
            form.reset();
        } catch (error) {
            showFormMessage('error', '❌ Erreur lors de l\'envoi. Veuillez réessayer.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    function showError(elementId, message) {
        const errorElement = $(`#${elementId}`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    function clearErrors() {
        $$('.error-message').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        if (formMessage) {
            formMessage.textContent = '';
            formMessage.className = 'form-message';
        }
    }

    function showFormMessage(type, message) {
        if (formMessage) {
            formMessage.textContent = message;
            formMessage.className = `form-message ${type}`;
            formMessage.style.display = 'block';
        }
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Real-time validation
    [nameInput, emailInput, messageInput].forEach(input => {
        if (input) {
            input.addEventListener('blur', () => {
                validateField(input);
            });
            
            input.addEventListener('input', () => {
                const errorId = `${input.id.replace('contact', '').toLowerCase()}Error`;
                const errorElement = $(`#${errorId}`);
                if (errorElement && errorElement.textContent) {
                    validateField(input);
                }
            });
        }
    });

    function validateField(input) {
        const fieldName = input.id.replace('contact', '').toLowerCase();
        const errorId = `${fieldName}Error`;
        const errorElement = $(`#${errorId}`);
        
        if (!errorElement) return;
        
        let message = '';
        
        if (!input.value.trim()) {
            message = `Le ${fieldName === 'email' ? 'email' : fieldName === 'name' ? 'nom' : 'message'} est requis`;
        } else if (fieldName === 'email' && !isValidEmail(input.value)) {
            message = 'Veuillez entrer un email valide';
        }
        
        errorElement.textContent = message;
        errorElement.style.display = message ? 'block' : 'none';
        input.classList.toggle('error', !!message);
    }
}

// ===== LAZY LOADING =====
function initLazyLoading() {
    const images = $$('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px'
        });

        images.forEach(img => {
            img.classList.add('lazy');
            imageObserver.observe(img);
        });
    }
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
    $$('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = $(href);
            if (target) {
                e.preventDefault();
                const offsetTop = target.offsetTop - CONFIG.scrollOffset;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== ADDITIONAL ANIMATIONS (CSS Classes) =====
// Add these CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    /* Particle Float Animation */
    @keyframes floatUp {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) rotate(720deg);
            opacity: 0;
        }
    }

    /* Fade In Up Animation */
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Wave Animation */
    @keyframes wave {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(20deg); }
        75% { transform: rotate(-15deg); }
    }

    /* Shimmer Animation */
    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }

    /* Float Animation */
    @keyframes float {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        33% { transform: translate(30px, -30px) rotate(5deg); }
        66% { transform: translate(-20px, 20px) rotate(-5deg); }
    }

    /* Animation Ready State */
    .animate-ready {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }

    .animate-in {
        opacity: 1;
        transform: translateY(0);
    }

    /* Scroll Progress Bar */
    .scroll-progress {
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(135deg, #6C63FF, #00D9FF);
        z-index: 9999;
        width: 0%;
        transition: width 0.1s ease;
    }

    /* Scroll to Top Button */
    .scroll-to-top {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #6C63FF, #00D9FF);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transform: translateY(20px);
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(108, 99, 255, 0.4);
    }

    .scroll-to-top.visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }

    .scroll-to-top:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(108, 99, 255, 0.5);
    }

    /* Mobile Menu */
    @media (max-width: 768px) {
        .nav-links {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(10px);
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 2rem;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-100%);
            transition: all 0.4s ease;
            z-index: 998;
        }

        .nav-links.active {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        [data-theme="dark"] .nav-links {
            background: rgba(15, 23, 42, 0.98);
        }

        .menu-btn {
            display: flex;
            z-index: 999;
        }
    }

    /* Lazy Loading Images */
    img.lazy {
        opacity: 0;
        transition: opacity 0.5s ease;
    }

    img.loaded {
        opacity: 1;
    }

    /* Form Messages */
    .form-message {
        padding: 1rem;
        border-radius: 8px;
        margin-top: 1rem;
        display: none;
    }

    .form-message.success {
        background: rgba(16, 185, 129, 0.1);
        color: #10B981;
        border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .form-message.error {
        background: rgba(239, 68, 68, 0.1);
        color: #EF4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
    }

    /* Error Messages */
    .error-message {
        color: #EF4444;
        font-size: 0.85rem;
        margin-top: 0.25rem;
        display: none;
    }

    input.error,
    textarea.error {
        border-color: #EF4444 !important;
    }

    /* Hero Particles Container */
    .hero-particles {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
        z-index: 0;
    }

    /* Navbar Active Link */
    .nav-links a.active {
        color: var(--primary-color);
    }

    .nav-links a.active::after {
        width: 100%;
    }

    /* Project Card Visible State */
    .project-card {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .project-card.visible {
        opacity: 1;
        transform: translateY(0);
    }

    /* Achievement Cards Animation */
    .achievement-card {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s ease;
    }

    .animate-in .achievement-card,
    .achievement-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }

    /* Skill Category Animation */
    .skill-category {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s ease;
    }

    .skill-category.animate-in {
        opacity: 1;
        transform: translateY(0);
    }

    /* Timeline Animation */
    .timeline-item {
        opacity: 0;
        transform: translateX(-30px);
        transition: all 0.5s ease;
    }

    .timeline-item:nth-child(even) {
        transform: translateX(30px);
    }

    .timeline-item.animate-in {
        opacity: 1;
        transform: translateX(0);
    }
`;
document.head.appendChild(style);

// ===== CONSOLE EASTER EGG =====
console.log(`
%c🚀 Portfolio de Benjamin LELEU
%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
%c💻 Développeur Web Full-Stack
%c📧 benjamin.leleu.dev@gmail.com
%c🔗 github.com/Benitoow

%cIntéressé par le code source ?
Rejoignez-moi sur GitHub ! 👋
`, 
'font-size: 20px; font-weight: bold; color: #6C63FF;',
'color: #00D9FF;',
'font-size: 14px; color: #333;',
'font-size: 12px; color: #666;',
'font-size: 12px; color: #666;',
'font-size: 11px; color: #999; font-style: italic;'
);
