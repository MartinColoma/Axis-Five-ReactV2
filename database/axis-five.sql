-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.user_sessions (
  id bigint NOT NULL DEFAULT nextval('user_sessions_id_seq'::regclass),
  user_id bigint NOT NULL,
  session_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  last_activity timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  user_id character varying NOT NULL UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  username character varying NOT NULL UNIQUE,
  password character varying NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'customer'::user_role,
  status USER-DEFINED NOT NULL DEFAULT 'active'::user_status,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  last_login timestamp without time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users_archived (
  id bigint NOT NULL DEFAULT nextval('users_archived_id_seq'::regclass),
  user_id character varying NOT NULL,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  email character varying NOT NULL,
  username character varying NOT NULL,
  password character varying NOT NULL,
  role USER-DEFINED NOT NULL,
  status USER-DEFINED NOT NULL,
  created_at timestamp without time zone NOT NULL,
  updated_at timestamp without time zone NOT NULL,
  last_login timestamp without time zone,
  archived_at timestamp without time zone NOT NULL DEFAULT now(),
  archived_by character varying,
  archive_reason text,
  original_id bigint NOT NULL,
  CONSTRAINT users_archived_pkey PRIMARY KEY (id)
);