-- products
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

-- RFQs
create table
    public.rfqs (
        id bigserial primary key,
        user_id bigint references public.users (id) on delete set null,
        product_id bigint not null references public.products (id) on delete cascade,
        quantity integer not null default 1,
        company_name text,
        contact_name text,
        contact_email text,
        contact_phone text,
        use_case text,
        site_info text,
        additional_notes text,
        status text not null default 'PENDING_REVIEW',
        -- 'PENDING_REVIEW' | 'QUOTE_SENT' | 'REJECTED_BY_ADMIN'
        -- | 'REJECTED_BY_CUSTOMER' | 'EXPIRED' | 'CONVERTED_TO_ORDER'
        quoted_price numeric(12, 2),
        currency text not null default 'PHP',
        price_valid_until timestamptz,
        lead_time_days integer,
        admin_notes text,
        created_at timestamptz not null default now (),
        updated_at timestamptz not null default now ()
    );

create index if not exists idx_rfqs_user_id on public.rfqs (user_id);

create index if not exists idx_rfqs_product_id on public.rfqs (product_id);

create index if not exists idx_rfqs_status on public.rfqs (status);

--orders table
create table
    public.orders (
        id bigserial primary key,
        user_id bigint references public.users (id) on delete set null,
        rfq_id bigint references public.rfqs (id) on delete set null,
        product_id bigint not null references public.products (id) on delete restrict,
        quantity integer not null default 1,
        total_price numeric(12, 2) not null,
        currency text not null default 'PHP',
        pickup_location text not null default 'Main Store',
        pickup_instructions text,
        status text not null default 'AWAITING_PICKUP',
        -- 'AWAITING_PICKUP' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED'
        payment_method text not null default 'IN_STORE',
        -- e.g. 'IN_STORE'
        payment_status text not null default 'UNPAID',
        -- 'UNPAID' | 'PAID'
        created_at timestamptz not null default now (),
        updated_at timestamptz not null default now ()
    );

create index if not exists idx_orders_user_id on public.orders (user_id);

create index if not exists idx_orders_status on public.orders (status);

create index if not exists idx_orders_rfq_id on public.orders (rfq_id);

-- subscriptions
create table
    public.subscriptions (
        id bigserial primary key,
        user_id bigint not null references public.users (id) on delete cascade,
        product_id bigint not null references public.products (id) on delete restrict,
        order_id bigint references public.orders (id) on delete set null,
        status text not null default 'ACTIVE',
        -- 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'CANCELLED'
        billing_period text not null default 'MONTHLY',
        -- 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
        current_start_at timestamptz not null,
        current_end_at timestamptz not null,
        next_billing_at timestamptz,
        price_per_period numeric(12, 2) not null,
        currency text not null default 'PHP',
        created_at timestamptz not null default now (),
        updated_at timestamptz not null default now ()
    );

create index if not exists idx_subscriptions_user_id on public.subscriptions (user_id);

create index if not exists idx_subscriptions_product_id on public.subscriptions (product_id);

create index if not exists idx_subscriptions_status on public.subscriptions (status);

--reviews
create table
    public.product_reviews (
        id bigserial primary key,
        product_id bigint not null references public.products (id) on delete cascade,
        user_id bigint not null references public.users (id) on delete cascade,
        rating integer not null check (rating between 1 and 5),
        title text,
        comment text,
        is_approved boolean not null default true,
        is_public boolean not null default true,
        created_at timestamptz not null default now (),
        updated_at timestamptz not null default now (),
        constraint unique_product_user_review unique (product_id, user_id)
    );

create index if not exists idx_product_reviews_product_id on public.product_reviews (product_id);

create index if not exists idx_product_reviews_user_id on public.product_reviews (user_id);

-- product units table
create table public.product_units (
  id              bigserial primary key,
  product_id      bigint not null references public.products (id) on delete cascade,
  machine_id      text not null unique,  -- auto-generated device/unit ID
  status          text not null default 'IN_STOCK', -- 'IN_STOCK' | 'RESERVED' | 'SOLD' | 'RETIRED'
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_product_units_product_id
  on public.product_units (product_id);

create index if not exists idx_product_units_status
  on public.product_units (status);

-- carts table
-- Cart "header" – one active cart per user (optional for guests)
create table public.cart_sessions (
  id          bigserial primary key,
  user_id     bigint references public.users (id) on delete cascade,
  -- for guests, you can store a random token from cookies/localStorage
  guest_token text unique,
  status      text not null default 'ACTIVE',
  -- 'ACTIVE' | 'CONVERTED_TO_ORDER' | 'ABANDONED'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_cart_sessions_user_id
  on public.cart_sessions (user_id);

create index if not exists idx_cart_sessions_guest_token
  on public.cart_sessions (guest_token);

create index if not exists idx_cart_sessions_status
  on public.cart_sessions (status);


-- Cart line items
create table public.cart_items (
  id          bigserial primary key,
  cart_id     bigint not null references public.cart_sessions (id) on delete cascade,
  product_id  bigint not null references public.products (id) on delete restrict,
  quantity    integer not null check (quantity > 0),
  -- snapshot of price at time of adding, optional but useful
  unit_price  numeric(12,2),
  currency    text not null default 'PHP',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint unique_cart_product unique (cart_id, product_id)
);

create index if not exists idx_cart_items_cart_id
  on public.cart_items (cart_id);

create index if not exists idx_cart_items_product_id
  on public.cart_items (product_id);
