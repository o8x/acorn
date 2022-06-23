import json

os_release = {}

with open("/etc/os-release", "r") as f:
    lines = f.readlines()
    for line in lines:
        kv = line.split("=")
        os_release[kv[0].lower()] = kv[1].replace('"', "").strip(" ").strip("\n")

print(json.dumps(os_release))
