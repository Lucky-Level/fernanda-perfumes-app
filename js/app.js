/* =============================================================
   FERNANDA · PUBLIC STOREFRONT (Supabase-backed)
   ============================================================= */

const App = (() => {
  let products = [];
  let cart = DataStore.cart();
  let favs = DataStore.favs();
  let promos = [];
  let customer = DataStore.customer();
  let activeView = 'home';
  let activeFilter = 'all';
  let activeProductId = null;
  let searchTerm = '';
  let appliedPromo = null;
  let promoBannerDismissed = sessionStorage.getItem('fpa.promoDismiss') === '1';
  let loading = true;

  const WHATSAPP_NUMBER = '';

  // ---------- helpers ----------
  function toast(msg) {
    const host = document.getElementById('toast-host');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(-12px)'; }, 2200);
    setTimeout(() => el.remove(), 2700);
  }
  function activePromo() {
    return promos.find(p => p.active);
  }
  function starsHTML(rating) {
    const r = Math.round(rating);
    let html = '<span class="stars" aria-label="' + rating + ' estrelas">';
    for (let i = 1; i <= 5; i++) {
      html += `<span class="s${i <= r ? '' : ' muted'}" style="--star-mask: url('data:image/svg+xml;utf8,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 24 24&quot;><path d=&quot;m12 2 2.9 6.6 7.1.8-5.3 4.8 1.6 7-6.3-3.7-6.3 3.7 1.6-7L2 9.4l7.1-.8L12 2Z&quot;/></svg>')"></span>`;
    }
    return html + '</span>';
  }

  function bottleSVG(color, accent, size = 220) {
    return `
    <svg viewBox="0 0 200 280" width="${size}" height="${size * 1.4}" aria-hidden="true">
      <defs>
        <linearGradient id="g-${color.slice(1)}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${color}"/>
          <stop offset="1" stop-color="#0a0a0a"/>
        </linearGradient>
        <linearGradient id="cap-${accent.slice(1)}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#F0DAA0"/>
          <stop offset="0.5" stop-color="${accent}"/>
          <stop offset="1" stop-color="#7a5e2f"/>
        </linearGradient>
        <radialGradient id="shine-${accent.slice(1)}" cx="40%" cy="30%" r="40%">
          <stop offset="0" stop-color="rgba(255,255,255,0.55)"/>
          <stop offset="1" stop-color="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="262" rx="60" ry="6" fill="rgba(0,0,0,0.55)"/>
      <rect x="78" y="6" width="44" height="22" rx="3" fill="url(#cap-${accent.slice(1)})"/>
      <rect x="85" y="26" width="30" height="14" fill="#1a130a"/>
      <path d="M50 56 C50 46, 60 40, 75 40 L125 40 C140 40, 150 46, 150 56 L150 232 C150 250, 138 260, 122 260 L78 260 C62 260, 50 250, 50 232 Z"
            fill="url(#g-${color.slice(1)})" stroke="${accent}" stroke-width="1.2"/>
      <path d="M50 56 C50 46, 60 40, 75 40 L125 40 C140 40, 150 46, 150 56 L150 232 C150 250, 138 260, 122 260 L78 260 C62 260, 50 250, 50 232 Z"
            fill="url(#shine-${accent.slice(1)})" opacity="0.55"/>
      <rect x="64" y="120" width="72" height="80" rx="3" fill="rgba(200,169,107,0.06)" stroke="${accent}" stroke-width="0.8"/>
      <text x="100" y="156" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="14" fill="${accent}" letter-spacing="3">FERNANDA</text>
      <text x="100" y="178" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" fill="${accent}" letter-spacing="3">PERFUMES ARABES</text>
      <line x1="80" y1="186" x2="120" y2="186" stroke="${accent}" stroke-width="0.6" opacity="0.8"/>
    </svg>`;
  }

  function renderBadges(p) {
    let html = '';
    if (p.kind === 'preorder') html += '<span class="badge badge-preorder">Encomenda . ' + p.preorderDays + ' dias</span>';
    else html += '<span class="badge badge-stock">Pronta entrega</span>';
    if (p.tags.includes('bestseller')) html += '<span class="badge badge-bestseller">Best Seller</span>';
    if (p.tags.includes('exclusive')) html += '<span class="badge badge-exclusive">Arabe Exclusivo</span>';
    if (p.tags.includes('new')) html += '<span class="badge badge-new">Novo</span>';
    if (p.oldPrice) {
      const off = Math.round((1 - p.price / p.oldPrice) * 100);
      html += `<span class="badge badge-discount">-${off}%</span>`;
    }
    return html;
  }

  function perfumeCardHTML(p) {
    const isFav = favs.includes(p.id);
    return `
    <article class="card perfume-card glow-hover rise-in" data-id="${p.id}">
      <div class="media">
        <div class="bottle">${bottleSVG(p.color, p.accent, 160)}</div>
        <div class="badges">${renderBadges(p)}</div>
        <button class="fav ${isFav ? 'active' : ''}" data-action="fav" aria-label="Favoritar">
          ${isFav ? Icons.heartFill : Icons.heart}
        </button>
      </div>
      <div class="info">
        <span class="brand">${p.brand}</span>
        <span class="name">${p.name}</span>
        <span class="text-lo" style="font-size:var(--fs-xs)">${p.family}</span>
        <div class="row">
          <div class="price">
            ${p.oldPrice ? `<span class="old">${BRL(p.oldPrice)}</span>` : ''}
            <span class="now">${BRL(p.price)}</span>
            ${p.kind === 'preorder' ? `<span class="text-lo" style="font-size:var(--fs-xs)">sinal a partir de ${BRL(p.price * p.depositPct / 100)}</span>` : ''}
          </div>
          <span class="rating">${Icons.star} ${p.rating.toFixed(1)}</span>
        </div>
      </div>
    </article>`;
  }

  // ---------- PROMO BANNER ----------
  function promoBannerHTML() {
    const promo = activePromo();
    if (!promo || promoBannerDismissed) return '';
    return `
      <div class="promo-strip rise-in">
        <span class="ic">${Icons.spark || ''}</span>
        <div class="promo-strip__text">
          <strong>${promo.title}</strong>
          <span class="text-lo">. cupom <code>${promo.code}</code> ${promo.validUntil ? '. valido ate ' + new Date(promo.validUntil).toLocaleDateString('pt-BR') : ''}</span>
        </div>
        <button class="promo-strip__close" data-action="dismiss-promo" aria-label="Fechar">${Icons.close}</button>
      </div>
    `;
  }

  // ---------- LOADING ----------
  function renderLoading() {
    return `
      <section class="section" style="text-align:center;padding:var(--sp-10) 0">
        <div style="width:48px;height:48px;border:2px solid var(--color-gold);border-top-color:transparent;border-radius:50%;margin:0 auto;animation:spin 0.8s linear infinite"></div>
        <p class="text-lo mt-6">Carregando catalogo...</p>
      </section>
    `;
  }

  // ---------- VIEW · HOME ----------
  function renderHome() {
    if (loading) return renderLoading();
    const bestsellers = products.filter(p => p.tags.includes('bestseller'));
    const exclusives  = products.filter(p => p.tags.includes('exclusive'));
    const preorders   = products.filter(p => p.kind === 'preorder');

    return `
      ${promoBannerHTML()}
      <section class="banner rise-in">
        <svg class="arabesque" viewBox="0 0 200 200" aria-hidden="true">
          <g fill="none" stroke="#C8A96B" stroke-width="0.7">
            <circle cx="100" cy="100" r="80"/>
            <circle cx="100" cy="100" r="60"/>
            <circle cx="100" cy="100" r="40"/>
            <path d="M100 20 C140 60, 140 140, 100 180 C60 140, 60 60, 100 20Z"/>
            <path d="M20 100 C60 60, 140 60, 180 100 C140 140, 60 140, 20 100Z"/>
          </g>
        </svg>
        <div class="content">
          <span class="eyebrow">Colecao 2026 . Dubai Edition</span>
          <h1 class="mt-4">Perfumaria arabe, <em>com a assinatura da Fernanda</em>.</h1>
          <p class="lead">Fragancias autenticas, importadas e selecionadas para voce sentir o oriente em cada borrifo. <strong style="color:var(--color-gold)">Pronta entrega</strong> ou <strong style="color:var(--color-gold)">encomenda sob medida</strong>.</p>
          <div class="ctas">
            <button class="btn btn-primary btn-lg" data-go="catalog">Explorar colecao ${Icons.arrow}</button>
            <button class="btn btn-secondary btn-lg" data-go="bestsellers">Mais desejados</button>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <span class="eyebrow">Selecionados</span>
            <h2 class="mt-4">Os <em>mais desejados</em></h2>
          </div>
          <button class="btn btn-secondary btn-sm" data-go="catalog">Ver todos</button>
        </div>
        <div class="carousel">
          <div class="carousel-track">
            ${bestsellers.map(perfumeCardHTML).join('')}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="premium-card rise-in">
          <div class="inner">
            <div class="flex items-center justify-between gap-5" style="flex-wrap:wrap">
              <div>
                <span class="eyebrow">Encomenda sob medida</span>
                <h2 class="mt-4">Nao achou em estoque? <em>Encomende</em></h2>
                <p class="text-md mt-4" style="max-width:560px">Reservamos seu perfume com importacao direta de Dubai. Pagamento com <strong style="color:var(--color-gold)">50% de sinal</strong> e o restante na chegada. Prazo medio de 14-21 dias.</p>
              </div>
              <button class="btn btn-primary" data-go="preorders">Ver encomendas</button>
            </div>
          </div>
        </div>
      </section>

      ${preorders.length ? `
      <section class="section">
        <div class="section-head">
          <div>
            <span class="eyebrow">Sob encomenda</span>
            <h2 class="mt-4"><em>Importacao direta</em></h2>
          </div>
        </div>
        <div class="grid grid-products">
          ${preorders.map(perfumeCardHTML).join('')}
        </div>
      </section>` : ''}

      <section class="section">
        <div class="section-head">
          <div>
            <span class="eyebrow">Edicao Limitada</span>
            <h2 class="mt-4"><em>Arabe Exclusivo</em></h2>
          </div>
        </div>
        <div class="grid grid-products">
          ${exclusives.map(perfumeCardHTML).join('')}
        </div>
      </section>
    `;
  }

  // ---------- VIEW · CATALOG ----------
  function filteredProducts() {
    let list = products;
    if (activeFilter === 'stock') list = list.filter(p => p.kind === 'stock');
    else if (activeFilter === 'preorder') list = list.filter(p => p.kind === 'preorder');
    else if (activeFilter !== 'all') list = list.filter(p => p.tags.includes(activeFilter));
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.family.toLowerCase().includes(q)
      );
    }
    return list;
  }

  function renderCatalog() {
    if (loading) return renderLoading();
    const list = filteredProducts();
    return `
      ${promoBannerHTML()}
      <section class="section">
        <span class="eyebrow">Catalogo completo</span>
        <h2 class="mt-4">Descubra sua <em>assinatura olfativa</em></h2>

        <div class="mt-6 flex gap-2" style="flex-wrap:wrap">
          <button class="chip ${activeFilter==='all'?'active':''}" data-filter="all">Todos</button>
          <button class="chip ${activeFilter==='stock'?'active':''}" data-filter="stock">Pronta entrega</button>
          <button class="chip ${activeFilter==='preorder'?'active':''}" data-filter="preorder">Encomenda</button>
          <button class="chip ${activeFilter==='bestseller'?'active':''}" data-filter="bestseller">Best Sellers</button>
          <button class="chip ${activeFilter==='exclusive'?'active':''}" data-filter="exclusive">Arabe Exclusivo</button>
          <button class="chip ${activeFilter==='new'?'active':''}" data-filter="new">Novidades</button>
        </div>

        <div class="grid grid-products mt-8">
          ${list.length ? list.map(perfumeCardHTML).join('') : `
            <div class="card" style="grid-column:1/-1;padding:var(--sp-8);text-align:center;">
              <p class="text-lo">Nenhum perfume encontrado para sua busca.</p>
            </div>
          `}
        </div>
      </section>
    `;
  }

  // ---------- VIEW · PRODUCT ----------
  function renderProduct() {
    const p = products.find(x => x.id === activeProductId);
    if (!p) return renderHome();
    const isFav = favs.includes(p.id);
    const isPreorder = p.kind === 'preorder';
    return `
      <section class="section">
        <button class="btn btn-secondary btn-sm" data-go="catalog" style="transform:scaleX(-1)">${Icons.arrow}</button>

        <div class="grid grid-2-lg mt-6" style="gap:var(--sp-8); align-items:center;">
          <div class="product-stage rise-in">
            <div class="bottle-stage">${bottleSVG(p.color, p.accent, 280)}</div>
            <div class="badges" style="position:absolute;top:20px;left:20px;display:flex;flex-direction:column;gap:8px;">
              ${renderBadges(p)}
            </div>
          </div>

          <div class="rise-in">
            <span class="eyebrow">${p.brand} . ${p.family}</span>
            <h1 class="mt-4" style="font-size:clamp(var(--fs-2xl), 5vw, var(--fs-4xl));">${p.name}</h1>

            <div class="flex items-center gap-3 mt-4">
              ${starsHTML(p.rating)}
              <span class="text-md" style="font-size:var(--fs-sm)">${p.rating.toFixed(1)} . ${p.reviews} avaliacoes</span>
            </div>

            <p class="text-md mt-6" style="line-height:var(--lh-loose)">${p.description}</p>

            <div class="notes mt-6">
              <div class="note"><span class="label">Saida</span><div class="value">${p.notes.top}</div></div>
              <div class="note"><span class="label">Coracao</span><div class="value">${p.notes.heart}</div></div>
              <div class="note"><span class="label">Fundo</span><div class="value">${p.notes.base}</div></div>
            </div>

            ${isPreorder ? `
              <div class="card mt-6" style="padding:var(--sp-5); border-color:var(--color-gold)">
                <div class="flex gap-3 items-center" style="color:var(--color-gold)">
                  ${Icons.package}
                  <strong>Disponivel por encomenda</strong>
                </div>
                <p class="text-md mt-3" style="font-size:var(--fs-sm)">
                  Importacao direta . prazo medio de <strong>${p.preorderDays} dias</strong>.<br>
                  Pague <strong>${p.depositPct}% de sinal</strong> agora (${BRL(p.price * p.depositPct / 100)}) e o restante na chegada do produto.
                </p>
              </div>
            ` : `
              <div class="card mt-6" style="padding:var(--sp-5)">
                <div class="flex gap-3 items-center" style="color:var(--color-success)">
                  ${Icons.bag}
                  <strong>Pronta entrega . ${p.stock} unidades em estoque</strong>
                </div>
                <p class="text-md mt-3" style="font-size:var(--fs-sm)">Envio em ate 1 dia util apos confirmacao.</p>
              </div>
            `}

            <div class="flex items-center gap-4 mt-8" style="flex-wrap:wrap">
              <div class="price">
                ${p.oldPrice ? `<div class="text-lo" style="text-decoration:line-through;font-size:var(--fs-sm)">${BRL(p.oldPrice)}</div>` : ''}
                <div style="font-family:var(--font-serif);font-size:var(--fs-3xl);color:var(--color-gold);line-height:1">${BRL(p.price)}</div>
                <div class="text-lo" style="font-size:var(--fs-xs)">em ate 6x sem juros</div>
              </div>
              <div class="flex gap-3" style="flex:1;min-width:220px">
                <button class="btn btn-primary btn-block btn-lg" data-action="add-to-cart" data-id="${p.id}">${Icons.bag} ${isPreorder ? 'Reservar encomenda' : 'Adicionar ao carrinho'}</button>
                <button class="btn-icon" data-action="fav" data-id="${p.id}" aria-label="Favoritar">
                  ${isFav ? Icons.heartFill : Icons.heart}
                </button>
                <button class="btn-icon" data-action="share" data-id="${p.id}" aria-label="Compartilhar">${Icons.share}</button>
              </div>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div>
          <span class="eyebrow">Avaliacoes da comunidade</span>
          <h2 class="mt-4">O que dizem nossas <em>clientes</em></h2>

          <div class="mt-6" style="max-width:760px">
            ${[
              { name: 'Mariana S.', stars: 5, text: 'Chegou impecavel e o aroma e exatamente como descrito. Fixacao maravilhosa, virei cliente!', when: 'ha 3 dias' },
              { name: 'Camila P.',  stars: 5, text: 'Embalagem premium, parece presente. Fernanda atendeu super atenciosa no WhatsApp.', when: 'ha 1 semana' },
              { name: 'Leticia A.', stars: 4, text: 'Adorei. So achei a saida um pouco mais leve do que esperava, mas a evolucao e incrivel.', when: 'ha 2 semanas' }
            ].map(r => `
              <div class="review">
                <div class="who">
                  <div class="avatar">${r.name[0]}</div>
                  <div>
                    <div>${r.name}</div>
                    <div class="meta">${starsHTML(r.stars)} . ${r.when}</div>
                  </div>
                </div>
                <div class="body">${r.text}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  // ---------- VIEW · CART ----------
  function cartLines() {
    return cart.map(item => ({ ...item, product: products.find(p => p.id === item.id) })).filter(x => x.product);
  }
  function cartTotal() {
    return cartLines().reduce((s, i) => s + i.product.price * i.qty, 0);
  }
  function cartHasPreorder() {
    return cartLines().some(i => i.product.kind === 'preorder');
  }

  function renderCart() {
    const lines = cartLines();
    if (!lines.length) {
      return `
        <section class="section" style="text-align:center;padding:var(--sp-10) 0">
          <div style="width:64px;height:64px;margin:0 auto var(--sp-5);color:var(--color-gold)">${Icons.bag}</div>
          <span class="eyebrow">Sua sacola</span>
          <h2 class="mt-4">Ainda <em>vazia</em></h2>
          <p class="text-md mt-4">Comece explorando nossa colecao de perfumes arabes.</p>
          <button class="btn btn-primary mt-6" data-go="catalog">Ver colecao</button>
        </section>
      `;
    }
    const subtotal = cartTotal();
    const promo = appliedPromo;
    const discount = promo ? (subtotal * (promo.discountPct || 0) / 100) : 0;
    const total = subtotal - discount;
    const hasPreorder = cartHasPreorder();

    return `
      <section class="section">
        <span class="eyebrow">Sua sacola</span>
        <h2 class="mt-4">Confira sua <em>selecao</em></h2>

        <div class="grid mt-6" style="gap:var(--sp-3)">
          ${lines.map(({ product: p, qty }) => `
            <div class="line-item">
              <div class="thumb">${bottleSVG(p.color, p.accent, 60)}</div>
              <div style="flex:1;display:flex;flex-direction:column;gap:4px;justify-content:center;min-width:0">
                <span class="text-gold" style="font-size:var(--fs-xs);letter-spacing:var(--tracking-wider);text-transform:uppercase">${p.brand}</span>
                <strong style="font-family:var(--font-serif);font-size:var(--fs-lg)">${p.name}</strong>
                <span class="text-lo" style="font-size:var(--fs-xs)">${p.family}</span>
                <div class="mt-2">
                  ${p.kind === 'preorder'
                    ? `<span class="badge badge-preorder">Encomenda . ${p.preorderDays} dias</span>`
                    : `<span class="badge badge-stock">Pronta entrega</span>`}
                </div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:var(--sp-2);justify-content:center">
                <div style="font-family:var(--font-serif);color:var(--color-gold);font-size:var(--fs-lg)">${BRL(p.price * qty)}</div>
                <div class="flex gap-2 items-center">
                  <button class="btn-icon" style="width:32px;height:32px" data-action="dec" data-id="${p.id}">-</button>
                  <span style="min-width:24px;text-align:center">${qty}</span>
                  <button class="btn-icon" style="width:32px;height:32px" data-action="inc" data-id="${p.id}">+</button>
                </div>
                <button class="text-lo" data-action="remove" data-id="${p.id}" style="font-size:var(--fs-xs)">remover</button>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="card mt-6" style="padding:var(--sp-6)">
          <div class="field">
            <label>Cupom de desconto</label>
            <div class="flex gap-2">
              <input id="promo-code" class="input" placeholder="Tem um cupom? Insira aqui" value="${promo ? promo.code : ''}">
              <button class="btn btn-secondary" data-action="apply-promo">Aplicar</button>
            </div>
          </div>

          <div class="flex justify-between items-center mt-6">
            <span class="text-md">Subtotal</span>
            <span style="color:var(--color-text-hi)">${BRL(subtotal)}</span>
          </div>
          ${promo ? `
            <div class="flex justify-between items-center mt-3" style="color:var(--color-success)">
              <span>Cupom ${promo.code} (-${promo.discountPct}%)</span>
              <span>- ${BRL(discount)}</span>
            </div>` : ''}
          <div class="flex justify-between items-center mt-3">
            <span class="text-md">Frete</span>
            <span class="text-md">a calcular</span>
          </div>
          <div class="divider" style="margin:var(--sp-5) 0"></div>
          <div class="flex justify-between items-center">
            <span style="font-family:var(--font-serif);font-size:var(--fs-xl)">Total</span>
            <span style="font-family:var(--font-serif);font-size:var(--fs-2xl);color:var(--color-gold)">${BRL(total)}</span>
          </div>
          ${hasPreorder ? `
            <p class="text-lo mt-4" style="font-size:var(--fs-xs)">
              Sua sacola contem encomendas. No checkout voce podera pagar o <strong style="color:var(--color-gold)">total agora</strong> ou apenas <strong style="color:var(--color-gold)">o sinal (50%)</strong> e o restante na chegada do produto.
            </p>
          ` : ''}
          <button class="btn btn-primary btn-block btn-lg mt-5" data-action="checkout">Finalizar pedido</button>
          <p class="text-lo mt-4" style="text-align:center;font-size:var(--fs-xs)">Voce sera atendida diretamente pela Fernanda no WhatsApp</p>
        </div>
      </section>
    `;
  }

  // ---------- VIEW · FAVORITES ----------
  function renderFavs() {
    const list = products.filter(p => favs.includes(p.id));
    return `
      <section class="section">
        <span class="eyebrow">Sua wishlist</span>
        <h2 class="mt-4">Meus <em>favoritos</em></h2>
        ${list.length ? `
          <div class="grid grid-products mt-6">
            ${list.map(perfumeCardHTML).join('')}
          </div>
        ` : `
          <p class="text-lo mt-6">Toque no coracao de qualquer perfume para guarda-lo aqui.</p>
        `}
      </section>
    `;
  }

  // ---------- VIEW · ACCOUNT ----------
  function renderAccount() {
    const c = customer || {};
    return `
      <section class="section">
        <span class="eyebrow">Conta</span>
        <h2 class="mt-4">Bem-vinda a <em>boutique Fernanda</em></h2>

        <div class="grid grid-2-lg mt-6">
          <div class="card" style="padding:var(--sp-7)">
            <h3 style="font-size:var(--fs-xl)">Seus dados</h3>
            <p class="text-md mt-3" style="font-size:var(--fs-sm)">Mantemos um cadastro minimo para agilizar suas proximas compras.</p>
            ${c.name ? `
              <div class="mt-5">
                <div class="text-lo" style="font-size:var(--fs-xs);letter-spacing:var(--tracking-wider);text-transform:uppercase">Nome</div>
                <div style="font-family:var(--font-serif);font-size:var(--fs-lg)">${c.name}</div>
              </div>
              <div class="mt-4">
                <div class="text-lo" style="font-size:var(--fs-xs);letter-spacing:var(--tracking-wider);text-transform:uppercase">Telefone</div>
                <div style="font-family:var(--font-serif);font-size:var(--fs-lg)">${c.phone}</div>
              </div>
              <div class="flex gap-3 mt-6">
                <button class="btn btn-secondary" data-action="edit-customer">Editar</button>
                <button class="btn btn-dark" data-action="logout-customer">Sair</button>
              </div>
            ` : `
              <p class="text-lo mt-4" style="font-size:var(--fs-sm)">Voce ainda nao tem dados salvos. Eles serao pedidos ao finalizar o primeiro pedido.</p>
              <button class="btn btn-primary mt-5" data-action="edit-customer">Cadastrar agora</button>
            `}
          </div>
          <div class="card" style="padding:var(--sp-7)">
            <h3 style="font-size:var(--fs-xl)">Atendimento direto</h3>
            <p class="text-md mt-4">Fale com a Fernanda pelo WhatsApp. Consultoria olfativa gratuita.</p>
            <button class="btn btn-primary mt-6" data-action="contact">Abrir WhatsApp</button>
          </div>
          <div class="card" style="padding:var(--sp-7); grid-column: 1 / -1">
            <h3 style="font-size:var(--fs-xl)">Acesso administrativo</h3>
            <p class="text-md mt-4">Area restrita para a equipe Fernanda Perfumes Arabes.</p>
            <a href="./admin.html" class="btn btn-dark mt-6" style="display:inline-flex">Entrar no painel</a>
          </div>
        </div>
      </section>
    `;
  }

  // ---------- ROUTING ----------
  function render() {
    const root = document.getElementById('view');
    let html = '';
    switch (activeView) {
      case 'home': html = renderHome(); break;
      case 'catalog': html = renderCatalog(); break;
      case 'product': html = renderProduct(); break;
      case 'cart': html = renderCart(); break;
      case 'favs': html = renderFavs(); break;
      case 'account': html = renderAccount(); break;
      default: html = renderHome();
    }
    root.innerHTML = html;
    document.querySelectorAll('.bottom-nav .item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === activeView);
    });
    updateCartBadge();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function go(view, opts = {}) {
    activeView = view;
    if (opts.filter !== undefined) activeFilter = opts.filter;
    if (opts.id) activeProductId = opts.id;
    render();
  }

  function updateCartBadge() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const el = document.getElementById('cart-count');
    if (!el) return;
    if (count > 0) { el.textContent = count; el.style.display = 'inline-flex'; }
    else el.style.display = 'none';
  }

  // ---------- CART ----------
  function addToCart(id) {
    const existing = cart.find(c => c.id === id);
    if (existing) existing.qty += 1;
    else cart.push({ id, qty: 1 });
    DataStore.saveCart(cart);
    updateCartBadge();
    const p = products.find(x => x.id === id);
    toast(p && p.kind === 'preorder' ? 'Encomenda adicionada' : 'Adicionado a sacola');
  }
  function decCart(id) {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    item.qty -= 1;
    if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
    DataStore.saveCart(cart);
    render();
  }
  function incCart(id) {
    const item = cart.find(c => c.id === id);
    if (item) { item.qty += 1; DataStore.saveCart(cart); render(); }
  }
  function removeCart(id) {
    cart = cart.filter(c => c.id !== id);
    DataStore.saveCart(cart);
    render();
    toast('Removido da sacola');
  }
  function toggleFav(id) {
    if (favs.includes(id)) favs = favs.filter(x => x !== id);
    else favs.push(id);
    DataStore.saveFavs(favs);
    render();
  }
  function applyPromo() {
    const input = document.getElementById('promo-code');
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    const found = promos.find(p => p.active && p.code.toUpperCase() === code);
    if (found) { appliedPromo = found; toast('Cupom aplicado'); render(); }
    else { appliedPromo = null; toast('Cupom invalido ou expirado'); render(); }
  }

  // ---------- CHECKOUT MODAL ----------
  function openCheckoutModal() {
    const lines = cartLines();
    if (!lines.length) return;

    const subtotal = cartTotal();
    const discount = appliedPromo ? (subtotal * (appliedPromo.discountPct || 0) / 100) : 0;
    const total = subtotal - discount;
    const hasPreorder = cartHasPreorder();
    const preorderTotal = lines.filter(l => l.product.kind === 'preorder').reduce((s, l) => s + l.product.price * l.qty, 0);
    const stockTotal = lines.filter(l => l.product.kind === 'stock').reduce((s, l) => s + l.product.price * l.qty, 0);
    const minDeposit = lines.filter(l => l.product.kind === 'preorder')
                            .reduce((s, l) => s + l.product.price * l.qty * (l.product.depositPct / 100), 0);
    const partialTotal = stockTotal + minDeposit - discount * (stockTotal / Math.max(subtotal, 1));
    const c = customer || {};
    const host = document.getElementById('modal-host');

    host.innerHTML = `
      <div class="modal-backdrop open" id="modal-backdrop">
        <div class="modal" style="max-width:540px;max-height:90vh;overflow-y:auto">
          <div class="flex justify-between items-center mb-4">
            <h3 style="font-size:var(--fs-xl)">Finalizar pedido</h3>
            <button class="btn-icon" data-action="close-modal" style="width:36px;height:36px">${Icons.close}</button>
          </div>
          <span class="eyebrow">Identificacao</span>
          <p class="text-md mt-3" style="font-size:var(--fs-sm)">Para confirmarmos seu pedido, precisamos do seu nome completo e telefone com DDD.</p>

          <form id="checkout-form" class="flex flex-col gap-4 mt-5">
            <div class="field">
              <label>Nome completo</label>
              <input class="input" name="name" required minlength="3" placeholder="Ex: Mariana Souza" value="${c.name || ''}">
              <span class="hint" data-hint="name"></span>
            </div>
            <div class="field">
              <label>Telefone com DDD</label>
              <input class="input" name="phone" required placeholder="(81) 99999-9999" value="${c.phone || ''}" inputmode="numeric" autocomplete="tel-national">
              <span class="hint" data-hint="phone">Usado pra Fernanda confirmar o pedido pelo WhatsApp.</span>
            </div>

            ${hasPreorder ? `
              <div class="card" style="padding:var(--sp-5); border-color:var(--color-gold); margin-top:var(--sp-2)">
                <span class="eyebrow">Forma de pagamento</span>
                <div class="flex flex-col gap-3 mt-3">
                  <label class="pay-option">
                    <input type="radio" name="payment" value="full" checked>
                    <div>
                      <strong>Pagar total agora</strong>
                      <div class="text-lo" style="font-size:var(--fs-xs)">${BRL(total)} . agiliza a importacao</div>
                    </div>
                  </label>
                  <label class="pay-option">
                    <input type="radio" name="payment" value="partial">
                    <div>
                      <strong>Sinal agora . saldo na chegada</strong>
                      <div class="text-lo" style="font-size:var(--fs-xs)">${BRL(partialTotal)} hoje . saldo de ${BRL(total - partialTotal)} ao receber</div>
                    </div>
                  </label>
                </div>
              </div>
            ` : ''}

            <div class="card" style="padding:var(--sp-5)">
              <div class="flex justify-between"><span class="text-md">Subtotal</span><span>${BRL(subtotal)}</span></div>
              ${appliedPromo ? `<div class="flex justify-between mt-2" style="color:var(--color-success)"><span>Cupom ${appliedPromo.code}</span><span>- ${BRL(discount)}</span></div>` : ''}
              <div class="flex justify-between mt-2" style="font-family:var(--font-serif);font-size:var(--fs-lg);color:var(--color-gold)">
                <span>Total</span><span>${BRL(total)}</span>
              </div>
            </div>

            <div class="flex gap-3 mt-2">
              <button type="button" class="btn btn-secondary btn-block" data-action="close-modal">Cancelar</button>
              <button type="submit" class="btn btn-primary btn-block">Enviar via WhatsApp</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const form = document.getElementById('checkout-form');
    const phoneInput = form.elements['phone'];
    phoneInput.addEventListener('input', () => {
      phoneInput.value = formatPhone(phoneInput.value);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get('name') || '').toString().trim();
      const phone = (fd.get('phone') || '').toString().trim();
      const payment = (fd.get('payment') || 'full').toString();
      let ok = true;
      form.querySelectorAll('.input').forEach(i => i.classList.remove('error'));
      if (!isValidName(name)) {
        form.elements['name'].classList.add('error');
        form.querySelector('[data-hint="name"]').textContent = 'Informe seu nome completo (nome + sobrenome).';
        form.querySelector('[data-hint="name"]').classList.add('error');
        ok = false;
      }
      if (!isValidPhone(phone)) {
        form.elements['phone'].classList.add('error');
        form.querySelector('[data-hint="phone"]').textContent = 'Telefone invalido. Informe DDD + numero.';
        form.querySelector('[data-hint="phone"]').classList.add('error');
        ok = false;
      }
      if (!ok) return;

      customer = { name, phone };
      DataStore.saveCustomer(customer);

      const payNow = payment === 'partial' && hasPreorder ? partialTotal : total;
      const cLines = cartLines();
      const itemLines = cLines.map(l => `• ${l.qty}x ${l.product.name}${l.product.kind === 'preorder' ? ' (encomenda . ' + l.product.preorderDays + 'd)' : ''} — ${BRL(l.product.price * l.qty)}`).join('%0A');
      let msg = `Ola Fernanda! Sou ${name} (${phone}) e gostaria de fechar o pedido:%0A%0A${itemLines}%0A%0ASubtotal: ${BRL(subtotal)}`;
      if (appliedPromo) msg += `%0ACupom ${appliedPromo.code}: -${BRL(discount)}`;
      msg += `%0ATotal: ${BRL(total)}`;
      if (hasPreorder) {
        if (payment === 'partial') msg += `%0A%0APagamento: SINAL agora (${BRL(partialTotal)}) + saldo de ${BRL(total - partialTotal)} ao receber.`;
        else msg += `%0A%0APagamento: TOTAL antecipado (${BRL(total)}).`;
      } else {
        msg += `%0A%0APagamento: a vista (${BRL(total)}).`;
      }

      const baseUrl = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : 'https://wa.me/';
      window.open(`${baseUrl}?text=${msg}`, '_blank');

      // Save order to Supabase
      const orderId = 'F-' + Date.now().toString(36).toUpperCase();
      await DataStore.saveOrder({
        id: orderId,
        customer: name,
        phone,
        city: '',
        items: cLines.reduce((s, l) => s + l.qty, 0),
        total,
        paid: payNow,
        kind: hasPreorder ? 'preorder' : 'stock',
        status: hasPreorder && payment === 'partial' ? 'Sinal pago' : 'Pago',
        createdAt: new Date().toISOString()
      });

      closeModal();
      cart = [];
      DataStore.saveCart(cart);
      toast('Pedido enviado pra Fernanda!');
      render();
    });
  }

  function closeModal() {
    const h = document.getElementById('modal-host');
    if (h) h.innerHTML = '';
  }

  // ---------- CUSTOMER MODAL ----------
  function openCustomerModal() {
    const c = customer || {};
    const host = document.getElementById('modal-host');
    host.innerHTML = `
      <div class="modal-backdrop open">
        <div class="modal">
          <div class="flex justify-between items-center mb-4">
            <h3 style="font-size:var(--fs-xl)">Seus dados</h3>
            <button class="btn-icon" data-action="close-modal" style="width:36px;height:36px">${Icons.close}</button>
          </div>
          <p class="text-md" style="font-size:var(--fs-sm)">Cadastro minimo: nome completo e telefone. Usaremos apenas para confirmar seus pedidos pelo WhatsApp.</p>
          <form id="customer-form" class="flex flex-col gap-4 mt-5">
            <div class="field">
              <label>Nome completo</label>
              <input class="input" name="name" required minlength="3" placeholder="Ex: Mariana Souza" value="${c.name || ''}">
              <span class="hint" data-hint="name"></span>
            </div>
            <div class="field">
              <label>Telefone com DDD</label>
              <input class="input" name="phone" required placeholder="(81) 99999-9999" value="${c.phone || ''}" inputmode="numeric">
              <span class="hint" data-hint="phone"></span>
            </div>
            <div class="flex gap-3 mt-2">
              <button type="button" class="btn btn-secondary btn-block" data-action="close-modal">Cancelar</button>
              <button type="submit" class="btn btn-primary btn-block">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    `;
    const form = document.getElementById('customer-form');
    const phoneInput = form.elements['phone'];
    phoneInput.addEventListener('input', () => { phoneInput.value = formatPhone(phoneInput.value); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get('name') || '').toString().trim();
      const phone = (fd.get('phone') || '').toString().trim();
      let ok = true;
      form.querySelectorAll('.input').forEach(i => i.classList.remove('error'));
      if (!isValidName(name)) { form.elements['name'].classList.add('error'); form.querySelector('[data-hint="name"]').textContent = 'Informe nome + sobrenome.'; form.querySelector('[data-hint="name"]').classList.add('error'); ok = false; }
      if (!isValidPhone(phone)) { form.elements['phone'].classList.add('error'); form.querySelector('[data-hint="phone"]').textContent = 'Telefone invalido.'; form.querySelector('[data-hint="phone"]').classList.add('error'); ok = false; }
      if (!ok) return;
      customer = { name, phone };
      DataStore.saveCustomer(customer);
      closeModal();
      toast('Dados salvos');
      render();
    });
  }

  function shareProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const text = `${p.name} — ${p.brand}\n${p.description}`;
    if (navigator.share) navigator.share({ title: p.name, text, url: location.href }).catch(() => {});
    else { navigator.clipboard.writeText(`${text}\n${location.href}`); toast('Link copiado'); }
  }

  // ---------- EVENT DELEGATION ----------
  function bindEvents() {
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.perfume-card');
      const actionEl = e.target.closest('[data-action]');
      const goEl = e.target.closest('[data-go]');
      const navEl = e.target.closest('.bottom-nav .item');
      const filterEl = e.target.closest('[data-filter]');

      if (actionEl) {
        const action = actionEl.dataset.action;
        const id = actionEl.dataset.id || (card && card.dataset.id);
        e.stopPropagation();
        if (action === 'fav')             toggleFav(id);
        else if (action === 'add-to-cart') addToCart(id);
        else if (action === 'inc')         incCart(id);
        else if (action === 'dec')         decCart(id);
        else if (action === 'remove')      removeCart(id);
        else if (action === 'share')       shareProduct(id);
        else if (action === 'checkout')    openCheckoutModal();
        else if (action === 'apply-promo') applyPromo();
        else if (action === 'edit-customer') openCustomerModal();
        else if (action === 'logout-customer') { customer = null; localStorage.removeItem(STORAGE_KEYS.customer); toast('Sessao encerrada'); render(); }
        else if (action === 'close-modal') closeModal();
        else if (action === 'dismiss-promo') { promoBannerDismissed = true; sessionStorage.setItem('fpa.promoDismiss','1'); render(); }
        else if (action === 'contact') { window.open(WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : 'https://wa.me/', '_blank'); }
        return;
      }
      if (filterEl) { activeFilter = filterEl.dataset.filter; render(); return; }
      if (goEl) {
        const v = goEl.dataset.go;
        if (v === 'bestsellers') { activeFilter = 'bestseller'; go('catalog'); }
        else if (v === 'preorders') { activeFilter = 'preorder'; go('catalog'); }
        else go(v);
        return;
      }
      if (navEl) { activeFilter = 'all'; go(navEl.dataset.view); return; }
      if (card) { go('product', { id: card.dataset.id }); return; }
    });

    const search = document.getElementById('search-input');
    if (search) {
      search.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        if (activeView !== 'catalog') activeView = 'catalog';
        render();
      });
    }
  }

  function hideSplash() {
    const s = document.getElementById('splash');
    if (!s) return;
    setTimeout(() => s.classList.add('hide'), 1400);
    setTimeout(() => s.remove(), 2200);
  }

  async function init() {
    bindEvents();
    render(); // show loading state
    hideSplash();

    // Load data from Supabase
    [products, promos] = await Promise.all([
      DataStore.products(),
      DataStore.promos()
    ]);
    loading = false;
    render();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    }
  }

  return { init, go };
})();

document.addEventListener('DOMContentLoaded', App.init);
