
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

// Lightweight touch ripple / tap flash for better tactile feedback on mobile
(function(){
  function createRipple(e){
    try{
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'touch-ripple';
  const coarse = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
  const size = Math.max(rect.width, rect.height) * (coarse ? 1.6 : 1.2);
  ripple.style.position = 'absolute';
  ripple.style.width = ripple.style.height = size + 'px';
  // support touch events coordinates when available
  const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
  const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
  ripple.style.left = (clientX - rect.left - size/2) + 'px';
  ripple.style.top = (clientY - rect.top - size/2) + 'px';
  ripple.style.borderRadius = '50%';
  ripple.style.pointerEvents = 'none';
  ripple.style.transform = 'scale(0)';
  ripple.style.opacity = '0';
  ripple.style.transition = 'transform 320ms cubic-bezier(.2,.8,.2,1), opacity 360ms linear';
  ripple.style.zIndex = 3;
  // only set relative positioning if element is static
  if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
  btn.appendChild(ripple);
  requestAnimationFrame(()=>{ ripple.style.transform = 'scale(1)'; ripple.style.opacity = '1'; });
  // fade and remove quicker to keep interaction snappy on mobile
  setTimeout(()=>{ ripple.style.opacity = '0'; }, 360);
  setTimeout(()=>{ try{ btn.removeChild(ripple); }catch(e){} }, 520);
    }catch(e){}
  }

  // Use event delegation so ripples also apply to elements added after load
  document.addEventListener('pointerdown', function(ev){
    try{
      const el = ev.target && ev.target.closest && ev.target.closest('.action-button, .option-btn, .guide-card, .feature-card');
      if (!el) return;
      // forward a minimal event-like object to createRipple so it can read coordinates
      createRipple({ currentTarget: el, clientX: ev.clientX, clientY: ev.clientY, touches: ev.touches });
    }catch(e){}
  }, { passive: true });
})();

// Site visitor counter removed per project decision. Runtime visitor counting and
// related localStorage keys (siteVisitsLocal, siteVisitorToken, siteVisitorCounted)
// have been intentionally removed to simplify the client.

