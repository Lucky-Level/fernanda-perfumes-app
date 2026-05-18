/* =============================================================
   FERNANDA · ADMIN DASHBOARD (Supabase-backed)
   ============================================================= */

const Admin = (() => {
  let products = [];
  let orders = [];
  let promos = [];
  let view = 'dashboard';
  let editing = null;
  let editingPromo = null;
  let loading = true;

  function isAuthed() { return localStorage.getItem(STORAGE_KEYS.admin) === '1'; }
  async function login(u, p) {
    if (u.trim() !== 'fernandasousa') return false;
    const ok = await DataStore.verifyAdmin(p);
    if (ok) localStorage.setItem(STORAGE_KEYS.admin, '1');
    return ok;
  }
  function logout() { localStorage.removeItem(STORAGE_KEYS.admin); render(); }

  function toast(msg) {
    const host = document.getElementById('toast-host');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; }, 2200);
    setTimeout(() => el.remove(), 2700);
  }

  // ---------- LOGIN ----------
  function renderLogin() {
    return `
      <section class="section" style="min-height:80vh;display:flex;align-items:center;justify-content:center">
        <div class="card rise-in" style="padding:var(--sp-8); max-width:440px; width:100%">
          <div style="text-align:center; margin-bottom:var(--sp-6)">
            <img src="./icons/icon.svg" alt="Fernanda" width="96" height="96" style="margin:0 auto var(--sp-4); display:block">
            <span class="eyebrow">\u00c1rea restrita</span>
            <h2 class="mt-4" style="font-size:var(--fs-2xl)">Painel <em>Fernanda</em></h2>
            <p class="text-lo mt-4" style="font-size:var(--fs-sm)">Acesso exclusivo da equipe</p>
          </div>
          <form id="login-form" class="flex flex-col gap-4">
            <div class="field">
              <label>Usu\u00e1rio</label>
              <input class="input" name="user" placeholder="seu usu\u00e1rio" autocomplete="username" required />
            </div>
            <div class="field">
              <label>Senha</label>
              <div class="password-wrap">
                <input class="input" type="password" name="pass" placeholder="--------" autocomplete="current-password" required />
                <button type="button" class="toggle" data-toggle-pw aria-label="Mostrar senha">${Icons.eye}</button>
              </div>
              <span class="hint">Acesso restrito . equipe Fernanda</span>
            </div>
            <button type="submit" class="btn btn-primary btn-block btn-lg mt-4" id="login-btn">Entrar</button>
            <a href="./index.html" class="btn btn-secondary btn-block">Voltar \u00e0 loja</a>
          </form>
        </div>
      </section>
    `;
  }

  // ---------- DASHBOARD ----------
  function renderDashboard() {
    if (loading) return renderLoading();
    const totalRevenue = orders.reduce((s, o) => s + (o.paid || o.total), 0);
    const pending = orders.filter(o => !['Entregue'].includes(o.status));
    const preorders = orders.filter(o => o.kind === 'preorder');
    const lowStock = products.filter(p => p.kind === 'stock' && p.stock <= 12);
    const activePromos = promos.filter(p => p.active).length;

    return `
      <section class="section">
        <span class="eyebrow">Vis\u00e3o geral</span>
        <h2 class="mt-4">Boa tarde, <em>Fernanda</em></h2>
        <p class="text-md mt-4">Resumo de hoje . ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

        <div class="grid grid-3 mt-6">
          <div class="stat">
            <div class="k">Faturamento recebido</div>
            <div class="v">${BRL(totalRevenue)}</div>
            <div class="delta">Acumulado</div>
          </div>
          <div class="stat">
            <div class="k">Pedidos abertos</div>
            <div class="v">${pending.length}</div>
            <div class="delta">${pending.length} aguardando a\u00e7\u00e3o</div>
          </div>
          <div class="stat">
            <div class="k">Encomendas ativas</div>
            <div class="v">${preorders.length}</div>
            <div class="delta">${preorders.filter(o => o.status === 'Sinal pago').length} com sinal pago</div>
          </div>
          <div class="stat">
            <div class="k">Produtos em estoque</div>
            <div class="v">${products.filter(p => p.kind === 'stock').length}</div>
            <div class="delta ${lowStock.length ? 'down' : ''}">${lowStock.length} com estoque baixo</div>
          </div>
          <div class="stat">
            <div class="k">Promo\u00e7\u00f5es ativas</div>
            <div class="v">${activePromos}</div>
            <div class="delta">${promos.length} cadastradas no total</div>
          </div>
          <div class="stat">
            <div class="k">Ticket m\u00e9dio</div>
            <div class="v">${BRL(orders.reduce((s,o)=>s+o.total,0) / Math.max(orders.length, 1))}</div>
            <div class="delta">Base de ${orders.length} pedidos</div>
          </div>
        </div>

        <div class="grid grid-2-lg mt-8">
          <div class="card" style="padding:var(--sp-6)">
            <div class="flex justify-between items-center mb-4">
              <h3 style="font-size:var(--fs-xl)">\u00daltimos pedidos</h3>
              <button class="btn btn-secondary btn-sm" data-view="orders">Ver todos</button>
            </div>
            <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Pedido</th><th>Cliente</th><th>Tipo</th><th>Status</th></tr></thead>
              <tbody>
                ${orders.slice(0, 5).map(o => `
                  <tr>
                    <td style="color:var(--color-gold);font-family:var(--font-serif)">${o.id}</td>
                    <td>${o.customer}<div class="text-lo" style="font-size:var(--fs-xs)">${o.phone || ''}</div></td>
                    <td><span class="badge ${o.kind === 'preorder' ? 'badge-preorder' : 'badge-stock'}">${o.kind === 'preorder' ? 'Encomenda' : 'Estoque'}</span></td>
                    <td><span class="badge ${statusClass(o.status)}">${o.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            </div>
          </div>

          <div class="card" style="padding:var(--sp-6)">
            <h3 style="font-size:var(--fs-xl); margin-bottom:var(--sp-4)">Estoque cr\u00edtico</h3>
            ${lowStock.length ? lowStock.map(p => `
              <div class="flex items-center gap-3" style="padding:var(--sp-3) 0;border-bottom:1px solid var(--color-line-soft)">
                <div style="width:36px;height:44px;background:linear-gradient(180deg,${p.color},#0a0a0a);border-radius:6px;flex:0 0 auto;border:1px solid ${p.accent}"></div>
                <div style="flex:1;min-width:0">
                  <div style="font-family:var(--font-serif);font-size:var(--fs-md);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
                  <div class="text-lo" style="font-size:var(--fs-xs)">${p.brand}</div>
                </div>
                <div style="color:${p.stock <= 6 ? 'var(--color-danger)' : 'var(--color-warning)'};font-weight:600;font-size:var(--fs-sm);flex:0 0 auto">${p.stock} un.</div>
              </div>
            `).join('') : '<p class="text-lo">Tudo abastecido.</p>'}
          </div>
        </div>
      </section>
    `;
  }

  function renderLoading() {
    return `
      <section class="section" style="text-align:center;padding:var(--sp-10) 0">
        <div style="width:48px;height:48px;border:2px solid var(--color-gold);border-top-color:transparent;border-radius:50%;margin:0 auto;animation:spin 0.8s linear infinite"></div>
        <p class="text-lo mt-6">Carregando dados...</p>
      </section>
    `;
  }

  function statusClass(status) {
    return ({
      'Pago': 'badge-new',
      'Sinal pago': 'badge-preorder',
      'Em separa\u00e7\u00e3o': 'badge-exclusive',
      'Aguardando saldo': 'badge-bestseller',
      'Enviado': 'badge-bestseller',
      'Entregue': 'badge-discount'
    }[status]) || 'badge-exclusive';
  }

  // ---------- PRODUCTS ----------
  function renderProducts() {
    if (loading) return renderLoading();
    return `
      <section class="section">
        <div class="flex items-center justify-between" style="flex-wrap:wrap;gap:var(--sp-4)">
          <div>
            <span class="eyebrow">Cat\u00e1logo</span>
            <h2 class="mt-4">Gerenciar <em>perfumes</em></h2>
            <p class="text-md mt-3" style="font-size:var(--fs-sm)">Voc\u00ea pode marcar um perfume como <strong style="color:var(--color-gold)">Pronta entrega</strong> (estoque) ou <strong style="color:var(--color-gold)">Encomenda</strong> (importa\u00e7\u00e3o sob demanda com sinal).</p>
          </div>
          <button class="btn btn-primary" data-action="new-product">${Icons.plus} Adicionar perfume</button>
        </div>

        <div class="card mt-6" style="padding:0;overflow:hidden">
          <div class="table-wrap">
          <table class="table">
            <thead><tr><th></th><th>Nome</th><th>Tipo</th><th>Fam\u00edlia</th><th>Pre\u00e7o</th><th>Estoque/Prazo</th><th></th></tr></thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td style="width:48px"><div style="width:32px;height:40px;background:linear-gradient(180deg,${p.color},#0a0a0a);border:1px solid ${p.accent};border-radius:5px"></div></td>
                  <td>
                    <div style="font-family:var(--font-serif);font-size:var(--fs-md)">${p.name}</div>
                    <div class="text-lo" style="font-size:var(--fs-xs)">${p.brand}</div>
                  </td>
                  <td><span class="badge ${p.kind === 'preorder' ? 'badge-preorder' : 'badge-stock'}">${p.kind === 'preorder' ? 'Encomenda' : 'Estoque'}</span></td>
                  <td class="text-lo" style="font-size:var(--fs-xs)">${p.family}</td>
                  <td class="text-gold">${BRL(p.price)}</td>
                  <td>
                    ${p.kind === 'preorder'
                      ? `<span class="text-md">${p.preorderDays}d . ${p.depositPct}% sinal</span>`
                      : `<span style="color:${p.stock<=6?'var(--color-danger)':p.stock<=12?'var(--color-warning)':'var(--color-text-md)'}">${p.stock} un.</span>`}
                  </td>
                  <td style="width:100px;text-align:right;white-space:nowrap">
                    <button class="btn-icon" style="width:36px;height:36px" data-action="edit-product" data-id="${p.id}" aria-label="Editar">${Icons.edit}</button>
                    <button class="btn-icon" style="width:36px;height:36px" data-action="delete-product" data-id="${p.id}" aria-label="Excluir">${Icons.trash}</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          </div>
        </div>
      </section>
    `;
  }

  // ---------- PRODUCT MODAL ----------
  function renderProductModal(p) {
    const isNew = !p;
    const v = p || {
      id: '', name: '', brand: '', family: '', price: 0, oldPrice: null,
      stock: 0, kind: 'stock', preorderDays: 14, depositPct: 50,
      description: '', color: '#4B2E24', accent: '#C8A96B',
      rating: 5, reviews: 0, tags: [],
      notes: { top: '', heart: '', base: '' },
      imageUrl: null
    };
    return `
      <div class="modal-backdrop open" id="modal-backdrop">
        <div class="modal modal-full" style="max-width:680px;max-height:90vh;overflow-y:auto">
          <div class="flex justify-between items-center mb-4">
            <h3 style="font-size:var(--fs-xl)">${isNew ? 'Novo perfume' : 'Editar perfume'}</h3>
            <button class="btn-icon" data-action="close-modal" style="width:36px;height:36px">${Icons.close}</button>
          </div>
          <form id="product-form" class="flex flex-col gap-4">
            <input type="hidden" name="id" value="${v.id}">

            <div class="card" style="padding:var(--sp-5)">
              <span class="eyebrow">Tipo de produto</span>
              <div class="flex gap-3 mt-3" style="flex-wrap:wrap">
                <label class="pay-option" style="flex:1;min-width:140px">
                  <input type="radio" name="kind" value="stock" ${v.kind === 'stock' ? 'checked' : ''}>
                  <div>
                    <strong>Pronta entrega</strong>
                    <div class="text-lo" style="font-size:var(--fs-xs)">Tenho em estoque . envio r\u00e1pido</div>
                  </div>
                </label>
                <label class="pay-option" style="flex:1;min-width:140px">
                  <input type="radio" name="kind" value="preorder" ${v.kind === 'preorder' ? 'checked' : ''}>
                  <div>
                    <strong>Encomenda</strong>
                    <div class="text-lo" style="font-size:var(--fs-xs)">Importa\u00e7\u00e3o sob medida . com sinal</div>
                  </div>
                </label>
              </div>
            </div>

            <div class="grid grid-2-mobile">
              <div class="field"><label>Nome</label><input class="input" name="name" required value="${v.name}"></div>
              <div class="field"><label>Marca</label><input class="input" name="brand" required value="${v.brand}"></div>
            </div>
            <div class="field"><label>Fam\u00edlia olfativa</label><input class="input" name="family" value="${v.family}"></div>
            <div class="grid grid-2-mobile">
              <div class="field"><label>Pre\u00e7o (R$)</label><input class="input" name="price" type="number" step="0.01" required value="${v.price}"></div>
              <div class="field"><label>Pre\u00e7o cheio (R$)</label><input class="input" name="oldPrice" type="number" step="0.01" value="${v.oldPrice || ''}"></div>
            </div>

            <div class="grid grid-2-mobile" id="stock-fields" style="${v.kind === 'stock' ? '' : 'display:none'}">
              <div class="field"><label>Estoque (unidades)</label><input class="input" name="stock" type="number" min="0" value="${v.stock}"></div>
              <div class="field"><label>Tags (v\u00edrgula)</label><input class="input" name="tags" value="${v.tags.join(', ')}" placeholder="bestseller, exclusive, new"></div>
            </div>
            <div class="grid grid-2-mobile" id="preorder-fields" style="${v.kind === 'preorder' ? '' : 'display:none'}">
              <div class="field"><label>Prazo de chegada (dias)</label><input class="input" name="preorderDays" type="number" min="1" value="${v.preorderDays}"></div>
              <div class="field"><label>Sinal m\u00ednimo (%)</label><input class="input" name="depositPct" type="number" min="10" max="100" value="${v.depositPct}"></div>
            </div>
            <div class="field" id="preorder-tags" style="${v.kind === 'preorder' ? '' : 'display:none'}">
              <label>Tags (v\u00edrgula)</label>
              <input class="input" name="tags2" value="${v.tags.join(', ')}" placeholder="exclusive, new">
            </div>

            <div class="card" style="padding:var(--sp-5)">
              <span class="eyebrow">Imagem do produto</span>
              <p class="text-lo mt-3" style="font-size:var(--fs-xs)">Suba uma foto real do perfume. Se n\u00e3o tiver, o frasco SVG ser\u00e1 usado.</p>
              <div class="mt-3">
                ${v.imageUrl ? `<div id="img-preview" style="margin-bottom:var(--sp-3)"><img src="${v.imageUrl}" style="width:120px;height:auto;border-radius:var(--r-lg);border:1px solid var(--color-line-soft)"></div>` : '<div id="img-preview"></div>'}
                <input type="file" name="image" accept="image/*" id="product-image-input" style="font-size:var(--fs-sm)">
                <input type="hidden" name="imageUrl" value="${v.imageUrl || ''}">
              </div>
            </div>

            <div class="grid grid-2-mobile">
              <div class="field"><label>Cor do frasco</label><div class="flex gap-3 items-center"><input type="color" name="color" value="${v.color}" style="width:48px;height:40px;border:none;background:none;cursor:pointer;padding:0"><span class="text-lo" style="font-size:var(--fs-xs)" id="color-hex">${v.color}</span></div></div>
              <div class="field"><label>Cor do detalhe</label><div class="flex gap-3 items-center"><input type="color" name="accent" value="${v.accent}" style="width:48px;height:40px;border:none;background:none;cursor:pointer;padding:0"><span class="text-lo" style="font-size:var(--fs-xs)" id="accent-hex">${v.accent}</span></div></div>
            </div>
            <div class="field"><label>Notas de sa\u00edda</label><input class="input" name="top" value="${v.notes.top}"></div>
            <div class="field"><label>Notas de cora\u00e7\u00e3o</label><input class="input" name="heart" value="${v.notes.heart}"></div>
            <div class="field"><label>Notas de fundo</label><input class="input" name="base" value="${v.notes.base}"></div>
            <div class="field"><label>Descri\u00e7\u00e3o</label><textarea class="textarea" name="description">${v.description}</textarea></div>

            <div class="flex gap-3 mt-4">
              <button type="button" class="btn btn-secondary btn-block" data-action="close-modal">Cancelar</button>
              <button type="submit" class="btn btn-primary btn-block">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function openProductModal(id) {
    editing = id ? products.find(p => p.id === id) : null;
    const host = document.getElementById('modal-host');
    host.innerHTML = renderProductModal(editing);

    const form = document.getElementById('product-form');
    function refreshKind() {
      const kind = form.elements['kind'].value;
      document.getElementById('stock-fields').style.display    = kind === 'stock'    ? '' : 'none';
      document.getElementById('preorder-fields').style.display = kind === 'preorder' ? '' : 'none';
      document.getElementById('preorder-tags').style.display   = kind === 'preorder' ? '' : 'none';
    }
    form.querySelectorAll('input[name="kind"]').forEach(r => r.addEventListener('change', refreshKind));

    const colorInput = form.elements['color'];
    const accentInput = form.elements['accent'];
    if (colorInput) colorInput.addEventListener('input', () => { document.getElementById('color-hex').textContent = colorInput.value; });
    if (accentInput) accentInput.addEventListener('input', () => { document.getElementById('accent-hex').textContent = accentInput.value; });

    const imgInput = document.getElementById('product-image-input');
    if (imgInput) {
      imgInput.addEventListener('change', () => {
        const file = imgInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('img-preview').innerHTML = `<img src="${ev.target.result}" style="width:120px;height:auto;border-radius:var(--r-lg);border:1px solid var(--color-line-soft);margin-bottom:var(--sp-3)">`;
        };
        reader.readAsDataURL(file);
      });
    }

    form.addEventListener('submit', saveProduct);
  }

  function closeModal() {
    document.getElementById('modal-host').innerHTML = '';
    editing = null;
    editingPromo = null;
  }

  async function saveProduct(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const kind = f.get('kind') || 'stock';
    const tags = (kind === 'stock' ? f.get('tags') : f.get('tags2'))
      .split(',').map(s => s.trim()).filter(Boolean);
    const productId = f.get('id') || 'p-' + Math.random().toString(36).slice(2, 7);

    let imageUrl = f.get('imageUrl') || null;
    const imageFile = document.getElementById('product-image-input').files[0];
    if (imageFile) {
      toast('Enviando imagem...');
      const url = await DataStore.uploadImage(imageFile, productId);
      if (url) imageUrl = url;
      else toast('Erro ao enviar imagem');
    }

    const data = {
      id: productId,
      name: f.get('name').trim(),
      brand: f.get('brand').trim(),
      family: f.get('family').trim(),
      price: parseFloat(f.get('price')),
      oldPrice: f.get('oldPrice') ? parseFloat(f.get('oldPrice')) : null,
      stock: kind === 'stock' ? parseInt(f.get('stock'), 10) : 0,
      kind,
      preorderDays: kind === 'preorder' ? parseInt(f.get('preorderDays'), 10) : 0,
      depositPct: kind === 'preorder' ? parseInt(f.get('depositPct'), 10) : 0,
      color: f.get('color').trim() || '#4B2E24',
      accent: f.get('accent').trim() || '#C8A96B',
      tags,
      notes: { top: f.get('top').trim(), heart: f.get('heart').trim(), base: f.get('base').trim() },
      description: f.get('description').trim(),
      rating: editing ? editing.rating : 5,
      reviews: editing ? editing.reviews : 0,
      imageUrl
    };

    await DataStore.saveProduct(data);
    products = await DataStore.products();
    toast(editing ? 'Perfume atualizado' : 'Perfume adicionado');
    closeModal();
    render();
  }

  async function deleteProduct(id) {
    if (!id) { toast('Erro: produto sem ID'); return; }
    if (!confirm('Excluir este perfume?')) return;
    try {
      await DataStore.deleteProduct(id);
      products = await DataStore.products();
      toast('Perfume removido');
      render();
    } catch (e) {
      console.error('deleteProduct error:', e);
      toast('Erro ao excluir: ' + e.message);
    }
  }

  // ---------- ORDERS ----------
  function renderOrders() {
    if (loading) return renderLoading();
    return `
      <section class="section">
        <span class="eyebrow">Vendas</span>
        <h2 class="mt-4">Todos os <em>pedidos</em></h2>

        <div class="card mt-6" style="padding:0;overflow:hidden">
          <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Pedido</th><th>Cliente</th><th>Telefone</th><th>Tipo</th><th>Total</th><th>Pago</th><th>Status</th><th>Data</th></tr></thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td style="color:var(--color-gold);font-family:var(--font-serif)">${o.id}</td>
                  <td>${o.customer}<div class="text-lo" style="font-size:var(--fs-xs)">${o.city || ''}</div></td>
                  <td class="text-md" style="font-size:var(--fs-xs)">${o.phone || ''}</td>
                  <td><span class="badge ${o.kind === 'preorder' ? 'badge-preorder' : 'badge-stock'}">${o.kind === 'preorder' ? 'Encomenda' : 'Estoque'}</span></td>
                  <td>${BRL(o.total)}</td>
                  <td style="color:${(o.paid||0) >= o.total ? 'var(--color-success)' : 'var(--color-warning)'}">${BRL(o.paid || 0)}</td>
                  <td>
                    <select class="select" style="height:32px;padding:0 var(--sp-3);font-size:var(--fs-xs);min-width:120px" data-action="status" data-id="${o.id}">
                      ${['Pago', 'Sinal pago', 'Em separa\u00e7\u00e3o', 'Aguardando saldo', 'Enviado', 'Entregue'].map(s => `<option ${o.status===s?'selected':''} value="${s}">${s}</option>`).join('')}
                    </select>
                  </td>
                  <td class="text-lo" style="font-size:var(--fs-xs);white-space:nowrap">${new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          </div>
        </div>
      </section>
    `;
  }

  async function updateStatus(id, status) {
    await DataStore.updateOrderStatus(id, status);
    const o = orders.find(x => x.id === id);
    if (o) o.status = status;
    toast('Status atualizado');
  }

  // ---------- PROMOS ----------
  function renderPromos() {
    if (loading) return renderLoading();
    return `
      <section class="section">
        <div class="flex items-center justify-between" style="flex-wrap:wrap;gap:var(--sp-4)">
          <div>
            <span class="eyebrow">Marketing</span>
            <h2 class="mt-4">Gerenciar <em>promo\u00e7\u00f5es</em></h2>
            <p class="text-md mt-3" style="font-size:var(--fs-sm)">A promo\u00e7\u00e3o marcada como ativa aparece como uma faixa no topo da loja.</p>
          </div>
          <button class="btn btn-primary" data-action="new-promo">${Icons.plus} Nova promo\u00e7\u00e3o</button>
        </div>

        <div class="grid grid-2-mobile mt-6">
          ${promos.map(pm => `
            <div class="card" style="padding:var(--sp-6); ${pm.active ? 'border-color:var(--color-gold);box-shadow:var(--sh-gold-glow)' : ''}">
              <div class="flex justify-between items-center mb-3">
                <span class="badge ${pm.active ? 'badge-bestseller' : 'badge-exclusive'}">${pm.active ? 'ATIVA' : 'Inativa'}</span>
                <code style="background:rgba(200,169,107,0.12);color:var(--color-gold);padding:4px 10px;border-radius:var(--r-pill);font-size:var(--fs-xs);letter-spacing:var(--tracking-wider)">${pm.code}</code>
              </div>
              <h3 style="font-size:var(--fs-xl);font-family:var(--font-serif)">${pm.title}</h3>
              <p class="text-md mt-3" style="font-size:var(--fs-sm)">${pm.description}</p>
              <div class="mt-4 flex gap-4 text-md" style="font-size:var(--fs-sm); flex-wrap:wrap">
                ${pm.discountPct ? `<span>${pm.discountPct}% OFF</span>` : ''}
                ${pm.freeShipping ? `<span>Frete gr\u00e1tis</span>` : ''}
                <span>At\u00e9 ${new Date(pm.validUntil).toLocaleDateString('pt-BR')}</span>
              </div>
              <div class="flex gap-2 mt-5" style="flex-wrap:wrap">
                <label class="switch">
                  <input type="checkbox" data-action="toggle-promo" data-id="${pm.id}" ${pm.active ? 'checked' : ''}>
                  <span class="track"></span>
                  <span style="font-size:var(--fs-xs);letter-spacing:var(--tracking-wide);text-transform:uppercase;color:var(--color-text-md)">Mostrar na loja</span>
                </label>
                <div style="flex:1"></div>
                <button class="btn-icon" style="width:36px;height:36px" data-action="edit-promo" data-id="${pm.id}">${Icons.edit}</button>
                <button class="btn-icon" style="width:36px;height:36px" data-action="delete-promo" data-id="${pm.id}">${Icons.trash}</button>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  function renderPromoModal(pm) {
    const isNew = !pm;
    const v = pm || {
      id: '', code: '', title: '', description: '',
      discountPct: 10, freeShipping: false,
      active: true, validUntil: ''
    };
    return `
      <div class="modal-backdrop open">
        <div class="modal modal-full" style="max-width:560px">
          <div class="flex justify-between items-center mb-4">
            <h3 style="font-size:var(--fs-xl)">${isNew ? 'Nova promo\u00e7\u00e3o' : 'Editar promo\u00e7\u00e3o'}</h3>
            <button class="btn-icon" data-action="close-modal" style="width:36px;height:36px">${Icons.close}</button>
          </div>
          <form id="promo-form" class="flex flex-col gap-4">
            <input type="hidden" name="id" value="${v.id}">
            <div class="field"><label>T\u00edtulo</label><input class="input" name="title" required value="${v.title}" placeholder="Ex: 10% OFF na primeira compra"></div>
            <div class="field"><label>Descri\u00e7\u00e3o</label><textarea class="textarea" name="description">${v.description}</textarea></div>
            <div class="grid grid-2-mobile">
              <div class="field"><label>Cupom (c\u00f3digo)</label><input class="input" name="code" required value="${v.code}" placeholder="FERNANDA10" style="text-transform:uppercase"></div>
              <div class="field"><label>V\u00e1lido at\u00e9</label><input class="input" name="validUntil" type="date" required value="${v.validUntil}"></div>
            </div>
            <div class="grid grid-2-mobile">
              <div class="field"><label>Desconto (%)</label><input class="input" name="discountPct" type="number" min="0" max="80" value="${v.discountPct}"></div>
              <div class="field">
                <label>Benef\u00edcios extras</label>
                <label class="switch" style="margin-top:6px">
                  <input type="checkbox" name="freeShipping" ${v.freeShipping ? 'checked' : ''}>
                  <span class="track"></span>
                  <span style="font-size:var(--fs-xs);letter-spacing:var(--tracking-wide);text-transform:uppercase;color:var(--color-text-md)">Frete gr\u00e1tis</span>
                </label>
              </div>
            </div>
            <label class="switch">
              <input type="checkbox" name="active" ${v.active ? 'checked' : ''}>
              <span class="track"></span>
              <span style="font-size:var(--fs-xs);letter-spacing:var(--tracking-wide);text-transform:uppercase;color:var(--color-text-md)">Ativar imediatamente</span>
            </label>
            <div class="flex gap-3 mt-4">
              <button type="button" class="btn btn-secondary btn-block" data-action="close-modal">Cancelar</button>
              <button type="submit" class="btn btn-primary btn-block">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function openPromoModal(id) {
    editingPromo = id ? promos.find(p => p.id === id) : null;
    document.getElementById('modal-host').innerHTML = renderPromoModal(editingPromo);
    const f = document.getElementById('promo-form');
    f.addEventListener('submit', savePromo);
  }

  async function savePromo(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const active = f.get('active') === 'on';
    const data = {
      id: f.get('id') || 'pm-' + Math.random().toString(36).slice(2, 7),
      title: f.get('title').trim(),
      description: f.get('description').trim(),
      code: f.get('code').trim().toUpperCase(),
      validUntil: f.get('validUntil'),
      discountPct: parseInt(f.get('discountPct') || '0', 10),
      freeShipping: f.get('freeShipping') === 'on',
      active
    };

    if (active) {
      await DataStore.setPromoActive(data.id, false);
    }
    await DataStore.savePromo(data);
    promos = await DataStore.promos();
    toast(editingPromo ? 'Promo\u00e7\u00e3o atualizada' : 'Promo\u00e7\u00e3o criada');
    closeModal();
    render();
  }

  async function togglePromo(id, value) {
    await DataStore.setPromoActive(id, value);
    promos = await DataStore.promos();
    toast(value ? 'Promo\u00e7\u00e3o ativada na loja' : 'Promo\u00e7\u00e3o desativada');
    render();
  }

  async function deletePromo(id) {
    if (!confirm('Excluir esta promo\u00e7\u00e3o?')) return;
    await DataStore.deletePromo(id);
    promos = await DataStore.promos();
    toast('Promo\u00e7\u00e3o removida');
    render();
  }

  // ---------- LAYOUT ----------
  function renderApp() {
    let body = '';
    if (view === 'dashboard') body = renderDashboard();
    else if (view === 'products') body = renderProducts();
    else if (view === 'orders') body = renderOrders();
    else if (view === 'promos') body = renderPromos();

    return `
      <header class="header">
        <div class="container">
          <div class="brand">
            <span class="mark" style="font-size:20px">F</span>
            <span class="wordmark">
              <span class="top">Fernanda . Admin</span>
              <span class="sub">Painel privado</span>
            </span>
          </div>
          <div class="actions">
            <a href="./index.html" class="btn btn-secondary btn-sm">Ver loja</a>
            <button class="btn btn-dark btn-sm" data-action="logout">Sair</button>
          </div>
        </div>
      </header>

      <nav class="bottom-nav" role="tablist">
        <button class="item ${view==='dashboard'?'active':''}" data-view="dashboard">
          <span class="icon">${Icons.dash}</span><span class="label">Vis\u00e3o</span>
        </button>
        <button class="item ${view==='products'?'active':''}" data-view="products">
          <span class="icon">${Icons.bottle}</span><span class="label">Cat\u00e1logo</span>
        </button>
        <button class="item ${view==='orders'?'active':''}" data-view="orders">
          <span class="icon">${Icons.package}</span><span class="label">Pedidos</span>
        </button>
        <button class="item ${view==='promos'?'active':''}" data-view="promos">
          <span class="icon">${Icons.spark || Icons.star}</span><span class="label">Promo\u00e7\u00f5es</span>
        </button>
      </nav>

      <main class="container page">${body}</main>
    `;
  }

  function render() {
    const root = document.getElementById('app');
    root.innerHTML = isAuthed() ? renderApp() : renderLogin();

    if (!isAuthed()) {
      const f = document.getElementById('login-form');
      if (f) f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('login-btn');
        btn.textContent = 'Verificando...';
        btn.disabled = true;
        const fd = new FormData(f);
        const ok = await login(fd.get('user'), fd.get('pass'));
        if (ok) {
          toast('Bem-vinda, Fernanda');
          await loadData();
          render();
        } else {
          toast('Credenciais inv\u00e1lidas');
          f.querySelectorAll('.input').forEach(i => i.classList.add('error'));
          btn.textContent = 'Entrar';
          btn.disabled = false;
        }
      });
    }

    document.querySelectorAll('[data-toggle-pw]').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        if (input.type === 'password') { input.type = 'text'; btn.innerHTML = Icons.eyeOff; }
        else { input.type = 'password'; btn.innerHTML = Icons.eye; }
      });
    });
  }

  async function loadData() {
    loading = true;
    render();
    [products, orders, promos] = await Promise.all([
      DataStore.products(),
      DataStore.orders(),
      DataStore.promos()
    ]);
    loading = false;
  }

  function bindEvents() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-action]');
      const v = e.target.closest('[data-view]');
      if (a) {
        const action = a.dataset.action;
        const id = a.dataset.id;
        if (action === 'logout') logout();
        else if (action === 'new-product') openProductModal();
        else if (action === 'edit-product') openProductModal(id);
        else if (action === 'delete-product') deleteProduct(id);
        else if (action === 'new-promo') openPromoModal();
        else if (action === 'edit-promo') openPromoModal(id);
        else if (action === 'delete-promo') deletePromo(id);
        else if (action === 'close-modal') closeModal();
        return;
      }
      if (v) { view = v.dataset.view; render(); }
    });
    document.addEventListener('change', (e) => {
      const a = e.target.closest('[data-action="status"]');
      const tp = e.target.closest('[data-action="toggle-promo"]');
      if (a) updateStatus(a.dataset.id, e.target.value);
      if (tp) togglePromo(tp.dataset.id, e.target.checked);
    });
  }

  async function init() {
    bindEvents();
    render();
    setTimeout(() => {
      const s = document.getElementById('splash');
      if (s) { s.classList.add('hide'); setTimeout(() => s.remove(), 800); }
    }, 900);

    if (isAuthed()) {
      await loadData();
      render();
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Admin.init);
