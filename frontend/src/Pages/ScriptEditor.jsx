import React, {useEffect, useState} from "react"
import Container from "./Container"
import "./ScriptEditor.css"
import {Button, Input, message} from "antd"
import Editor from "../Components/Editor"

let defaultScript = `#!/bin/sh

set -e 
set -x

# desc: print 'Hello World' with cat
# run this script via 'curl -sL stdout.com.cn/@command.sh | sh'

cat <(echo "Hello World")
`

export default function (props) {
    const [code, setCode] = useState(defaultScript)
    const [name, setName] = useState("")

    const genScript = () => {
        if (name === "") {
            return message.error("文件名不能为空")
        }

        message.success(`文件提交完成，正在生成@${name}.sh文件，可以自由切换页面`)
        window.runtime.EventsEmit("gen_script", name, code)
        window.runtime.EventsOnce("gen_script_reply", data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }

            message.success(`@${name}.sh 已生成`)
        })
    }

    useEffect(() => {
        codeChange(code)
    }, [name])

    const codeChange = (value, _) => {
        let n = name
        if (name === "") {
            n = "command"
        }

        setCode(value.replace(/@.+?sh/, `@${n}.sh`))
    }

    return <Container title="脚本编辑器" subTitle="生成可执行的shell脚本链接">
        <Input addonBefore="https://stdout.com.cn/@" suffix=".sh" value={name} placeholder="脚本文件名"
               onChange={e => {
                   setName(e.target.value.replace(/\s+/g, "_"))
                   codeChange(code)
               }}/>

        <div className="script-editor">
            <Editor value={defaultScript} onChange={codeChange} height="calc(100vh - 200px)"/>
        </div>
        <Button onClick={genScript} type="primary">提交</Button>
    </Container>
}

