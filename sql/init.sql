create table if not exists auth_user
(
    id         bigint generated always as identity primary key,
    username   varchar(128) not null unique,
    email      varchar(255) not null unique,
    role       varchar(128) not null,
    password   varchar(255) not null,
    created_at timestamptz  not null default current_timestamp,
    last_login timestamptz  not null default current_timestamp,
    attr       jsonb        not null default '{}'::jsonb
);
create table if not exists auth_event
(
    id         bigint generated always as identity primary key,
    action     varchar(128) not null,
    detail     jsonb        not null default '{}'::jsonb,
    created_at timestamptz  not null default current_timestamp
);

create index if not exists idx_auth_event_auth_activity_created_at
    on auth_event (created_at)
    where action in ('login', 'register');

create table if not exists auth_otp
(
    email      varchar(255) not null,
    type       varchar(32)  not null check (type in ('verify', 'reset_password')),
    code_hash  bytea        not null,
    expires_at timestamptz  not null,
    created_at timestamptz  not null default current_timestamp,
    primary key (email, type)
);

create table if not exists auth_setting
(
    key        varchar(128) primary key,
    value      jsonb       not null,
    updated_at timestamptz not null default current_timestamp
);

create table if not exists auth_strike_record
(
    id          bigint generated always as identity primary key,
    user_id     bigint      not null,
    operator_id bigint,
    reason      text        not null,
    evidence    text        not null,
    point       smallint    not null default 1,
    created_at  timestamptz not null default current_timestamp,
    revoked_at  timestamptz,
    revoked_by  bigint,
    attr        jsonb       not null default '{}'::jsonb
);

create index if not exists idx_user_id on auth_strike_record (user_id);
create index if not exists idx_created_at on auth_strike_record (created_at);
comment on table auth_strike_record is '用户违规记录表';
comment on column auth_strike_record.point is '扣分点数,默认1分';
comment on column auth_strike_record.revoked_at is '撤销时间';
comment on column auth_strike_record.revoked_by is '撤销操作人用户 ID';
