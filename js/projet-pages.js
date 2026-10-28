/* Optional enhancements. Every image and file remains a link without JS. */
(() => {
  const links = [...document.querySelectorAll('a[data-lightbox]')];

  if (links.length && typeof HTMLDialogElement !== 'undefined' &&
      typeof HTMLDialogElement.prototype.showModal === 'function') {
    const dialog = document.createElement('dialog');
    dialog.className = 'media-dialog';
    dialog.setAttribute('aria-label', 'Visuel du projet en grand');
    dialog.innerHTML = '<button type="button" class="media-dialog__close" aria-label="Fermer le visuel">Fermer <svg class="case-icon" aria-hidden="true" focusable="false"><use href="/images/project-icons.svg#line-close"></use></svg></button><figure><img alt=""><figcaption></figcaption></figure>';
    const image = dialog.querySelector('img');
    const caption = dialog.querySelector('figcaption');
    const closeButton = dialog.querySelector('button');
    let opener = null;
    document.body.append(dialog);

    links.forEach((link) => {
      link.addEventListener('click', (event) => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const thumbnail = link.querySelector('img');
        image.src = link.href;
        image.alt = thumbnail?.alt || '';
        caption.textContent = link.dataset.caption || image.alt;
        opener = link;
        dialog.showModal();
        document.body.classList.add('has-open-media');
        document.body.classList.remove('has-custom-cursor');
        const cursor = document.querySelector('.smooth-cursor');
        if (cursor) cursor.style.opacity = '0';
        closeButton.focus({ preventScroll: true });
        event.preventDefault();
      });
    });

    closeButton.addEventListener('click', () => dialog.close());
    // The close button is the only interactive element in this image viewer.
    dialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      event.preventDefault();
      closeButton.focus();
    });
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('has-open-media');
      image.removeAttribute('src');
      opener?.focus({ preventScroll: true });
    });
  }

  const audio = document.querySelector('.audio-session audio');
  const audioError = document.getElementById('audio-error');
  if (audio && audioError) {
    audio.addEventListener('error', () => { audioError.hidden = false; });
    audio.addEventListener('canplay', () => { audioError.hidden = true; });
    if (audio.error) audioError.hidden = false;
  }
})();
