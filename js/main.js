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
    });
    
    // ===== ANIMATION DES COMPÉTENCES =====
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    
                    // Anime les éléments de liste avec un délai
                    const listItems = entry.target.querySelectorAll('li');
                    listItems.forEach((li, liIndex) => {
                        setTimeout(() => {
                            li.style.opacity = '1';
                            li.style.transform = 'translateX(0)';
                        }, liIndex * 100);
                    });
                }, index * 150);
            }
        });
    }, { threshold: 0.3 });
    
    skillCategories.forEach((category, index) => {
        category.style.opacity = '0';
        category.style.transform = 'translateY(30px)';
        category.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Initialise les éléments de liste
        const listItems = category.querySelectorAll('li');
        listItems.forEach(li => {
            li.style.opacity = '0';
            li.style.transform = 'translateX(-20px)';
            li.style.transition = 'all 0.4s ease';
        });
        
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
});
