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