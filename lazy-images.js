// Lazy-load and async-decode images except those marked with data-no-lazy
(function(){
  function enhance(img){
    if(img.hasAttribute('data-no-lazy')) return;
    if(!img.hasAttribute('loading')) img.setAttribute('loading','lazy');
    if(!img.hasAttribute('decoding')) img.setAttribute('decoding','async');
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    document.querySelectorAll('img').forEach(img => {
      if(!img.hasAttribute('data-no-lazy')){
        img.classList.add('skeleton');
        if(img.complete) {
          img.classList.remove('skeleton');
        } else {
          img.addEventListener('load', ()=> img.classList.remove('skeleton'), { once: true });
          img.addEventListener('error', ()=> img.classList.remove('skeleton'), { once: true });
        }
      }
      enhance(img);
    });
  });
})();
