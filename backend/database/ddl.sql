-- auto-generated definition
create table if not exists connect
(
    id                 INTEGER
        primary key autoincrement,
    type               varchar(16)   default 'linux' not null,
    label              varchar(256)  default '' not null,
    username           varchar(256)  default '' not null,
    password           TEXT          default '' not null,
    port               INT           default 22 not null,
    host               TEXT          default '' not null,
    private_key        TEXT          default '' not null,
    tags               varchar(1000) default '[]' not null,
    proxy_server_id    INT           default 0 not null,
    params             TEXT          default '' not null,
    auth_type          varchar(16)   default 'password' not null,
    last_use_timestamp INT           default 0 not null,
    create_time        timestamp     default CURRENT_TIMESTAMP not null
);

-- auto-generated definition
create table if not exists tags
(
    id          INTEGER
        primary key autoincrement,
    name        varchar(256) default '' not null,
    create_time timestamp    default CURRENT_TIMESTAMP not null
);

create unique index if not exists uniq_key on config (key);

create table if not exists config
(
    key         TEXT      default '' not null,
    value       TEXT      default '' not null,
    create_time timestamp default CURRENT_TIMESTAMP not null
);


create table if not exists recent
(
    id          INTEGER primary key autoincrement,
    type        varchar(16) default 'later' not null,
    label       TEXT        default '' not null,
    url         TEXT        default '' not null,
    logo_url    TEXT        default '' not null,
    is_delete   int         default 0 not null,
    create_time timestamp   default CURRENT_TIMESTAMP not null
);

create table if not exists tasks
(
    id          INTEGER primary key autoincrement,
    uuid        varchar(36) default (lower(
                hex(randomblob(4)) || '-' ||
                hex(randomblob(2)) || '-' ||
                hex(randomblob(2)) || '-' ||
                hex(randomblob(2)) || '-' ||
                hex(randomblob(6))
        )) not null,
    title       TEXT        default '' not null,
    description TEXT        default '' not null,
    command     TEXT        default '' not null,        -- 要执行的命令
    result      TEXT        default '' not null,        -- 执行结果
    status      varchar(32) default 'running' not null, -- running 进行中，success 执行成功，timeout 超时, error 执行错误, canceled 已取消，重试则复制一条相同的任务
    create_time timestamp   default CURRENT_TIMESTAMP not null
);

create table if not exists automation
(
    id              INTEGER primary key autoincrement,
    name            TEXT      default '' not null,
    desc            TEXT      default '' not null,
    playbook        TEXT      default '' not null,
    run_count       int       default 0 not null,
    bind_session_id TEXT      default '[]' not null,
    create_time     timestamp default CURRENT_TIMESTAMP not null
);

create table if not exists automation
(
    id              INTEGER primary key autoincrement,
    name            TEXT      default '' not null,
    desc            TEXT      default '' not null,
    playbook        TEXT      default '' not null,
    run_count       int       default 0 not null,
    bind_session_id TEXT      default '[]' not null,
    create_time     timestamp default CURRENT_TIMESTAMP not null
);

create table if not exists automation_logs
(
    id            INTEGER primary key autoincrement,
    automation_id int       default 0 not null,
    contents      TEXT      default '' not null,
    create_time   timestamp default CURRENT_TIMESTAMP not null
);
