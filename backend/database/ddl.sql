create table connect
(
    id                 integer primary key autoincrement,
    type               varchar(16)  default 'linux' not null,
    label              varchar(256) default '' not null,
    username           varchar(256) default '' not null,
    password           text         default '',
    port               int          default 22 not null,
    host               text         default '',
    private_key        text         default '',
    params             text         default '',
    auth_type          varchar(16)  default 'private_key',
    last_use_timestamp int          default 0 not null,
    create_time        timestamp    default CURRENT_TIMESTAMP
);
