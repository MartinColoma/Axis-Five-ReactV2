drop table if exists public.order_items cascade;

drop table if exists public.orders cascade;

-- =========================
-- ORDERS HEADER
-- =========================
create table
    public.orders (
        id bigserial primary key,
        user_id bigint references public.users (id) on delete set null,
        rfq_id bigint references public.rfqs (id) on delete set null,
        total_price numeric(12, 2) not null,
        currency text not null default 'PHP',
        pickup_location text not null default 'Main Store',
        pickup_instructions text,
        status text not null default 'AWAITING_PICKUP',
        -- 'AWAITING_PICKUP' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED'
        payment_method text not null default 'IN_STORE',
        payment_status text not null default 'UNPAID',
        -- 'UNPAID' | 'PAID'
        created_at timestamptz not null default now (),
        updated_at timestamptz not null default now ()
    );

create index if not exists idx_orders_user_id on public.orders (user_id);

create index if not exists idx_orders_status on public.orders (status);

create index if not exists idx_orders_rfq_id on public.orders (rfq_id);

-- =========================
-- ORDER LINE ITEMS
-- =========================
create table
    public.order_items (
        id bigserial primary key,
        order_id bigint not null references public.orders (id) on delete cascade,
        product_id bigint not null references public.products (id) on delete restrict,
        quantity integer not null check (quantity > 0),
        unit_price numeric(12, 2) not null,
        line_total numeric(12, 2) not null,
        currency text not null default 'PHP',
        rfq_item_id bigint references public.rfq_items (id) on delete set null,
        created_at timestamptz not null default now (),
        updated_at timestamptz not null default now ()
    );

create index if not exists idx_order_items_order_id on public.order_items (order_id);

create index if not exists idx_order_items_product_id on public.order_items (product_id);

alter table public.orders
add column if not exists paid_at timestamptz;