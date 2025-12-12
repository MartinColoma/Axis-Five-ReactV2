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