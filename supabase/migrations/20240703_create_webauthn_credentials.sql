create table if not exists webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  credential_id text not null unique,
  public_key text not null,
  counter integer not null,
  transports text[],
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists webauthn_credentials_user_id_idx on webauthn_credentials(user_id); 