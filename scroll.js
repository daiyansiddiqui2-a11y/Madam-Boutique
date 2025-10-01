// Enhanced scroll animations, counters, parallax, tilt, and UX helpers
(function(){
  const revealClass = 'reveal-on-scroll';

  function applyAnim(target, idx){
    const anim = target.getAttribute('data-anim') || 'animate__fadeInUp';
    if(typeof idx === 'number') target.style.animationDelay = `${idx * 100}ms`;
    target.classList.add('animate__animated', anim);
  }

  // IntersectionObserver for reveal + counters + stagger
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry => {
      if(!entry.isIntersecting) return;
      const el = entry.target;
      if(el.classList.contains('stagger')){
        const kids = Array.from(el.children);
        kids.forEach((kid, i)=> applyAnim(kid, i));
      } else {
        applyAnim(el);
      }
      // Counters within the section
      el.querySelectorAll('[data-count]').forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'), 10) || 0;
        const duration = parseInt(counter.getAttribute('data-duration'), 10) || 1200;
        const start = 0;
        const t0 = performance.now();
        function tick(t){
          const p = Math.min(1, (t - t0)/duration);
          const v = Math.floor(start + (target - start) * p);
          counter.textContent = v.toLocaleString();
          if(p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
      io.unobserve(el);
    });
  }, { threshold: 0.15 });

  document.addEventListener('DOMContentLoaded', ()=>{
    document.querySelectorAll('.' + revealClass + ', .stagger').forEach(el=> io.observe(el));

    // Cart count badge in header
    (function initCartBadge(){
      function getCount(){
        try {
          const list = JSON.parse(localStorage.getItem('cart')) || [];
          if(!Array.isArray(list)) return 0;
          let total = 0; list.forEach(it => { const q = Number(it?.qty||1); total += (isNaN(q) ? 1 : q); });
          return total;
        } catch(e){ return 0; }
      }
      function update(){
        const link = document.querySelector('header a[href$="cart.html"]');
        if(!link) return;
        link.classList.add('cart-link');
        let badge = link.querySelector('.cart-badge');
        if(!badge){ badge = document.createElement('span'); badge.className = 'cart-badge'; link.appendChild(badge); }
        const cnt = getCount();
        const prev = Number(badge.getAttribute('data-count')||0);
        if(cnt <= 0){ badge.textContent = ''; badge.classList.add('hide'); }
        else {
          badge.textContent = String(cnt); badge.classList.remove('hide');
        }
        badge.setAttribute('data-count', String(cnt));
        // accessibility labels on link
        const label = cnt > 0 ? `${cnt} item${cnt>1?'s':''} in cart` : 'Cart is empty';
        link.setAttribute('aria-label', label); link.setAttribute('title', label);
        // subtle bump when count changes
        if(cnt !== prev){ badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump'); setTimeout(()=> badge.classList.remove('bump'), 420); }
      }
      update();
      window.addEventListener('storage', (e)=>{ if(e.key === 'cart') update(); });
      document.addEventListener('cart:updated', update);
    })();

    // Add tilt to common cards
document.querySelectorAll('.product-card, .brand-card, #feature .fe-box, .fabric-img').forEach(el=>{
      el.classList.add('tilt');
      const max = 8; // deg
      el.addEventListener('mousemove', (e)=>{
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `rotateX(${(-py*max).toFixed(2)}deg) rotateY(${(px*max).toFixed(2)}deg) translateY(-2px)`;
      });
      el.addEventListener('mouseleave', ()=>{
        el.style.transform = '';
      });
    });

    // Parallax + UI toggles
    const parallaxes = Array.from(document.querySelectorAll('[data-parallax]'));
    const parallaxBgs = Array.from(document.querySelectorAll('[data-parallax-bg]'));
    let ticking = false;
    function onScroll(){
      if(ticking) return; ticking = true;
      requestAnimationFrame(()=>{
        const y = window.scrollY || window.pageYOffset;
        // Update scroll progress bar
        const sp = document.getElementById('scrollProgress');
        if(sp){
          const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
          const pct = Math.max(0, Math.min(1, y / max));
          sp.style.width = (pct * 100) + '%';
        }
        parallaxes.forEach(el=>{
          const speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
          el.style.transform = `translateY(${(y*speed).toFixed(1)}px)`;
        });
        parallaxBgs.forEach(el=>{
          const speed = parseFloat(el.getAttribute('data-parallax-bg')) || 0.15;
          el.style.backgroundPosition = `center ${(-y*speed).toFixed(1)}px`;
        });
        // Toggle Back-to-top and Sticky CTA
        const showUI = y > 300;
        const btt = document.getElementById('backToTop');
        if(btt) btt.classList.toggle('show', showUI);
        const cta = document.querySelector('.sticky-cta');
        if(cta) cta.classList.toggle('show', y > 400);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Products brand pre-filter via URL ?brand=Khaadi
    const params = new URLSearchParams(location.search);
    const targetBrand = params.get('brand');
    if(targetBrand){
      const btn = document.querySelector(`.filters [data-filter="${CSS.escape(targetBrand)}"]`);
      if(btn) btn.click();
    }

  // Testimonials carousel auto-rotate
  const track = document.querySelector('#t-carousel .t-slides');
  if(track){
      const slides = track.children.length;
      const dots = Array.from(document.querySelectorAll('#t-carousel .t-dots button'));
      let idx = 0;
      function go(i){
        idx = (i+slides)%slides;
        track.style.transform = `translateX(${-idx*100}%)`;
        dots.forEach((d,di)=> d.classList.toggle('active', di===idx));
      }
      let timer = setInterval(()=> go(idx+1), 4000);
      const wrap = document.getElementById('t-carousel');
      if(wrap){
        wrap.addEventListener('mouseenter', ()=> { clearInterval(timer); });
        wrap.addEventListener('mouseleave', ()=> { clearInterval(timer); timer = setInterval(()=> go(idx+1), 4000); });
      }
      dots.forEach((d,i)=> d.addEventListener('click', ()=>{ go(i); clearInterval(timer); timer = setInterval(()=> go(idx+1), 4000);}));
      go(0);
    }

    // Inject Back-to-top button
    if(!document.getElementById('backToTop')){
      const btn = document.createElement('button');
      btn.id = 'backToTop';
      btn.setAttribute('aria-label','Back to top');
      btn.innerHTML = '▲';
      btn.addEventListener('click', ()=> window.scrollTo({ top: 0, behavior: 'smooth' }));
      document.body.appendChild(btn);
    }

    // Inject Sticky CTA
    if(!document.querySelector('.sticky-cta')){
      const cta = document.createElement('div');
      cta.className = 'sticky-cta';
      const body = document.body;
      const text = body.getAttribute('data-cta-text') || 'Winter Sale — 30% Off';
      const href = body.getAttribute('data-cta-link') || './products.html';
      cta.innerHTML = `<i class="fa-solid fa-snowflake" aria-hidden="true"></i><span>${text}</span> <a href="${href}" aria-label="Shop CTA">Shop Now</a>`;
      document.body.appendChild(cta);
    }

    // Preloader injection
    if(!document.getElementById('preloader')){
      const pre = document.createElement('div');
      pre.id = 'preloader';
      pre.innerHTML = '<div class="dots"><span class="d"></span><span class="d"></span><span class="d"></span></div>';
      document.body.appendChild(pre);
      window.addEventListener('load', ()=>{
        setTimeout(()=>{
          pre.classList.add('hide');
          setTimeout(()=> pre.remove(), 500);
        }, 400);
      });
    }

    // Page transition overlay + link interception
    if(!document.querySelector('.page-transition-overlay')){
      const ov = document.createElement('div');
      ov.className = 'page-transition-overlay';
      document.body.appendChild(ov);
      function isInternal(href){
        try { const u = new URL(href, location.href); return u.origin === location.origin; } catch(e){ return false; }
      }
      document.addEventListener('click', (e)=>{
        const a = e.target.closest('a');
        if(!a) return;
        const href = a.getAttribute('href') || '';
        if(a.target === '_blank' || a.hasAttribute('download')) return;
        if(href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
        if(!isInternal(href)) return;
        e.preventDefault();
        ov.classList.add('show');
        setTimeout(()=>{ location.href = a.href; }, 220);
      });
    }

    // Ensure a global toast element exists
    if(!document.getElementById('popup')){
      const p = document.createElement('div');
      p.id = 'popup'; p.className = 'popup'; p.setAttribute('role','status'); p.setAttribute('aria-live','polite');
      p.style.display = 'none';
      document.body.appendChild(p);
    }
    function showToastGlobal(msg){
      const el = document.getElementById('popup');
      if(!el) return;
      el.textContent = msg;
      el.style.display = 'block'; el.style.animation = 'none';
      void el.offsetWidth; el.style.animation = '';
      setTimeout(()=> el.style.display = 'none', 3500);
    }

    // Scroll progress bar injection
    if(!document.getElementById('scrollProgress')){
      const sp = document.createElement('div');
      sp.id = 'scrollProgress';
      document.body.appendChild(sp);
    }

    // Theme toggle (system/light/dark) — small button appended to header like earlier
    const header = document.querySelector('header');
    const THEME_KEY = 'mb_theme';
    function resolveTheme(mode){
      if(mode === 'system'){
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      }
      return mode;
    }
    function setTheme(mode){
      const actual = resolveTheme(mode);
      document.documentElement.setAttribute('data-theme', actual);
      try { localStorage.setItem(THEME_KEY, mode); } catch(e){}
      const t = document.getElementById('themeToggle');
      if(t){
        const icon = mode === 'system' ? '<i class="fa-solid fa-display"></i>' : (actual === 'dark' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>');
        t.innerHTML = icon;
        t.setAttribute('aria-label', mode === 'system' ? 'Use system theme' : (actual === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'));
        t.title = mode === 'system' ? 'Theme: System' : (actual === 'dark' ? 'Theme: Dark' : 'Theme: Light');
      }
    }
    (function initTheme(){
      let saved = null; try { saved = localStorage.getItem(THEME_KEY); } catch(e){}
      const mode = saved || 'system';
      setTheme(mode);
      let btn = document.getElementById('themeToggle');
      if(!btn){
        btn = document.createElement('button');
        btn.id = 'themeToggle'; btn.className = 'theme-toggle'; btn.title = 'Toggle theme (system/light/dark)';
        btn.innerHTML = (mode === 'system') ? '<i class="fa-solid fa-display"></i>' : (resolveTheme(mode) === 'dark' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>');
        (header || document.body).appendChild(btn);
        btn.addEventListener('click', ()=>{
          const current = (localStorage.getItem(THEME_KEY) || 'system');
          const next = current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system';
          setTheme(next);
        });
      } else {
        btn.innerHTML = (mode === 'system') ? '<i class="fa-solid fa-display"></i>' : (resolveTheme(mode) === 'dark' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>');
      }
      // Delegate as backup (works for dynamically added buttons)
      document.addEventListener('click', (e)=>{
        const b = e.target.closest('#themeToggle');
        if(!b) return;
        const current = (localStorage.getItem(THEME_KEY) || 'system');
        const next = current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system';
        setTheme(next);
      });
    })();

    // Mobile navigation (hamburger + drawer)
    if(!document.querySelector('.mobile-nav')){
      let btn = document.getElementById('menuToggle');
      if(!btn){
        btn = document.createElement('button');
        btn.id = 'menuToggle'; btn.className = 'menu-toggle'; btn.setAttribute('aria-label','Open menu');
        btn.innerHTML = '☰';
        if(header) header.insertBefore(btn, header.firstChild);
        else document.body.insertBefore(btn, document.body.firstChild);
      }
      const mobile = document.createElement('div');
      mobile.className = 'mobile-nav';
      mobile.innerHTML = '<div class="mobile-nav-panel"><button class="close" aria-label="Close">×</button><nav class="mobile-nav-content"></nav></div>';
      document.body.appendChild(mobile);
      const src = document.querySelector('header nav ul');
      const dest = mobile.querySelector('.mobile-nav-content');
      if(src && dest) dest.appendChild(src.cloneNode(true));
      const closeBtn = mobile.querySelector('.close');
      function open(){ mobile.classList.add('open'); document.body.style.overflow = 'hidden'; }
      function close(){ mobile.classList.remove('open'); document.body.style.overflow = ''; }
      btn.addEventListener('click', open);
      closeBtn.addEventListener('click', close);
      mobile.addEventListener('click', (e)=>{ if(e.target === mobile) close(); });
      mobile.querySelectorAll('a').forEach(a=> a.addEventListener('click', close));
      document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });
    }

    // Contact FAB and modal injection (can be disabled per page with data-no-contact-fab)
    if(!document.body.hasAttribute('data-no-contact-fab')){
      if(!document.querySelector('.contact-fab')){
        const fab = document.createElement('button');
        fab.className = 'contact-fab'; fab.setAttribute('aria-label','Contact us'); fab.title = 'Contact us';
        fab.innerHTML = '<i class="fa-solid fa-comments" aria-hidden="true"></i>';
        document.body.appendChild(fab);
        const modal = document.createElement('div');
        modal.className = 'contact-modal';
        modal.innerHTML = '<div class="contact-card"><header>Quick Contact</header><form><input type="text" id="qc_name" placeholder="Your name" required><input type="email" id="qc_email" placeholder="Email" required><textarea id="qc_msg" placeholder="Message" required></textarea><div class="actions"><button type="button" id="qc_cancel" class="btn-outline">Cancel</button><button type="submit" class="btn">Send</button></div></form></div>';
        document.body.appendChild(modal);
        function open(){ modal.classList.add('show'); document.body.style.overflow='hidden'; }
        function close(){ modal.classList.remove('show'); document.body.style.overflow=''; }
        fab.addEventListener('click', open);
        modal.addEventListener('click', (e)=>{ if(e.target === modal) close(); });
        modal.querySelector('#qc_cancel').addEventListener('click', close);
        modal.querySelector('form').addEventListener('submit', (e)=>{
          e.preventDefault();
          const name = modal.querySelector('#qc_name').value.trim();
          const email = modal.querySelector('#qc_email').value.trim();
          const msg = modal.querySelector('#qc_msg').value.trim();
          if(!name || !email || !msg){ showToastGlobal('⚠ Please complete all fields.'); return; }
          showToastGlobal(`✅ Thanks ${name}, we will reply to ${email}.`);
          close();
        });
        document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });
      }
    }

    // Magnetic hover for CTAs and category images
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!reduceMotion){
      const nodeList = document.querySelectorAll('button, .btn, .normal, .white, .cart-btn, .brand-link, .category img');
      const targets = Array.from(new Set(Array.from(nodeList)));
      targets.forEach(el => {
        el.classList.add('magnetic-target');
        const isImg = el.matches('.category img');
        const strength = isImg ? 14 : 10; // px
        el.addEventListener('mousemove', (e)=>{
          const r = el.getBoundingClientRect();
          const nx = (e.clientX - (r.left + r.width/2)) / (r.width/2);
          const ny = (e.clientY - (r.top + r.height/2)) / (r.height/2);
          const tx = Math.max(-1, Math.min(1, nx)) * strength;
          const ty = Math.max(-1, Math.min(1, ny)) * strength;
          const scale = el.matches('button, .btn, .normal, .white, .cart-btn') ? ' scale(1.02)' : '';
          el.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)${scale}`;
        });
        el.addEventListener('mouseleave', ()=>{ el.style.transform = ''; });
      });
    }
  });
})();
