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
create table if not exists auth_strike_record
(
    id          bigint generated always as identity primary key,
    user_id     bigint      not null,
    operator_id bigint,
    reason      text        not null,
    evidence    text        not null,
    point       smallint    not null default 1,
    status      smallint    not null default 0,
    created_at  timestamptz not null default current_timestamp,
    attr        jsonb       not null default '{}'::jsonb
);

create index if not exists idx_user_id on auth_strike_record (user_id);
create index if not exists idx_created_at on auth_strike_record (created_at);
create index if not exists idx_type_status on auth_strike_record (status);

comment on table auth_strike_record is '用户违规记录表';
comment on column auth_strike_record.point is '扣分点数,默认1分';
comment on column auth_strike_record.status is '处罚状态: 0-生效中, 1-已撤销';
