import React, {useEffect, useState} from "react"
import Container from "./Container"
import TextArea from "antd/es/input/TextArea"
import {Form, Input, message, Table} from "antd"

const columns = [
    {
        title: "序号",
        dataIndex: "id",
        width: 80,
    },
    {
        title: "索引",
        dataIndex: "index",
        width: 80,
    },
    {
        title: "内容",
        dataIndex: "content",
    },
]

export default function () {
    const [reg, setReg] = useState("")
    const [text, setText] = useState("")
    const [result, setResult] = useState([])

    function regTest() {
        if (reg === "") {
            return
        }

        try {
            let res = []
            let i = 0
            for (const it of text.matchAll(reg.replaceAll("/", ""))) {
                res.push({
                    id: ++i,
                    content: it[0],
                    index: it.index,
                })
            }

            setResult(res)
        } catch (e) {
            message.error(e.message)
        }
    }

    useEffect(() => {
        regTest()
    }, [reg, text])


    return <Container title="正则表达式" subTitle="测试 JavaScript 正则表达式">
        <Form labelCol={{span: 4}} wrapperCol={{span: 15}}>
            <Form.Item label="正则表达式：">
                <Input onChange={e => setReg(e.target.value)}/>
            </Form.Item>
            <Form.Item label="匹配文本：">
                <TextArea onChange={e => setText(e.target.value)} rows={8}/>
            </Form.Item>
            <Form.Item label="匹配结果：">
                <Table
                    size="small"
                    rowKey={() => Math.random()}
                    dataSource={result} pagination={false} columns={columns}
                    scroll={{y: 200}}
                />
            </Form.Item>
        </Form>
    </Container>
}
