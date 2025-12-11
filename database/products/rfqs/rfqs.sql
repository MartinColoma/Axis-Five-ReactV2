drop table if exists public.rfq_items cascade;

drop table if exists public.rfqs cascade;

-- =========================
-- RFQ HEADER
-- =========================
create table
    public.rfqs (
        id bigserial primary key,
        user_id bigint references public.users (id) on delete set null,
        company_name text,
        contact_name text,
        contact_email text,
        contact_phone text,
        use_case text,
        site_info text,
        additional_notes text,
        status text not null default 'PENDING_REVIEW',
        -- status text not null default 'PENDING_REVIEW'
        -- 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'QUOTE_SENT' | 'PARTIALLY_QUOTED'
        -- | 'REJECTED_BY_ADMIN' | 'REJECTED_BY_CUSTOMER'
        -- | 'EXPIRED' | 'CONVERTED_TO_ORDER'
        currency text not null default 'PHP',
        price_valid_until timestamptz,
        overall_lead_time_days integer,
        admin_notes text,
        created_at timestamptz not null default now (),
        updated_at timestamptz not null default now ()
    );

create index if not exists idx_rfqs_user_id on public.rfqs (user_id);

create index if not exists idx_rfqs_status on public.rfqs (status);

-- =========================
-- RFQ LINE ITEMS
-- =========================
create table
    public.rfq_items (
        id bigserial primary key,
        rfq_id bigint not null references public.rfqs (id) on delete cascade,
        product_id bigint not null references public.products (id) on delete restrict,
        quantity integer not null check (quantity > 0),
        quoted_unit_price numeric(12, 2),
        quoted_total_price numeric(12, 2),
        currency text not null default 'PHP',
        line_lead_time_days integer,
        line_status text not null default 'PENDING_REVIEW',
        -- 'PENDING_REVIEW' | 'QUOTED' | 'APPROVED' | 'REJECTED'
        line_notes text,
        created_at timestamptz not null default now (),
        updated_at timestamptz not null default now ()
    );

create index if not exists idx_rfq_items_rfq_id on public.rfq_items (rfq_id);

create index if not exists idx_rfq_items_product_id on public.rfq_items (product_id);

create index if not exists idx_rfq_items_status on public.rfq_items (line_status);