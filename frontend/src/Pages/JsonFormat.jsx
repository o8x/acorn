import React, {useEffect, useState} from "react"
import Container from "./Container"
import SyntaxHighlighter from "react-syntax-highlighter"
import {arta} from "react-syntax-highlighter/dist/esm/styles/hljs"
import {Col, Row} from "antd"
import TextArea from "antd/es/input/TextArea"
import "./JsonFormat.css"


export default function () {
    const [code, setCode] = useState("")
    const [codeString, setCodeString] = useState("")

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
            setCode(e.message)
        }
    }, [codeString])

    return <Container>
        <Row gutter={24} className="json-formater">
            <Col span={11}>
                <TextArea value={codeString} onChange={e => setCodeString(e.target.value)} placeholder="原始JSON文本"/>
            </Col>
            <Col span={13}>
                <SyntaxHighlighter showLineNumbers={true} language="json" style={arta} className="syntax-highlighter">
                    {code}
                </SyntaxHighlighter>
            </Col>
        </Row>
    </Container>
}
