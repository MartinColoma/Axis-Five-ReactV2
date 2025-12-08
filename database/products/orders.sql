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