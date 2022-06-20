import React, {useEffect, useState} from "react"
import Container from "./Container"
import {Button, Checkbox, Form, Input, InputNumber, Tooltip} from "antd"
import TextArea from "antd/es/input/TextArea"

const contents = {
    upper_chars: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
    lower_chars: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"],
    numbers: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    symbols: ["~", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "[", "{", "]", "}", "-", "_", "=", "+", "|", ";", ":", "'", `"`, ",", "<", ".", ">", "/", "?", "`"],
}

export default function () {
    const [length, setLength] = useState(16)
    const [result, setResult] = useState("")
    const [otherPart, setOtherPart] = useState("")
    const [part, setPart] = useState(["upper_chars", "lower_chars", "numbers"])

    function makePass() {
        let res = []
        let opts = []
        part.map(it => opts = opts.concat(contents[it]))

        // 去重
        // opts = [...new Set(opts.concat(otherPart.split("")))]
        // 不去重，可以让混合的那些字符出现的概率更高
        opts = opts.concat(otherPart.split(""))
        for (let i = 0; i < length; i++) {
            res.push(opts[Math.round(Math.random() * opts.length)])
        }

        setResult(res.join(""))
    }

    useEffect(makePass, [length, part, otherPart])

    return <Container title="密码生成" subTitle="随机生成指定长度的密码">
        <Form
            labelCol={{span: 4}}
            wrapperCol={{span: 15}}
        >
            <Form.Item label="组成部分">
                <Checkbox.Group value={part} onChange={setPart}>
                    <Checkbox value="upper_chars">
                        <Tooltip title={contents["upper_chars"].join("")}>大写字母</Tooltip>
                    </Checkbox>
                    <Checkbox value="lower_chars">
                        <Tooltip title={contents["lower_chars"].join("")}>小写字母</Tooltip>
                    </Checkbox>
                    <Checkbox value="numbers">
                        <Tooltip title={contents["numbers"].join("")}>数字</Tooltip>
                    </Checkbox>
                    <Checkbox value="symbols">
                        <Tooltip title={contents["symbols"].join("")}>符号</Tooltip>
                    </Checkbox>
                </Checkbox.Group>
            </Form.Item>
            <Form.Item label="混合内容">
                <Input value={otherPart}
                       onChange={e => setOtherPart(e.target.value.replaceAll(" ", ""))}
                       placeholder="其他参与密码生成的内容"/>
            </Form.Item>
            <Form.Item label="长度">
                <InputNumber onChange={setLength} value={length}/>
            </Form.Item>
            <Form.Item label="生成结果：">
                <TextArea value={result} rows={5}/>
            </Form.Item>
            <Form.Item wrapperCol={{offset: 4}}>
                <Button onClick={makePass} type="primary">生成</Button>
            </Form.Item>
        </Form>
    </Container>
}
