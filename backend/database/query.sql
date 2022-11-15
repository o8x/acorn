/*SESSION ---------------------------------------------------------------------*/

-- name: UpdateSessionUseTime :exec
update connect
set last_use_timestamp = strftime('%s', 'now')
where id = ?;

-- name: FindSession :one
select *
from connect
where id = ?
limit 1;


-- name: DeleteSession :exec
delete
from connect
where id = ?;

-- name: QuerySessions :many
select *
from connect
where host like ?
   or username like ?
   or label like ?
order by last_use_timestamp = 0 desc, last_use_timestamp desc;

-- name: GetSessions :many
select *
from connect
order by last_use_timestamp = 0 desc, last_use_timestamp desc;

-- name: CreateSession :exec
insert into connect (type, label, username, password, port, host, private_key, tags, proxy_server_id, params, auth_type)
values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- name: UpdateSession :exec
update connect
set type            = ?,
    label           = ?,
    username        = ?,
    password        = ?,
    port            = ?,
    host            = ?,
    private_key     = ?,
    tags            = ?,
    proxy_server_id = ?,
    params          = ?,
    auth_type       = ?
where id = ?;

-- name: UpdateSessionLabel :exec
update connect
set label = ?
where id = ?;

/*TASKS ---------------------------------------------------------------------*/

-- name: CreateTask :exec
insert into tasks (title, command, result, status)
values (?, ?, ?, ?);

-- name: CopyTask :exec
insert into tasks (title, command, result, status)
select title, command, result, status
from tasks
where tasks.id = ?;

-- name: GetTasks :many
select *
from tasks
order by id desc;

-- name: GetNormalTasks :many
select *
from tasks
where status = 0
order by id desc;

-- name: TaskCancel :exec
update tasks
set status = 3
where id = ?;

-- name: TaskTimeout :exec
update tasks
set status = 2
where id = ?;

-- name: TaskDone :exec
update tasks
set status = 1
where id = ?;

-- name: UpdateTask :exec
update tasks
set title   = ?,
    command = ?,
    result  = ?,
    status  = ?
where id = ?;

-- name: CloseTask :exec
update tasks
set result = ?,
    status = 1
where id = ?;

/*CONFIG ---------------------------------------------------------------------*/

-- name: InitStatsKey :exec
insert into config (key, value)
values ('connect_sum_count', 0);
insert into config (key, value)
values ('connect_rdp_sum_count', 0);
insert into config (key, value)
values ('ping_sum_count', 0);
insert into config (key, value)
values ('top_sum_count', 0);
insert into config (key, value)
values ('scp_upload_sum_count', 0);
insert into config (key, value)
values ('scp_upload_base64_sum_count"', 0);
insert into config (key, value)
values ('scp_download_sum_count', 0);
insert into config (key, value)
values ('scp_cloud_download_sum_count', 0);
insert into config (key, value)
values ('local_iterm_sum_count', 0);
insert into config (key, value)
values ('import_rdp_sum_count', 0);
insert into config (key, value)
values ('file_transfer_sum_count', 0);
insert into config (key, value)
values ('copy_id_sum_count', 0);
insert into config (key, value)
values ('edit_file_sum_count', 0);
insert into config (key, value)
values ('delete_file_sum_count', 0);

-- name: StatsIncConnectSSH :exec
update config
set value = (value + 1)
where key = 'connect_sum_count';

-- name: StatsIncConnectRDP :exec
update config
set value = (value + 1)
where key = 'connect_rdp_sum_count';

-- name: StatsIncPing :exec
update config
set value = (value + 1)
where key = 'ping_sum_count';

-- name: StatsIncTop :exec
update config
set value = (value + 1)
where key = 'top_sum_count';

-- name: StatsIncScpUpload :exec
update config
set value = (value + 1)
where key = 'scp_upload_sum_count';

-- name: StatsIncScpUploadBase64 :exec
update config
set value = (value + 1)
where key = 'scp_upload_base64_sum_count"';

-- name: StatsIncScpDown :exec
update config
set value = (value + 1)
where key = 'scp_download_sum_count';

-- name: StatsIncScpCloudDown :exec
update config
set value = (value + 1)
where key = 'scp_cloud_download_sum_count';

-- name: StatsIncLocalITerm :exec
update config
set value = (value + 1)
where key = 'local_iterm_sum_count';

-- name: StatsIncLoadRDP :exec
update config
set value = (value + 1)
where key = 'import_rdp_sum_count';

-- name: StatsIncFileTransfer :exec
update config
set value = (value + 1)
where key = 'file_transfer_sum_count';

-- name: StatsIncCopyID :exec
update config
set value = (value + 1)
where key = 'copy_id_sum_count';

-- name: StatsIncEditFile :exec
update config
set value = (value + 1)
where key = 'edit_file_sum_count';

-- name: StatsIncDeleteFile :exec
update config
set value = (value + 1)
where key = 'delete_file_sum_count';
