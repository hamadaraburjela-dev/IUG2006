(function(){
  // Loader: inject obfuscated script built for production
  var s = document.createElement('script');
  s.src = 'assets/dist/script.obf.js';
  s.defer = true;
  s.onerror = function(){ console.error('Failed to load obf script'); };
  document.head.appendChild(s);
})();
