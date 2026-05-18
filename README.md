# Fernanda · Perfumes Árabes

Aplicativo PWA da boutique **Fernanda Perfumes Árabes** — fragrâncias árabes selecionadas com curadoria premium.

## Estrutura

```
fernanda-perfumes-app/
├── index.html              # Loja pública (storefront)
├── admin.html              # Painel administrativo (privado)
├── manifest.json           # Manifest PWA
├── service-worker.js       # Cache do app shell
├── css/
│   ├── tokens.css          # Design System — cores, tipografia, espaçamento, sombras, motion
│   ├── base.css            # Reset + globals + utilitários
│   └── components.css      # Botões, inputs, cards, navbar, header, badges, modais, loaders...
├── js/
│   ├── data.js             # Catálogo demo + persistência localStorage
│   ├── icons.js            # Ícones minimalistas em SVG
│   ├── app.js              # Lógica do storefront público
│   └── admin.js            # Lógica do painel admin (login + CRUD)
└── icons/
    └── icon.svg            # Logo / ícone PWA
```

## Como rodar localmente

Qualquer servidor estático funciona. Exemplos:

```bash
# Python (3.x)
cd fernanda-perfumes-app
python3 -m http.server 8080

# Node (npx)
cd fernanda-perfumes-app
npx serve .
```

Acesse:

- **Loja pública** → `http://localhost:8080/index.html`
- **Painel admin** → `http://localhost:8080/admin.html`

Credenciais do admin:

| Usuário          | Senha         |
|------------------|---------------|
| `fernandasousa`  | `Nanada1212`  |

⚠️ Esta autenticação é apenas para o protótipo (client-side). Para produção, integre um backend real (Firebase Auth, Supabase, etc.).

## Deploy (GitHub Pages)

1. Faça push do branch.
2. Em **Settings → Pages**, selecione o branch e a pasta `/fernanda-perfumes-app`.
3. O link público será algo como `https://<user>.github.io/<repo>/fernanda-perfumes-app/`.
   - Storefront: `…/index.html`
   - Admin: `…/admin.html`

## Design System — visão geral

### Paleta

| Token | Valor | Uso |
|------|-------|-----|
| `--color-black-deep` | `#0D0D0D` | Fundo principal |
| `--color-gold` | `#C8A96B` | Acento dourado |
| `--color-amber-brown` | `#4B2E24` | Cor primária quente |
| `--color-sand` | `#D8C3A5` | Texto secundário |
| `--color-nude` | `#E8DCCF` | Superfícies suaves |
| `--color-warm-white` | `#F8F5F0` | Texto alto contraste |
| `--color-olive` | `#4D5B43` | Apoio (badges) |
| `--color-wine` | `#5A1E2A` | Apoio (descontos) |

### Tipografia

- **Serifa** — Cormorant Garamond (títulos, números de preço)
- **Sans** — Inter (corpo, UI)
- Eyebrows com tracking largo e caixa alta para um ar editorial.

### Componentes implementados

- **Botões**: `.btn-primary` (gold), `.btn-secondary` (outline), `.btn-dark` (preto premium), `.btn-icon`, tamanhos `sm/lg/block` e estados hover/active/disabled.
- **Inputs**: `.input`, `.textarea`, `.select`, busca premium `.search`, password toggle, estados foco/erro.
- **Cards**: `.card`, `.perfume-card`, `.promo-card`, `.premium-card` (com borda dourada brilhante).
- **Navbar**: bottom-nav flutuante com glassmorphism, indicador ativo dourado.
- **Header**: sticky com glass, marca, busca integrada (desktop), ações com badge.
- **Marketplace**: lista de perfumes, carrossel de destaques, banner cinematográfico, chips de filtro, badges `Best Seller` / `Árabe Exclusivo` / `Novo` / `-%`.
- **Sociais**: estrelas, avatares, reviews, favoritos, compartilhamento.
- **Splash Screen**: logo dourada com glow pulsante.
- **Loading**: loader dourado duplo + partículas.
- **Tela de produto**: frasco SVG em palco cinematográfico, notas de saída/coração/fundo, CTA "Adicionar ao Carrinho".
- **Microinterações**: hover suave, shimmer dourado nos botões primários, transições com `cubic-bezier` luxuoso.
- **Ícones**: linha fina, 1.4px stroke, sem ornamentação excessiva.

## Recursos do storefront público

- Splash de luxo na abertura
- Home com banner, mais desejados, programa VIP, exclusivos
- Catálogo com filtros (Best Sellers, Árabe Exclusivo, Novidades)
- Busca em tempo real
- Página de produto com palco, notas e reviews
- Sacola persistente em `localStorage`
- Favoritos persistentes
- Checkout via WhatsApp (com mensagem pré-formatada)
- Instalável como PWA (offline-ready)

## Recursos do painel admin

- Login local (front-end, demo)
- Dashboard com KPIs (faturamento, pedidos abertos, ticket médio, produtos ativos)
- Tabela de últimos pedidos + estoque crítico
- CRUD de produtos (criar, editar, excluir) com modal completo
- Gestão de pedidos com mudança de status inline
- Tudo persistido em `localStorage` (demo) — pronto para plugar uma API real.

## Próximos passos sugeridos

- Integrar backend real (Firebase, Supabase ou API própria) para pedidos e estoque.
- Trocar a auth do admin por algo seguro (JWT/OAuth).
- Integrar pagamento (Stripe/Mercado Pago/Pix).
- Adicionar push notifications para status do pedido.
- Subir os PNGs `icon-192.png` e `icon-512.png` para melhor compatibilidade com lojas de apps.
