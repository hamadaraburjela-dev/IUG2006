
// Common fixes: enable anchor navigation and data-href buttons, and ensure RTL dir.
document.addEventListener('DOMContentLoaded', function () {
  // Smooth scroll for same-page anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
  // data-href navigation for <a href="#"> placeholders
  document.querySelectorAll('a[data-href]').forEach(a => {
    a.addEventListener('click', function (e) {
      const url = this.getAttribute('data-href');
      if (url && url !== '#') {
        e.preventDefault();
        window.location.href = url;
      }
    });
  });
  // Ensure <html dir="rtl" lang="ar">
  if (document.documentElement) {
    document.documentElement.setAttribute('dir','rtl');
    document.documentElement.setAttribute('lang','ar');
  }
});
window.showAttemptsModal = function({ title, message }){
  const modal = document.getElementById("odv-modal");
  const titleEl = document.getElementById("odv-modal-title");
  const descEl = document.getElementById("odv-modal-desc");
  if (title) titleEl.textContent = title;
  if (message) descEl.textContent = message;
  modal.removeAttribute("hidden");

  document.getElementById("odv-modal-ok").onclick = () => {
    modal.setAttribute("hidden","");
  };
};
