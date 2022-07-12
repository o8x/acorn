if application "iTerm" is running then
    # iterm 正在运行，创建新窗口并获取其会话
    tell application "iTerm"
        set newWindow to (create window with default profile)
        set _session to current session of current tab of newWindow
    end tell
else
    # iterm 未运行，启动 iterm 并获取默认窗口会话
    tell application "iTerm"
        tell current window
            set _session to current session of current tab
        end tell
    end tell
end if

tell application "iTerm"
    # 命令为空时，直接退出执行
    set commands to "{commands}" as String
    if commands = "" then
        exit
    end if

    # 将命令输入到会话中
    tell _session to write text commands with newline

    # 设置工作目录
    set workdir to "{workdir}" as String
    if workdir = "" then
    else
        set workdir to "cd '{workdir}'"
        tell _session to write text workdir with newline
    end if

    # 循环检查是否需要输入密码
    set completed to false
    set failed to false
    set wait to 0
    repeat until completed or failed
        set content to text of _session
        if content contains "Password" then
            set completed to true
        else
            delay 0.05
            set wait to wait + 1
            if wait > 100 then set failed to true
        end if
    end repeat
    if completed then
        tell _session to write text "{password}" with newline
    end if

    set auto_close to {auto_close}
    if auto_close then tell _session to close
end tell
