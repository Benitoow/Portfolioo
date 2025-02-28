document.addEventListener('DOMContentLoaded', function() {
    // Animation des éléments au scroll
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.project-card, .skill-category, .section h2');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;
            
            if (elementPosition < screenPosition) {
                element.classList.add('visible');
            }
        });
    };
    
    // Ajouter la classe pour les animations CSS
    const addAnimationClasses = () => {
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
        
        const skillCategories = document.querySelectorAll('.skill-category');
        skillCategories.forEach((category, index) => {
            category.style.animationDelay = `${index * 0.1}s`;
        });
    };
    
    // Smooth scrolling pour les ancres
    const smoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
                
                // Close mobile menu if it's open
                const navLinks = document.querySelector('.nav-links');
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                }
            });
        });
    };
    
    // Mobile menu toggle
    const setupMobileMenu = () => {
        const menuBtn = document.querySelector('.menu-btn');
        const navLinks = document.querySelector('.nav-links');
        
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }
    };
    
    // Add navbar scroll effect
    const navbarEffect = () => {
        const navbar = document.querySelector('.navbar');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    };
    
    // Form submission with validation
    const setupContactForm = () => {
        const contactForm = document.getElementById('contactForm');
        const formMessage = document.getElementById('formMessage');
        
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const name = this.querySelector('input[type="text"]').value;
                const email = this.querySelector('input[type="email"]').value;
                const message = this.querySelector('textarea').value;
                
                // Basic validation
                if (!name || !email || !message) {
                    showFormMessage('Veuillez remplir tous les champs du formulaire.', 'error');
                    return;
                }
                
                if (!isValidEmail(email)) {
                    showFormMessage('Veuillez entrer une adresse email valide.', 'error');
                    return;
                }
                
                // Simulate form submission (replace with actual submission)
                setTimeout(() => {
                    showFormMessage('Merci pour votre message ! Je vous répondrai dès que possible.', 'success');
                    contactForm.reset();
                }, 1000);
            });
        }
    };
    
    const showFormMessage = (message, type) => {
        const formMessage = document.getElementById('formMessage');
        if (formMessage) {
            formMessage.textContent = message;
            formMessage.className = 'form-message ' + type;
            
            // Hide the message after 5 seconds
            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 5000);
        }
    };
    
    const isValidEmail = (email) => {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };
    
    // Fix image loading issues
    const handleImageErrors = () => {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            img.onerror = function() {
                this.src = '../images/placeholder.jpg';
                this.alt = 'Image non disponible';
            };
        });
    };
    
    // Exécution des fonctions
    window.addEventListener('scroll', animateOnScroll);
    addAnimationClasses();
    smoothScroll();
    setupMobileMenu();
    navbarEffect();
    setupContactForm();
    handleImageErrors();
    animateOnScroll(); // Appel initial pour animer les éléments déjà visibles
});
