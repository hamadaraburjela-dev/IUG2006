(function(){
  const selectors = ['.action-button','a.action-button','.item-card','.back-button-container','h1','h2','h3','p','a'];
  selectors.forEach(sel=>{
    document.querySelectorAll(sel).forEach(el=>{
      if(el.hasAttribute('style')){
        const s = el.getAttribute('style');
        const cleaned = s
          .replace(/background[^;]+;?/gi,'')
          .replace(/background-color[^;]+;?/gi,'')
          .replace(/color[^;]+;?/gi,'')
          .replace(/box-shadow[^;]+;?/gi,'')
          .replace(/border[^;]+;?/gi,'')
          .trim();
        if(cleaned) el.setAttribute('style', cleaned);
        else el.removeAttribute('style');
      }
      if(sel.includes('action-button') && !el.classList.contains('action-button')) el.classList.add('action-button');
      if(sel.includes('item-card') && !el.classList.contains('item-card')) el.classList.add('item-card');
    });
  });
})();

