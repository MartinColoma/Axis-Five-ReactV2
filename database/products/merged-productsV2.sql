-- =========================
-- DROP TABLES (children → parents)
-- =========================
drop table if exists public.cart_items        cascade;
drop table if exists public.cart_sessions     cascade;

drop table if exists public.order_items       cascade;
drop table if exists public.orders            cascade;

drop table if exists public.rfq_items         cascade;
drop table if exists public.rfqs              cascade;

drop table if exists public.subscriptions     cascade;
drop table if exists public.product_reviews   cascade;
drop table if exists public.product_units     cascade;

drop table if exists public.products          cascade;

-- =========================
-- PRODUCTS
-- =========================
create table public.products (
  id                   bigserial primary key,
  sku                  text not null unique,
  name                 text not null,
  slug                 text not null unique,
  short_description    text,
  description          text,
  category             text,
  brand                text,

  pricing_model        text not null default 'hardware_plus_subscription',
  base_price           numeric(12,2),
  currency             text not null default 'PHP',

  is_iot_connected     boolean not null default true,
  requires_subscription boolean not null default false,

  stock_quantity       integer not null default 0,
  stock_status         text not null default 'in_stock',
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

-- =========================
-- RFQ HEADER
-- =========================
create table public.rfqs (
  id                   bigserial primary key,
  user_id              bigint references public.users (id) on delete set null,

  company_name         text,
  contact_name         text,
  contact_email        text,
  contact_phone        text,

  use_case             text,
  site_info            text,
  additional_notes     text,

  status               text not null default 'PENDING_REVIEW',
  -- 'PENDING_REVIEW' | 'QUOTE_SENT' | 'PARTIALLY_QUOTED'
  -- | 'REJECTED_BY_ADMIN' | 'REJECTED_BY_CUSTOMER'
  -- | 'EXPIRED' | 'CONVERTED_TO_ORDER'

  currency             text not null default 'PHP',
  price_valid_until    timestamptz,
  overall_lead_time_days integer,
  admin_notes          text,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_rfqs_user_id   on public.rfqs (user_id);
create index if not exists idx_rfqs_status    on public.rfqs (status);

-- =========================
-- RFQ LINE ITEMS
-- =========================
create table public.rfq_items (
  id                   bigserial primary key,
  rfq_id               bigint not null references public.rfqs (id) on delete cascade,
  product_id           bigint not null references public.products (id) on delete restrict,

  quantity             integer not null check (quantity > 0),

  quoted_unit_price    numeric(12,2),
  quoted_total_price   numeric(12,2),
  currency             text not null default 'PHP',

  line_lead_time_days  integer,

  line_status          text not null default 'PENDING_REVIEW',
  -- 'PENDING_REVIEW' | 'QUOTED' | 'APPROVED' | 'REJECTED'

  line_notes           text,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_rfq_items_rfq_id      on public.rfq_items (rfq_id);
create index if not exists idx_rfq_items_product_id  on public.rfq_items (product_id);
create index if not exists idx_rfq_items_status      on public.rfq_items (line_status);

-- =========================
-- ORDERS HEADER
-- =========================
create table public.orders (
  id                   bigserial primary key,
  user_id              bigint references public.users (id) on delete set null,
  rfq_id               bigint references public.rfqs (id) on delete set null,

  total_price          numeric(12, 2) not null,
  currency             text not null default 'PHP',

  pickup_location      text not null default 'Main Store',
  pickup_instructions  text,

  status               text not null default 'AWAITING_PICKUP',
  -- 'AWAITING_PICKUP' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED'

  payment_method       text not null default 'IN_STORE',
  payment_status       text not null default 'UNPAID',
  -- 'UNPAID' | 'PAID'

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_orders_user_id on public.orders (user_id);
create index if not exists idx_orders_status  on public.orders (status);
create index if not exists idx_orders_rfq_id  on public.orders (rfq_id);

-- =========================
-- ORDER LINE ITEMS
-- =========================
create table public.order_items (
  id                   bigserial primary key,
  order_id             bigint not null references public.orders (id) on delete cascade,
  product_id           bigint not null references public.products (id) on delete restrict,

  quantity             integer not null check (quantity > 0),

  unit_price           numeric(12,2) not null,
  line_total           numeric(12,2) not null,
  currency             text not null default 'PHP',

  rfq_item_id          bigint references public.rfq_items (id) on delete set null,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_order_items_order_id   on public.order_items (order_id);
create index if not exists idx_order_items_product_id on public.order_items (product_id);

-- =========================
-- SUBSCRIPTIONS
-- =========================
create table public.subscriptions (
  id                   bigserial primary key,
  user_id              bigint not null references public.users (id) on delete cascade,
  product_id           bigint not null references public.products (id) on delete restrict,
  order_id             bigint references public.orders (id) on delete set null,

  status               text not null default 'ACTIVE',
  billing_period       text not null default 'MONTHLY',
  -- 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

  current_start_at     timestamptz not null,
  current_end_at       timestamptz not null,
  next_billing_at      timestamptz,

  price_per_period     numeric(12, 2) not null,
  currency             text not null default 'PHP',

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_subscriptions_user_id    on public.subscriptions (user_id);
create index if not exists idx_subscriptions_product_id on public.subscriptions (product_id);
create index if not exists idx_subscriptions_status     on public.subscriptions (status);

-- =========================
-- REVIEWS
-- =========================
create table public.product_reviews (
  id                   bigserial primary key,
  product_id           bigint not null references public.products (id) on delete cascade,
  user_id              bigint not null references public.users (id) on delete cascade,

  rating               integer not null check (rating between 1 and 5),
  title                text,
  comment              text,
  is_approved          boolean not null default true,
  is_public            boolean not null default true,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint unique_product_user_review unique (product_id, user_id)
);

create index if not exists idx_product_reviews_product_id on public.product_reviews (product_id);
create index if not exists idx_product_reviews_user_id    on public.product_reviews (user_id);

-- =========================
-- PRODUCT UNITS
-- =========================
create table public.product_units (
  id                   bigserial primary key,
  product_id           bigint not null references public.products (id) on delete cascade,
  machine_id           text not null unique,
  status               text not null default 'IN_STOCK',
  -- 'IN_STOCK' | 'RESERVED' | 'SOLD' | 'RETIRED'

  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_product_units_product_id on public.product_units (product_id);
create index if not exists idx_product_units_status     on public.product_units (status);

-- =========================
-- CART
-- =========================
create table public.cart_sessions (
  id                   bigserial primary key,
  user_id              bigint references public.users (id) on delete cascade,
  guest_token          text unique,

  status               text not null default 'ACTIVE',
  -- 'ACTIVE' | 'CONVERTED_TO_ORDER' | 'ABANDONED'

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_cart_sessions_user_id     on public.cart_sessions (user_id);
create index if not exists idx_cart_sessions_guest_token on public.cart_sessions (guest_token);
create index if not exists idx_cart_sessions_status      on public.cart_sessions (status);

create table public.cart_items (
  id                   bigserial primary key,
  cart_id              bigint not null references public.cart_sessions (id) on delete cascade,
  product_id           bigint not null references public.products (id) on delete restrict,

  quantity             integer not null check (quantity > 0),

  unit_price           numeric(12,2),
  currency             text not null default 'PHP',

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint unique_cart_product unique (cart_id, product_id)
);
alter table public.cart_items
  add column status text not null default 'ACTIVE';
-- e.g. 'ACTIVE' | 'RFQED' | 'REMOVED'
create index if not exists idx_cart_items_status
  on public.cart_items (status);

create index if not exists idx_cart_items_cart_id    on public.cart_items (cart_id);
create index if not exists idx_cart_items_product_id on public.cart_items (product_id);

-- =========================
-- PAYMENTS (header)
-- =========================
create table
    if not exists public.payments (
        id bigserial primary key,
        order_id bigint not null references public.orders (id) on delete cascade,
        -- Cash-only for now; keeps door open later
        payment_method text not null default 'CASH',
        -- e.g. 'CASH' | 'GCASH' | 'CARD' | 'IN_STORE' (future)
        status text not null default 'CAPTURED',
        -- e.g. 'PENDING' | 'CAPTURED' | 'VOIDED' | 'REFUNDED'
        currency text not null default 'PHP',
        amount_due numeric(12, 2) not null, -- snapshot at time of payment
        amount_received numeric(12, 2) not null, -- cash tendered
        change_given numeric(12, 2) not null default 0,
        note text,
        created_by bigint references public.users (id) on delete set null,
        created_at timestamptz not null default now ()
    );

create index if not exists idx_payments_order_id on public.payments (order_id);

create index if not exists idx_payments_created_at on public.payments (created_at);

create index if not exists idx_payments_status on public.payments (status);

-- Basic cash validation
alter table public.payments
add constraint payments_amounts_valid check (
    amount_due >= 0
    and amount_received >= 0
    and change_given >= 0
    and amount_received + 0.00001 >= amount_due
    and change_given = round(amount_received - amount_due, 2)
);

-- =========================
-- PAYMENT ITEMS (optional)
-- =========================
create table
    if not exists public.payment_items (
        id bigserial primary key,
        payment_id bigint not null references public.payments (id) on delete cascade,
        order_item_id bigint not null references public.order_items (id) on delete restrict,
        quantity integer not null check (quantity > 0),
        line_total numeric(12, 2) not null check (line_total >= 0),
        currency text not null default 'PHP',
        created_at timestamptz not null default now (),
        constraint unique_payment_order_item unique (payment_id, order_item_id)
    );

create index if not exists idx_payment_items_payment_id on public.payment_items (payment_id);

create index if not exists idx_payment_items_order_item_id on public.payment_items (order_item_id);