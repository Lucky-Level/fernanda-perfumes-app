-- Adicionar coluna image_url na tabela fp_products
alter table fp_products add column if not exists image_url text;

-- Criar bucket para imagens da Fernanda (se nao existir, usar o existente)
-- O bucket product-images ja existe do barber-booking, vamos reutilizar
-- As imagens da Fernanda ficam na pasta fernanda/ dentro do bucket

-- Se o bucket NAO existir, descomente a linha abaixo:
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict do nothing;
