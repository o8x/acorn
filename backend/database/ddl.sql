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
    params             TEXT          default '' not null,
    auth_type          varchar(16)   default 'password' not null,
    last_use_timestamp INT           default 0 not null,
    create_time        timestamp     default CURRENT_TIMESTAMP not null,
    tags               varchar(1000) default '[]' not null
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
    title       TEXT      default '' not null,
    description TEXT      default '' not null,
    command     TEXT      default '' not null, -- 要执行的命令
    result      TEXT      default '' not null, -- 执行结果
    status      int       default 0 not null,  -- "0 进行中，1 已完成，2 已过期，3 已取消，重试则复制一条相同的任务"
    create_time timestamp default CURRENT_TIMESTAMP not null
);
