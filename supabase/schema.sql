-- 2.1 Enable Required Extensions
create extension if not exists "pgcrypto";

-- 2.2 Create Tables

-- Table: admins (Security Anchor)
create table admins (
  id uuid primary key references auth.users(id) on delete cascade
);
-- Only users listed in this table are Admins
-- Initial Admin must be inserted manually via SQL Editor

-- Table: inventory
create table inventory (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  origin text,
  price numeric not null check (price > 0),
  quantity_available integer default 0 check (quantity_available >= 0),
  quantity_sold integer default 0 check (quantity_sold >= 0),
  image_url text not null,
  created_at timestamptz default now(),
  updated_at timestamptz
);
-- quantity_available must never be negative
-- quantity_sold must only increase
-- stock updates must be atomic at transaction level

-- Table: audit_logs
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  details jsonb,
  actor_id uuid references auth.users(id),
  timestamp timestamptz default now()
);
-- Audit logs are append-only and immutable

-- 2.3 Enable Row Level Security
alter table admins enable row level security;
alter table inventory enable row level security;
alter table audit_logs enable row level security;

-- 2.4 Helper Admin Check (Conceptual)
-- Admin condition used in all policies:
-- exists (select 1 from admins where id = auth.uid())

-- 2.5 RLS Policies

-- admins
create policy "admins_read_self"
on admins
for select
to authenticated
using (auth.uid() = id);
-- No INSERT/UPDATE/DELETE policies
-- Admin table is managed manually

-- inventory
create policy "inventory_read_authenticated"
on inventory
for select
to authenticated
using (true);

create policy "inventory_write_admin"
on inventory
for all
to authenticated
using (
  exists (select 1 from admins where id = auth.uid())
)
with check (
  exists (select 1 from admins where id = auth.uid())
);

-- audit_logs
create policy "audit_insert_admin"
on audit_logs
for insert
to authenticated
with check (
  exists (select 1 from admins where id = auth.uid())
);

create policy "audit_select_admin"
on audit_logs
for select
to authenticated
using (
  exists (select 1 from admins where id = auth.uid())
);
-- No UPDATE or DELETE policies for audit_logs

-- 2.6 Supabase Storage Bucket
insert into storage.buckets (id, name, public)
values ('furniture-images', 'furniture-images', false)
on conflict do nothing;

-- 2.7 Storage Policies
create policy "storage_upload_admin"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'furniture-images'
  and exists (select 1 from admins where id = auth.uid())
);

create policy "storage_read_authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'furniture-images');

-- 🌱 STEP 3: Seed Data (Development Only)
insert into inventory (name, origin, price, quantity_available, image_url)
values
  ('Mahogany Chair', 'India', 4999, 10, 'https://example.com/mahogany-chair.jpg'),
  ('Oak Dining Table', 'USA', 15999, 5, 'https://example.com/oak-table.jpg'),
  ('Leather Sofa', 'Italy', 34999, 2, 'https://example.com/leather-sofa.jpg');
-- Development-only seed data
-- Remove before production
