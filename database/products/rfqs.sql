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