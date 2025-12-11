-- Cart "header" – one active cart per user (optional for guests)
create table
    public.cart_sessions (
        id bigserial primary key,
        user_id bigint references public.users (id) on delete cascade,
        -- for guests, you can store a random token from cookies/localStorage
        guest_token text unique,
        status text not null default 'ACTIVE',
        -- 'ACTIVE' | 'CONVERTED_TO_ORDER' | 'ABANDONED'
        created_at timestamptz not null default now (),
        updated_at timestamptz not null default now ()
    );

create index if not exists idx_cart_sessions_user_id on public.cart_sessions (user_id);

create index if not exists idx_cart_sessions_guest_token on public.cart_sessions (guest_token);

create index if not exists idx_cart_sessions_status on public.cart_sessions (status);

-- Cart line items
create table
    public.cart_items (
        id bigserial primary key,
        cart_id bigint not null references public.cart_sessions (id) on delete cascade,
        product_id bigint not null references public.products (id) on delete restrict,
        quantity integer not null check (quantity > 0),
        -- snapshot of price at time of adding, optional but useful
        unit_price numeric(12, 2),
        currency text not null default 'PHP',
        created_at timestamptz not null default now (),
        updated_at timestamptz not null default now (),
        constraint unique_cart_product unique (cart_id, product_id)
    );

alter table public.cart_items
add column status text not null default 'ACTIVE';

-- e.g. 'ACTIVE' | 'RFQED' | 'REMOVED'
create index if not exists idx_cart_items_status on public.cart_items (status);

create index if not exists idx_cart_items_cart_id on public.cart_items (cart_id);

create index if not exists idx_cart_items_product_id on public.cart_items (product_id);