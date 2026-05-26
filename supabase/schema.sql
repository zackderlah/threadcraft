-- Run this in your Supabase SQL editor before launching.

-- Required by some Supabase deployments
create extension if not exists "uuid-ossp";

-- ── Auth.js required tables ──────────────────────────────────────────────────

create table users (
  id              uuid         not null default uuid_generate_v4(),
  name            text,
  email           text unique,
  "emailVerified" timestamptz,
  image           text,
  password_hash   text,        -- null for OAuth users, hashed for email/password users
  is_pro          boolean      not null default false,
  primary key (id)
);

create table accounts (
  id                  uuid  not null default uuid_generate_v4(),
  type                text  not null,
  provider            text  not null,
  "providerAccountId" text  not null,
  refresh_token       text,
  access_token        text,
  expires_at          bigint,
  token_type          text,
  scope               text,
  id_token            text,
  session_state       text,
  "userId"            uuid  not null,
  primary key (id),
  foreign key ("userId") references users(id) on delete cascade,
  unique (provider, "providerAccountId")
);

create table sessions (
  id             uuid        not null default uuid_generate_v4(),
  "sessionToken" text        not null unique,
  expires        timestamptz not null,
  "userId"       uuid        not null,
  primary key (id),
  foreign key ("userId") references users(id) on delete cascade
);

create table verification_tokens (
  identifier text        not null,
  token      text        not null,
  expires    timestamptz not null,
  primary key (identifier, token)
);

-- ── ThreadCraft custom tables ─────────────────────────────────────────────────

create table threads (
  id            uuid        not null default uuid_generate_v4(),
  user_id       uuid        not null references users(id) on delete cascade,
  tone          text        not null,
  length        text        not null,
  tweet_count   integer     not null,
  tweets        jsonb       not null,
  input_preview text,
  created_at    timestamptz not null default now(),
  primary key (id)
);

create index on threads (user_id, created_at desc);
