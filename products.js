// products.js - Filters for products page and theme toggle wiring
(function(){
  const qs = (sel, ctx=document) => ctx.querySelector(sel);
  const qsa = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  const brandName = (key) => {
    const map = { 'gul-ahmed': 'Gul Ahmed', 'madam': 'Madam', 'khaadi': 'Khaadi', 'almirah': 'Almirah' };
    return map[key] || key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  function initThemeToggle(){
    const root = document.documentElement;
    const saved = localStorage.getItem('theme');
    if (saved) root.setAttribute('data-theme', saved);
    const btn = qs('#themeToggle');
    if (btn){
      const applyIcon = () => {
        const isDark = root.getAttribute('data-theme') === 'dark';
        btn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        btn.setAttribute('aria-pressed', String(isDark));
        btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
        btn.title = isDark ? 'Switch to light theme' : 'Switch to dark theme';
      };
      applyIcon();
      btn.addEventListener('click', () => {
        const isDark = root.getAttribute('data-theme') === 'dark';
        const next = isDark ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        applyIcon();
      });
    }
  }

  function initFilters(){
    const grid = qs('#productsGrid');
    if (!grid) return;
    const cards = qsa('.product-card', grid);
    const brandFiltersWrap = qs('#brandFilters');
    const minInput = qs('#minPrice');
    const maxInput = qs('#maxPrice');
    const clearBtn = qs('#clearFilters');
    const resultCount = qs('#resultCount');

    // Gather data
    const prices = cards.map(c => Number(c.dataset.price || 0));
    const priceMin = Math.min(...prices);
    const priceMax = Math.max(...prices);
    const brands = Array.from(new Set(cards.map(c => (c.dataset.brand || '').toLowerCase()))).filter(Boolean).sort();

    // Populate brand chips
    if (brandFiltersWrap){
      brandFiltersWrap.innerHTML = brands.map(b => {
        const id = `brand-${b}`;
        return `<label class="brand-chip" for="${id}"><input type="checkbox" id="${id}" name="brand" value="${b}"> ${brandName(b)}</label>`;
      }).join('');
    }

    // Initialize price inputs
    if (minInput && !minInput.value) minInput.value = String(priceMin);
    if (maxInput && !maxInput.value) maxInput.value = String(priceMax);
    minInput?.setAttribute('min', '0');
    maxInput?.setAttribute('min', '0');

    // Apply state from URL (supports ?brands=a,b and ?brand=a)
    const params = new URLSearchParams(location.search);
    let urlBrands = (params.get('brands') || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const single = (params.get('brand') || '').trim().toLowerCase();
    if (single) urlBrands = Array.from(new Set([...urlBrands, single]));
    // alias: khaddi -> khaadi
    urlBrands = urlBrands.map(b => b === 'khaddi' ? 'khaadi' : b);
    const urlMin = Number(params.get('min') || minInput?.value || priceMin);
    const urlMax = Number(params.get('max') || maxInput?.value || priceMax);
    if (minInput) minInput.value = String(urlMin);
    if (maxInput) maxInput.value = String(urlMax);
    if (urlBrands.length && brandFiltersWrap){
      urlBrands.forEach(b => {
        const cb = qs(`input[name="brand"][value="${b}"]`, brandFiltersWrap);
        if (cb) cb.checked = true;
      });
    }

    function currentSelectedBrands(){
      return qsa('input[name="brand"]:checked', brandFiltersWrap).map(cb => cb.value);
    }

    function applyFilters(pushState=true){
      const min = Number(minInput?.value || priceMin);
      const max = Number(maxInput?.value || priceMax);
      const selected = currentSelectedBrands();
      let shown = 0;
      cards.forEach(card => {
        const price = Number(card.dataset.price || 0);
        const brand = (card.dataset.brand || '').toLowerCase();
        const matchPrice = price >= min && price <= max;
        const matchBrand = selected.length ? selected.includes(brand) : true;
        const visible = matchPrice && matchBrand;
        // mark filter visibility; pagination will control final display
        card.dataset.filter = visible ? '1' : '0';
        if (visible) shown++;
      });
      if (resultCount){
        const total = cards.length;
        if (shown === total){ resultCount.textContent = `Showing all ${total} products`; }
        else if (shown === 0){ resultCount.textContent = `No results. Try adjusting filters.`; }
        else { resultCount.textContent = `Showing ${shown} of ${cards.length}`; }
      }
      if (pushState){
        const nextParams = new URLSearchParams();
        const sel = currentSelectedBrands();
        if (sel.length) nextParams.set('brands', sel.join(','));
        if (min !== priceMin) nextParams.set('min', String(min));
        if (max !== priceMax) nextParams.set('max', String(max));
        const nextUrl = `${location.pathname}${nextParams.toString() ? '?' + nextParams.toString() : ''}`;
        history.replaceState(null, '', nextUrl);
      }
      // Notify pagination to re-render on filter changes
      document.dispatchEvent(new CustomEvent('products:filtered'));
    }

    // Events
    brandFiltersWrap?.addEventListener('change', () => applyFilters());
    minInput?.addEventListener('input', () => applyFilters());
    maxInput?.addEventListener('input', () => applyFilters());
    clearBtn?.addEventListener('click', () => {
      qsa('input[name="brand"]:checked', brandFiltersWrap).forEach(cb => cb.checked = false);
      if (minInput) minInput.value = String(priceMin);
      if (maxInput) maxInput.value = String(priceMax);
      applyFilters();
    });

    // First paint
    applyFilters(false);
  }

  // Ratings UI for product cards
  function createStarIcons(avg){
    const rounded = Math.round(avg);
    let html = '';
    for(let i=1;i<=5;i++){
      html += `<i class="${i<=rounded ? 'fa-solid' : 'fa-regular'} fa-star"></i>`;
    }
    return html;
  }

  function initRatings(){
    const grid = qs('#productsGrid');
    if (!grid) return;
    const cards = qsa('.product-card', grid);
    const ratings = JSON.parse(localStorage.getItem('ratings')||'{}');
    cards.forEach(card => {
      const link = card.querySelector('a[href*="product.html?id="]');
      if(!link) return;
      const m = (link.getAttribute('href')||'').match(/id=(\d+)/);
      const id = m ? m[1] : null;
      if(!id) return;
      card.dataset.productId = id;
      const starsEl = card.querySelector('.stars');
      const data = ratings[id] || { sum: 0, count: 0 };
      const avg = data.count ? (data.sum / data.count) : 4.8;
      if (starsEl){
        starsEl.innerHTML = `
          <div class="rating-display" aria-label="Average rating ${avg.toFixed(1)} out of 5">
            ${createStarIcons(avg)} <span class="rating-value">${avg.toFixed(1)}</span> <span class="rating-count">(${data.count})</span>
          </div>
          <div class="rating-control" role="radiogroup" aria-label="Rate this product">
            ${[1,2,3,4,5].map(n=>`<button type="button" class="rate-star" data-value="${n}" aria-label="${n} star${n>1?'s':''}"><i class="fa-regular fa-star"></i></button>`).join('')}
          </div>`;
      }
      const control = card.querySelector('.rating-control');
      control?.addEventListener('click', (ev) => {
        const btn = ev.target.closest('.rate-star');
        if(!btn) return;
        ev.preventDefault(); ev.stopPropagation();
        const val = Number(btn.dataset.value||0);
        // Visual: fill stars up to selected
        const starsBtns = Array.from(control.querySelectorAll('.rate-star'));
        starsBtns.forEach(b => {
          const iEl = b.querySelector('i');
          const v = Number(b.dataset.value||0);
          if (v <= val){
            b.classList.add('selected');
            if (iEl) { iEl.classList.remove('fa-regular'); iEl.classList.add('fa-solid'); }
          } else {
            b.classList.remove('selected');
            if (iEl) { iEl.classList.add('fa-regular'); iEl.classList.remove('fa-solid'); }
          }
        });
        // Persist rating average
        const store = JSON.parse(localStorage.getItem('ratings')||'{}');
        const cur = store[id] || { sum: 0, count: 0 };
        cur.sum += val; cur.count += 1; store[id] = cur;
        localStorage.setItem('ratings', JSON.stringify(store));
        const avg2 = cur.sum / cur.count;
        const display = card.querySelector('.rating-display');
        if(display) display.innerHTML = `${createStarIcons(avg2)} <span class=\"rating-value\">${avg2.toFixed(1)}</span> <span class=\"rating-count\">(${cur.count})</span>`;
      });
    });
  }

  // Pagination for products grid
  function initPagination(){
    const grid = qs('#productsGrid');
    const pager = qs('#pagination');
    if (!grid || !pager) return;
    const cards = qsa('.product-card', grid);
    const pageSize = 12;
    let current = 1;

    function visibleCards(){
      return cards.filter(c => (c.dataset.filter || '1') !== '0');
    }

    function render(){
      const list = visibleCards();
      const total = list.length;
      const pages = Math.max(1, Math.ceil(total / pageSize));
      if (current > pages) current = pages;
      // Hide all; pagination decides visibility
      cards.forEach(c => { c.style.display = 'none'; });
      list.forEach((c,i) => {
        const pageIndex = Math.floor(i / pageSize) + 1;
        if (pageIndex === current) c.style.display = '';
      });
      // Controls
      pager.innerHTML = `
        <button class="page-btn prev" data-page="${Math.max(1,current-1)}" ${current===1?'disabled':''} aria-label="Previous page">‹</button>
        ${Array.from({length: pages}, (_,i)=>i+1).map(p => `<button class=\"page-btn ${p===current?'active':''}\" ${p===current?'aria-current=\"page\"':''} data-page=\"${p}\" aria-label=\"Go to page ${p}\">${p}</button>`).join('')}
        <button class="page-btn next" data-page="${Math.min(pages,current+1)}" ${current===pages?'disabled':''} aria-label="Next page">›</button>`;
      // Update the result counter to show range
      const rc = document.querySelector('#resultCount');
      if (rc){
        const start = list.length ? (current - 1) * pageSize + 1 : 0;
        const end = list.length ? Math.min(current * pageSize, list.length) : 0;
        rc.textContent = list.length ? `Showing ${start}–${end} of ${list.length} products` : `No results. Try adjusting filters.`;
      }
    }

    function onClick(e){
      const btn = e.target.closest('button.page-btn');
      if (!btn) return;
      const p = Number(btn.dataset.page);
      if (!p) return;
      current = p; render();
      // Smooth scroll to products section (avoid jumping to very top)
      const section = grid.closest('section') || grid;
      const headerOffset = 100;
      const y = section.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      // Focus active button for accessibility
      setTimeout(()=>{
        const active = document.querySelector('#pagination .page-btn.active');
        active?.focus();
      }, 50);
    }

    pager.addEventListener('click', onClick);
    document.addEventListener('products:filtered', () => { current = 1; render(); });
    // Initial
    render();
  }

  function initCardCart(){
    const grid = qs('#productsGrid');
    if (!grid) return;
    const cards = qsa('.product-card', grid);
    cards.forEach(card => {
      if (card.querySelector('.add-to-cart-compact')) return;
      const link = card.querySelector('a[href*="product.html?id="]');
      if (!link) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'add-to-cart-compact';
      btn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Add to Cart';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const href = link.getAttribute('href') || '';
        const m = href.match(/id=(\d+)/);
        const id = m ? m[1] : null;
        const titleEl = card.querySelector('.product-title');
        const price = Number(card.dataset.price || 0);
        const imgEl = card.querySelector('img');
        const item = {
          id: id || (titleEl?.textContent || '').trim(),
          title: (titleEl?.textContent || '').trim(),
          price: price,
          img: imgEl ? imgEl.getAttribute('src') : '',
          size: '',
          qty: 1
        };
        let cart = [];
        try { cart = JSON.parse(localStorage.getItem('cart')) || []; } catch(e){}
        cart.push(item);
        try { localStorage.setItem('cart', JSON.stringify(cart)); } catch(e){}
        // notify header badge
        try { document.dispatchEvent(new CustomEvent('cart:updated')); } catch(e){}
        const toast = document.createElement('div');
        toast.className = 'popup success';
        toast.style.position = 'fixed';
        toast.style.right = '18px';
        toast.style.bottom = '22px';
        toast.style.color = '#fff';
        toast.style.padding = '10px 14px';
        toast.style.borderRadius = '10px';
        toast.style.zIndex = '3000';
        toast.textContent = '✅ Added to cart!';
        document.body.appendChild(toast);
        setTimeout(()=> toast.remove(), 1800);
      });
      link.insertAdjacentElement('afterend', btn);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initFilters();
    initRatings();
    initPagination();
    initCardCart();
    document.addEventListener('products:filtered', () => { initCardCart(); });
  });
})();
