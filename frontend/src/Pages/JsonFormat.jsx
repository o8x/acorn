import React, {useEffect, useState} from "react"
import Container from "./Container"
import {message} from "antd"
import "./JsonFormat.css"
import CodeMirror from "@uiw/react-codemirror"
import {xcodeLight} from "@uiw/codemirror-theme-xcode"
import {json} from "@codemirror/lang-json"


export default function (props) {
    const [code, setCode] = useState("")
    const [codeString, setCodeString] = useState(`{"message":"Welcome to Acorn Json Formatter","status_code":200}`)

    useEffect(() => {
        if (codeString === "") {
            return setCode("")
        }

        try {
            let parse = JSON.parse(codeString)
            let res = JSON.stringify(parse, null, 4)

            setCodeString(res)
            setCode(res)
        } catch (e) {
            message.error(e.message)
        }
    }, [codeString])

    useEffect(() => {
        props.setCollapse(true)
    }, [])

    return <Container title="JSON格式化" subTitle="高亮和即时格式化标准 json 数据">
        <div className="json-formatter">
            <CodeMirror
                value={code}
                height="100%"
                theme={xcodeLight}
                extensions={[json()]}
                onChange={(value, _) => {
                    setCodeString(value)
                }}
            />
        </div>
    </Container>
}
