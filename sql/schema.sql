-- Fernanda Perfumes Arabes - Supabase Schema
-- Prefixo fp_ para nao conflitar com tabelas do Barber Booking
-- Execute no SQL Editor do Supabase (owkvgdjcobmuacnztzee)

-- Tabela de produtos (perfumes)
create table fp_products (
  id text primary key,
  name text not null,
  brand text not null,
  family text,
  notes_top text,
  notes_heart text,
  notes_base text,
  price decimal(10,2) not null,
  old_price decimal(10,2),
  rating decimal(2,1) default 5.0,
  reviews int default 0,
  stock int default 0,
  kind text not null default 'stock' check (kind in ('stock', 'preorder')),
  preorder_days int default 0,
  deposit_pct int default 0,
  tags text[] default '{}',
  description text,
  color text default '#4B2E24',
  accent text default '#C8A96B',
  created_at timestamptz default now()
);

-- Tabela de pedidos
create table fp_orders (
  id text primary key,
  customer text not null,
  phone text not null,
  city text,
  items int default 1,
  total decimal(10,2) not null,
  paid decimal(10,2) default 0,
  kind text default 'stock' check (kind in ('stock', 'preorder')),
  status text default 'Pago',
  created_at timestamptz default now()
);

-- Tabela de promocoes
create table fp_promos (
  id text primary key,
  code text not null,
  title text not null,
  description text,
  discount_pct int default 0,
  free_shipping boolean default false,
  active boolean default false,
  valid_until date,
  applies_to text default 'all',
  created_at timestamptz default now()
);

-- Config admin (senha)
create table fp_admin_config (
  id int primary key default 1 check (id = 1),
  password_hash text not null
);

-- Senha padrao: fernandasousa / Nanada1212 (hash SHA-256)
insert into fp_admin_config (password_hash) values
  ('afae270b6d799ebea818cadbd9fa0df2f00861c6f6bbbd1e83f37598291d191f');

-- RLS
alter table fp_products enable row level security;
alter table fp_orders enable row level security;
alter table fp_promos enable row level security;
alter table fp_admin_config enable row level security;

-- Products: leitura publica, escrita via RPC
create policy "fp_products_public_read" on fp_products for select using (true);
create policy "fp_products_public_insert" on fp_products for insert with check (true);
create policy "fp_products_public_update" on fp_products for update using (true);
create policy "fp_products_public_delete" on fp_products for delete using (true);

-- Orders: leitura e escrita publica (admin autentica via app)
create policy "fp_orders_public_read" on fp_orders for select using (true);
create policy "fp_orders_public_insert" on fp_orders for insert with check (true);
create policy "fp_orders_public_update" on fp_orders for update using (true);
create policy "fp_orders_public_delete" on fp_orders for delete using (true);

-- Promos: leitura publica, escrita via admin
create policy "fp_promos_public_read" on fp_promos for select using (true);
create policy "fp_promos_public_insert" on fp_promos for insert with check (true);
create policy "fp_promos_public_update" on fp_promos for update using (true);
create policy "fp_promos_public_delete" on fp_promos for delete using (true);

-- Admin config: negar leitura direta (usar RPC)
create policy "fp_admin_config_deny_all" on fp_admin_config for select using (false);

-- Funcao: verificar senha admin da Fernanda
create or replace function fp_verify_admin_password(pwd text)
returns boolean
language plpgsql security definer
as $$
declare
  stored_hash text;
begin
  select password_hash into stored_hash from fp_admin_config where id = 1;
  return stored_hash = encode(sha256(pwd::bytea), 'hex');
end;
$$;

-- Funcao: alterar senha admin
create or replace function fp_change_admin_password(old_pwd text, new_pwd text)
returns json
language plpgsql security definer
as $$
begin
  if not fp_verify_admin_password(old_pwd) then
    return json_build_object('error', 'Senha atual incorreta');
  end if;
  update fp_admin_config set password_hash = encode(sha256(new_pwd::bytea), 'hex') where id = 1;
  return json_build_object('success', true);
end;
$$;

