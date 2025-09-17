
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
      const size = Math.max(rect.width, rect.height) * 1.2;
      ripple.style.position = 'absolute';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
      ripple.style.background = 'rgba(255,255,255,0.18)';
      ripple.style.borderRadius = '50%';
      ripple.style.pointerEvents = 'none';
      ripple.style.transform = 'scale(0)';
      ripple.style.transition = 'transform 350ms ease, opacity 420ms ease';
      ripple.style.zIndex = 3;
      btn.style.position = btn.style.position || 'relative';
      btn.appendChild(ripple);
      requestAnimationFrame(()=>{ ripple.style.transform = 'scale(1)'; ripple.style.opacity = '1'; });
      setTimeout(()=>{ ripple.style.opacity = '0'; }, 250);
      setTimeout(()=>{ try{ btn.removeChild(ripple); }catch(e){} }, 700);
    }catch(e){}
  }

  document.addEventListener('DOMContentLoaded', function(){
    // attach to primary interactive elements
    const targets = document.querySelectorAll('.action-button, .option-btn, .guide-card, .feature-card');
    targets.forEach(t => {
      t.addEventListener('pointerdown', createRipple, {passive:true});
    });
  });
})();

// Site visitor counter (server-optional, local fallback)
(function(){
  const COUNTER_ID = 'site-visitor-counter';
  const COUNTED_KEY = 'siteVisitorCounted';
  const LOCAL_COUNT_KEY = 'siteVisitsLocal';

  function createCounterNode(){
    if (document.getElementById(COUNTER_ID)) return document.getElementById(COUNTER_ID);
    const el = document.createElement('div');
    el.id = COUNTER_ID;
    el.setAttribute('aria-live','polite');
    el.style.position = 'fixed';
    el.style.bottom = '12px';
    el.style.left = '12px';
    el.style.zIndex = 99999;
    el.style.background = 'rgba(255,255,255,0.9)';
    el.style.color = '#0a6b3a';
    el.style.padding = '8px 12px';
    el.style.borderRadius = '12px';
    el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
    el.style.fontWeight = '700';
    el.style.fontSize = '14px';
    el.style.cursor = 'pointer';
    el.title = 'انقر لتحديث عدد الزوار (يحاول الاتصال بالخادم أولاً)';
    document.body.appendChild(el);
    return el;
  }

  function updateDisplay(n){
    const el = createCounterNode();
    el.textContent = `زوار الموقع: ${n}`;
  }

  async function fetchServerCount(action){
    try{
      const url = (window.SCRIPT_URL) ? window.SCRIPT_URL : null;
      if (!url) return null;
      const fd = new FormData();
      fd.append('action', action);
      const res = await fetch(url, { method: 'POST', body: fd });
      if (!res.ok) return null;
      const j = await res.json();
      // expect { result: 'success', count: <number> } or similar
      if (j && (typeof j.count === 'number')) return j.count;
      if (j && typeof j.result === 'number') return j.result;
      return null;
    }catch(e){ return null; }
  }

  document.addEventListener('DOMContentLoaded', async function(){
    const el = createCounterNode();

    // click to refresh attempt
    el.addEventListener('click', async ()=>{
      el.textContent = 'جارٍ التحديث...';
      const sv = await fetchServerCount('visitorGet');
      if (sv !== null) {
        updateDisplay(sv);
      } else {
        updateDisplay(parseInt(localStorage.getItem(LOCAL_COUNT_KEY) || '0',10));
      }
    });

    const alreadyCounted = localStorage.getItem(COUNTED_KEY);
    if (!alreadyCounted){
      // first try server increment
      const sv = await fetchServerCount('visitorIncrement');
      if (sv !== null){
        updateDisplay(sv);
        try{ localStorage.setItem(COUNTED_KEY, '1'); }catch(e){}
        return;
      }
      // fallback: increment local counter
      let local = parseInt(localStorage.getItem(LOCAL_COUNT_KEY) || '0', 10) || 0;
      local = local + 1;
      try{ localStorage.setItem(LOCAL_COUNT_KEY, String(local)); localStorage.setItem(COUNTED_KEY,'1'); }catch(e){}
      updateDisplay(local);
      return;
    }

    // already counted on this device — try to read server count, else show local
    const svNow = await fetchServerCount('visitorGet');
    if (svNow !== null){ updateDisplay(svNow); return; }
    updateDisplay(parseInt(localStorage.getItem(LOCAL_COUNT_KEY) || '0',10));
  });
})();
