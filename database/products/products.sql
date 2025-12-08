create table public.products (
  id                   bigserial primary key,
  sku                  text not null unique,
  name                 text not null,
  slug                 text not null unique,
  short_description    text,
  description          text,
  category             text,
  brand                text,

  -- business model
  pricing_model        text not null default 'hardware_plus_subscription',
  -- 'one_time_hardware' | 'hardware_plus_subscription' | 'subscription_only'

  base_price           numeric(12,2),
  currency             text not null default 'PHP',

  is_iot_connected     boolean not null default true,
  requires_subscription boolean not null default false,

  stock_quantity       integer not null default 0,
  stock_status         text not null default 'in_stock',
  -- 'in_stock' | 'low_stock' | 'out_of_stock' | 'made_to_order'

  lead_time_days       integer,
  min_order_qty        integer not null default 1,

  main_image_url       text,
  gallery_image_urls   text[],

  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_products_category   on public.products (category);
create index if not exists idx_products_is_active  on public.products (is_active);
