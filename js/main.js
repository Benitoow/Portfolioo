// ===== FONCTIONNALITÉS PRINCIPALES DU PORTFOLIO =====

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== VARIABLES ET SÉLECTEURS =====
    const navbar = document.querySelector('.navbar');
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const projectCards = document.querySelectorAll('.project-card');
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');
    
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
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.2 });
    
    // Observe chaque carte de projet
    projectCards.forEach(card => {
        observer.observe(card);
        
        // Ajoute un délai pour l'animation séquentielle
        card.style.animationDelay = `${Array.from(projectCards).indexOf(card) * 0.1}s`;
    });
    
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
});
