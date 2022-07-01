import React, {useEffect, useState} from "react"
import Container from "./Container"
import TextArea from "antd/es/input/TextArea"
import {Form, message, Radio, Segmented, Select} from "antd"

const options = ["Base64", "URL", "SHA1", "SHA256", "Hex"]

export default function () {
    const [text, setText] = useState("")
    const [operation, setOperation] = useState("encode")
    const [result, setResult] = useState("")
    const [option, setOption] = useState("Base64")
    const {
        Aes,
        AesDecode,
        Gzip,
        GzipDecode,
        Hex,
        HexDecode,
        MD5,
        Sha1,
        Sha2,
        Sha224,
        Base64Encode,
        Base64Decode,
        Base58Encode,
        Base58Decode,
    } = window.go.controller.Tools

    function parseResponse({body, status_code, message: msg}) {
        if (status_code === 500) {
            message.warn(msg)
            return ""
        }
        return body
    }

    async function Codec() {
        if (text === "") {
            return
        }

        const isDecode = operation === "decode"
        let res = ""
        let r = null
        switch (option) {
            case "URL":
                if (isDecode) {
                    res = decodeURIComponent(text)
                } else {
                    res = encodeURIComponent(text)
                }
                break
            case "SHA256":
                r = await Sha2(text)
                break
            case "SHA224":
                r = await Sha224(text)
                break
            case "Gzip":
                if (isDecode) {
                    r = await GzipDecode(text)
                } else {
                    r = await Gzip(text)
                }
                break
            case "SHA1":
                r = await Sha1(text)
                break
            case "MD5":
                r = await MD5(text)
                break
            case "Base64":
                if (isDecode) {
                    r = await Base64Decode(text)
                } else {
                    r = await Base64Encode(text)
                }
                break
            case "Base58":
                if (isDecode) {
                    r = await Base58Decode(text)
                } else {
                    r = await Base58Encode(text)
                }
                break
            case "Hex":
                if (isDecode) {
                    r = await HexDecode(text)
                } else {
                    r = await Hex(text)
                }
                break
            case "AES":
                if (isDecode) {
                    r = await AesDecode(text)
                } else {
                    r = await Aes(text)
                }

                res = JSON.stringify(parseResponse(r), null, 4)
                break
            default:
                return
        }

        if (r === null) {
            return setResult(res)
        }
        setResult(parseResponse(r))
    }

    useEffect(() => {
        Codec()
    }, [text, operation, option])

    return <Container title="文本编解码器" subTitle="对文本进行各种编码以及解码">
        <Form labelCol={{span: 4}} wrapperCol={{span: 15}}>
            <Form.Item name="radio-group" label="操作">
                <Radio.Group value={operation} defaultValue={operation}
                             onChange={e => setOperation(e.target.value)}>
                    <Radio value="encode">编码</Radio>
                    <Radio value="decode">解码</Radio>
                </Radio.Group>
            </Form.Item>
            <Form.Item label="格式：">
                <Segmented options={options} defaultValue={option} onChange={setOption}/>
                <Select style={{width: 100, margin: "0 8px"}} defaultValue="" onChange={setOption}>
                    <Select.Option value="">更多</Select.Option>
                    <Select.Option value="SHA224">SHA224</Select.Option>
                    <Select.Option value="Base58">Base58</Select.Option>
                    <Select.Option value="MD5">MD5</Select.Option>
                    <Select.Option value="Gzip">GZip</Select.Option>
                    <Select.Option value="AES">AES</Select.Option>
                </Select>
            </Form.Item>
            <Form.Item label="输入文本：">
                <TextArea onChange={e => setText(e.target.value)} rows={8}/>
            </Form.Item>
            <Form.Item label="结果：">
                <TextArea rows={8} value={result}/>
            </Form.Item>
        </Form>
    </Container>
}
