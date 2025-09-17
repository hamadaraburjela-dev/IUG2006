
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
  // Inject a fallback modal used by quizzes if not present in the page
  if (!document.getElementById('odv-modal')){
    const modal = document.createElement('div');
    modal.id = 'odv-modal';
    modal.setAttribute('hidden','');
    modal.innerHTML = `
      <div id="odv-modal-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;z-index:9999">
        <div id="odv-modal-card" style="background:#fff;border-radius:12px;padding:16px;max-width:520px;width:92%;box-shadow:0 10px 30px rgba(0,0,0,0.2);direction:rtl;text-align:right">
          <h3 id="odv-modal-title" style="margin:0 0 8px;color:#0a6b3a">تنبيه</h3>
          <p id="odv-modal-desc" style="margin:0 0 12px;color:#333">...</p>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button id="odv-modal-ok" style="background:var(--iug-green,#0a6b3a);color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer">موافق</button>
            <button id="odv-modal-cancel" style="background:#f0f0f0;color:#333;border:none;padding:8px 12px;border-radius:8px;cursor:pointer">إغلاق</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    // wire close
    document.getElementById('odv-modal-cancel').onclick = ()=>{ document.getElementById('odv-modal').setAttribute('hidden',''); };
    document.getElementById('odv-modal-ok').onclick = ()=>{ document.getElementById('odv-modal').setAttribute('hidden',''); };
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