-- Seed: produtos iniciais
insert into fp_products (id, name, brand, family, notes_top, notes_heart, notes_base, price, old_price, rating, reviews, stock, kind, preorder_days, deposit_pct, tags, description, color, accent) values
  ('p-001', 'Oud Noir Royal', 'Lattafa', 'Amadeirado . Oriental', 'Acafrao . Bergamota', 'Oud . Rosa Damasco', 'Ambar . Almiscar', 289.90, 369.90, 4.9, 312, 24, 'stock', 0, 0, '{bestseller,exclusive}', 'Um aroma cinematografico que evoca os bazares de especiarias de Dubai ao entardecer. Oud profundo abracado pela rosa damascena.', '#4B2E24', '#C8A96B'),
  ('p-002', 'Lattafa Khamrah', 'Lattafa', 'Gourmand . Especiarias', 'Canela . Noz-moscada', 'Tamara . Tonka', 'Baunilha . Praline', 219.00, null, 4.8, 587, 18, 'stock', 0, 0, '{bestseller}', 'Doce, cremoso e viciante. A interpretacao moderna do gourmand arabe.', '#5A1E2A', '#E5C98A'),
  ('p-003', 'Asad Al Lail', 'Al Wataniah', 'Couro . Amadeirado', 'Pimenta Rosa', 'Couro . Iris', 'Patchouli . Cedro', 199.90, 259.90, 4.7, 244, 0, 'preorder', 18, 50, '{exclusive}', 'Magnetismo escuro: couro polido e madeiras nobres em equilibrio sensual.', '#1A130A', '#C8A96B'),
  ('p-004', 'Ameer Al Oud', 'Lattafa', 'Oud . Floral', 'Acafrao . Pimenta', 'Oud . Jasmim', 'Sandalo . Ambar', 259.00, null, 4.9, 198, 32, 'stock', 0, 0, '{new,exclusive}', 'A heranca do Oud em sua forma mais refinada, com floracao noturna ao centro.', '#4D5B43', '#E5C98A'),
  ('p-005', 'Yara Tous', 'Lattafa', 'Frutal . Floral . Doce', 'Tangerina . Pera', 'Orquidea . Heliotropio', 'Baunilha . Sandalo', 179.90, 219.90, 4.8, 921, 47, 'stock', 0, 0, '{bestseller}', 'A assinatura feminina que conquistou o Brasil. Doce, viciante e elegante.', '#D8C3A5', '#5A1E2A'),
  ('p-006', 'Maahir Black Edition', 'Lattafa', 'Tabaco . Frutal', 'Maca . Pimenta Rosa', 'Tabaco . Canela', 'Patchouli . Baunilha', 269.90, null, 4.7, 153, 0, 'preorder', 21, 50, '{exclusive}', 'A reinterpretacao da assinatura de tabaco doce, com brilho frutal e amadeirado denso.', '#0D0D0D', '#C8A96B'),
  ('p-007', 'Badee Al Oud Amethyst', 'Lattafa', 'Oud . Resinoso', 'Acafrao . Cardamomo', 'Oud . Ambar', 'Almiscar . Patchouli', 339.00, 399.00, 4.9, 412, 14, 'stock', 0, 0, '{bestseller,exclusive}', 'Profundidade resinosa em um frasco joia. Para momentos de aura premium.', '#4B2E24', '#C8A96B'),
  ('p-008', 'Mukhallat Maliki', 'Lattafa', 'Especiarias . Oud', 'Cardamomo . Acafrao', 'Rosa . Oud', 'Ambar . Almiscar', 229.00, null, 4.6, 87, 0, 'preorder', 14, 50, '{new}', 'Mistura aromatica tradicional na construcao, contemporanea no acabamento.', '#5A1E2A', '#E5C98A');

-- Seed: pedidos demo
insert into fp_orders (id, customer, phone, city, items, total, paid, kind, status, created_at) values
  ('F-1042', 'Mariana Souza', '(81) 99876-1234', 'Recife . PE', 2, 488.80, 488.80, 'stock', 'Pago', '2026-05-16T14:22:00Z'),
  ('F-1041', 'Camila Pereira', '(81) 99812-5544', 'Olinda . PE', 1, 219.00, 219.00, 'stock', 'Em separacao', '2026-05-16T11:09:00Z'),
  ('F-1040', 'Leticia Andrade', '(83) 99700-1166', 'Joao Pessoa . PB', 3, 689.90, 344.95, 'preorder', 'Sinal pago', '2026-05-15T18:40:00Z'),
  ('F-1039', 'Beatriz Lima', '(81) 99988-2244', 'Caruaru . PE', 1, 339.00, 339.00, 'stock', 'Entregue', '2026-05-14T09:11:00Z'),
  ('F-1038', 'Renata Castro', '(82) 99811-7733', 'Maceio . AL', 2, 458.90, 229.45, 'preorder', 'Aguardando saldo', '2026-05-14T08:01:00Z');

-- Seed: promos
insert into fp_promos (id, code, title, description, discount_pct, free_shipping, active, valid_until, applies_to) values
  ('pm-001', 'FERNANDA10', '10% OFF na primeira compra', 'Use o cupom no checkout para um desconto especial de boas-vindas.', 10, false, true, '2026-06-30', 'all'),
  ('pm-002', 'OUDLOVERS', 'Frete gratis na colecao Oud', 'Para os apaixonados pelo aroma mais nobre do oriente.', 0, true, false, '2026-07-15', 'oud');
