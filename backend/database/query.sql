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

/*AUTOMATIONS ------------------------------------------------------------------*/

-- name: GetAutomations :many
select *
from automation
order by id desc;

-- name: FindAutomation :one
select *
from automation
where id = ?
limit 1;

-- name: UpdateAutomationRunCount :exec
update automation
set run_count = (run_count + 1)
where id = ?;

-- name: CreateAutomation :exec
insert into automation (name, desc, playbook, bind_session_id)
values (?, ?, ?, ?);

-- name: DeleteAutomation :exec
delete
from automation
where id = ?;

-- name: UpdateAutomation :exec
update automation
set playbook = ?,
    name     = ?,
    desc     = ?
where id = ?;

-- name: GetLastAutomationLog :one
select *
from automation_logs
where automation_id = ?
order by id desc
limit 1;

-- name: CreateAutomationLog :one
insert into automation_logs (automation_id, contents)
values (?, '')
RETURNING id;

-- name: AppendAutomationLog :exec
update automation_logs
set contents = contents || ?
where id = ?;

/*TASKS ---------------------------------------------------------------------*/

-- name: CreateTask :one
insert into tasks (title, command, description, result, status)
values (?, ?, ?, ?, 'running')
RETURNING *;

-- name: CopyTask :exec
insert into tasks (title, command, result, status)
select title, command, result, status
from tasks
where tasks.id = ?;

-- name: GetTasks :many
select *
from tasks
order by id desc;

-- name: FindTask :one
select *
from tasks
where id = ?
limit 1;

-- name: FindTaskByUUID :one
select *
from tasks
where uuid = ?
limit 1;

-- name: GetNormalTasks :many
select *
from tasks
where status = 'running'
   or status = 'error'
   or status = 'timeout'
order by id desc;

-- name: TaskCancel :exec
update tasks
set status = 'canceled'
where id = ?;

-- name: TaskTimeout :exec
update tasks
set status = 'timeout'
where id = ?;

-- name: TaskSuccess :exec
update tasks
set status = 'success'
where id = ?;

-- name: TaskError :exec
update tasks
set status = 'error',
    result = ?
where id = ?;

-- name: UpdateTask :exec
update tasks
set title   = ?,
    command = ?,
    result  = ?,
    status  = ?
where id = ?;

-- name: UpdateTaskResult :exec
update tasks
set result = ?,
    status = ?
where id = ?;

-- name: CloseTask :exec
update tasks
set result = ?,
    status = 'success'
where id = ?;

/*CONFIG ---------------------------------------------------------------------*/

-- name: CreateConfigKey :exec
insert into config (key, value)
values (?, ?);

-- name: UseLightTheme :exec
update config
set value = 'light'
where key = 'theme';

-- name: UseGrayTheme :exec
update config
set value = 'gray'
where key = 'theme';

-- name: UseDarkTheme :exec
update config
set value = 'dark'
where key = 'theme';

-- name: GetTheme :one
select value
from config
where key = 'theme';

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

/*TAGS-------------------------------------------*/

-- name: GetTags :many
select *
from tags;
