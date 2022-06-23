set RDPPassword to "{password}" as String

if RDPPassword = "" then
    display dialog "远程连接密码不能为空。"
    exit
end if

try
    tell application "Microsoft Remote Desktop"
        activate
    end tell
on error
    tell application "Microsoft Remote Desktop Beta"
        activate
    end tell
end try

do shell script "open '{rdp_file}'"
delay 1

tell app "System Events" to keystroke RDPPassword
delay 0.5
tell application "System Events" to key code 36

tell application "iTerm"
    tell current window
        set _session to current session of current tab
        tell _session to close
    end tell
end tell
