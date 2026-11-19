/* Recuperación accesible cuando una imagen externa no esté disponible. */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.source-photo img, .develop-grid img').forEach((img) => {
    img.addEventListener('error', () => {
      img.src = 'assets/photo-study.svg';
      img.alt = 'Imagen de referencia no disponible. Abre la fuente original en el enlace de esta tarjeta.';
    }, { once: true });
  });
});
