import json
import os


def size_format(size):
    if size < 1000:
        return '%i' % size
    elif 1000 <= size < 1000000:
        return '%.1f' % float(size / 1000) + 'KB'
    elif 1000000 <= size < 1000000000:
        return '%.1f' % float(size / 1000000) + 'MB'
    elif 1000000000 <= size < 1000000000000:
        return '%.1f' % float(size / 1000000000) + 'GB'


files = []
target = "{dir}"

if os.path.isdir(target):
    files.append({"name": "../", "isdir": True, "size": 0})

for it in os.listdir(target):
    size = 0
    file = target + "/" + it
    isdir = os.path.isdir(file)
    if not isdir:
        if os.path.exists(file):
            size = size_format(os.path.getsize(file))

    files.append({
        "name": it,
        "isdir": isdir,
        "size": size
    })

print(json.dumps({
    "cwd": os.path.abspath(target),
    "list": files
}))
