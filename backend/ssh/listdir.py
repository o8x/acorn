import json
import os
import pwd
import stat
import time


def parse_mode(isdir, mode):
    if mode == 0:
        return ""

    switch = {
        "0": "---",
        "1": "--x",
        "2": "-w-",
        "3": "-wx",
        "4": "r--",
        "5": "r-x",
        "6": "rw-",
        "7": "rwx",
    }

    om = "%o" % mode
    sm = []
    if isdir:
        sm.append("d")
    else:
        sm.append("-")

    sm.append(switch[om[0]])
    sm.append(switch[om[1]])
    sm.append(switch[om[2]])

    return "".join(sm)


files = []
target = "{dir}"

if os.path.isdir(target) and target != "/":
    files.append({"name": "../", "isdir": True, "size": 0})

for it in os.listdir(target):
    size = 0
    file = target + "/" + it
    st = os.stat(file)
    isdir = os.path.isdir(file)
    mode = parse_mode(isdir, stat.S_IMODE(st.st_mode))
    mtime = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(st.st_mtime))
    try:
        user = pwd.getpwuid(st.st_uid).pw_name
        if not isdir:
            if os.path.exists(file):
                size = os.path.getsize(file)
        files.append({
            "name": it,
            "isdir": isdir,
            "size": size,
            "mode": mode,
            "mtime": mtime,
            "user": user,
        })
    finally:
        pass

print(json.dumps({
    "cwd": os.path.abspath(target),
    "list": files
}))
