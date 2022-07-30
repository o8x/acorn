-- auto-generated definition
create table connect
(
    id                 INTEGER
        primary key autoincrement,
    type               varchar(16)   default 'linux' not null,
    label              varchar(256)  default ''      not null,
    username           varchar(256)  default ''      not null,
    password           TEXT          default '',
    port               INT           default 22      not null,
    host               TEXT          default '',
    private_key        TEXT          default '',
    params             TEXT          default '',
    auth_type          varchar(16)   default 'private_key',
    last_use_timestamp INT           default 0       not null,
    create_time        timestamp     default CURRENT_TIMESTAMP,
    tags               varchar(1000) default '[]' not null
);

-- auto-generated definition
create table tags
(
    id          INTEGER
        primary key autoincrement,
    name        varchar(256) default '' not null,
    create_time timestamp    default CURRENT_TIMESTAMP
);

