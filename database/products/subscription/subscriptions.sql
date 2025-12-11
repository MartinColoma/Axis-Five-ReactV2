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