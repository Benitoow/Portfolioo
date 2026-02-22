/* ===== LIGHTBOX SYSTEM ===== */
/* Permet d'agrandir les images des projets au clic */
/* Auteur : Benjamin LELEU · 2026 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Créer la structure HTML de la modale en JS
    const lightboxHTML = `
        <div id="lightbox" class="lightbox" aria-hidden="true" role="dialog">
            <button class="lightbox-close" aria-label="Fermer la vue agrandie">&times;</button>
            <div class="lightbox-content">
                <img id="lightbox-img" src="" alt="">
            </div>
            <div class="lightbox-caption" id="lightbox-caption"></div>
        </div>
    `;
    
    // Insérer la modale à la fin du body
    document.body.insertAdjacentHTML('beforeend', lightboxHTML);

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.lightbox-close');

    // 2. Sélectionner les images cliquables (dans les .project-card, .about-content, ou direct .projects-grid)
    const images = document.querySelectorAll('.project-card img, .about-content img, .gallery img, .image-grid img');

    // Ajouter une classe pour le curseur personnalisé
    images.forEach(img => {
        img.classList.add('lightbox-trigger');

        // Gérer le clic
        img.addEventListener('click', () => {
            // Mettre à jour l'image
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt || "Image agrandie du projet";
            
            // Mettre à jour la légende (si présente en tant que frère h3 ou paragraphe, ou le alt)
            let captionText = img.alt;
            const parent = img.closest('.project-card');
            if (parent) {
                 const title = parent.querySelector('h3');
                 if(title) captionText = title.textContent;
            }
            lightboxCaption.textContent = captionText || '';

            // Afficher la modale
            lightbox.classList.add('active');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden'; // Empêcher le scroll derrière
        });
    });

    // 3. Fermeture de la modale
    const closeLightbox = () => {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = ''; // Restaurer le scroll
        // Petit délai pour attendre la fin de la transition d'opacité
        setTimeout(() => {
            lightboxImg.src = '';
        }, 300);
    };

    closeBtn.addEventListener('click', closeLightbox);
    
    // Fermer en cliquant à côté de l'image (sur le fond sombre)
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
            closeLightbox();
        }
    });

    // Fermer avec la touche Echap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
});
