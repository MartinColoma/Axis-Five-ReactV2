create table
    public.product_units (
        id bigserial primary key,
        product_id bigint not null references public.products (id) on delete cascade,
        machine_id text not null unique, -- auto-generated device/unit ID
        status text not null default 'IN_STOCK', -- 'IN_STOCK' | 'RESERVED' | 'SOLD' | 'RETIRED'
        notes text,
        created_at timestamptz not null default now (),
        updated_at timestamptz not null default now ()
    );

create index if not exists idx_product_units_product_id on public.product_units (product_id);

create index if not exists idx_product_units_status on public.product_units (status);