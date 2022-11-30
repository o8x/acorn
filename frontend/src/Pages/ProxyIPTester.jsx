import React, {useEffect, useState} from "react"
import Container from "./Container"
import TextArea from "antd/es/input/TextArea"
import {Button, Checkbox, Col, Form, Input, Radio, Row, Select, Tooltip} from "antd"
import {ToolService} from "../rpc"
import {Option} from "antd/es/mentions"
import Editor from "../Components/Editor"

export default function () {
    const [mounted, setMounted] = useState(false)
    const [method, setMethod] = useState("get")
    const [args, setArgs] = useState(["location", "verbose", "simple"])
    const [proxyUsername, setProxyUsername] = useState("")
    const [proxyPassword, setProxyPassword] = useState("")
    const [proxyServer, setProxyServer] = useState("")
    const [proxyProto, setProxyProto] = useState("socks5")
    const [target, setTarget] = useState("")
    const [command, setCommand] = useState("")
    const [data, setData] = useState("")

    const getArgs = () => {
        return {
            method, args, proxyUsername, proxyPassword, proxyServer, proxyProto, target, data, command,
        }
    }

    const runTest = () => {
        ToolService.RunTestWithCurl(getArgs()).then(res => {
            localStorage.setItem("command_args", JSON.stringify(getArgs()))
        })
    }

    useEffect(() => {
        ToolService.GenCurlCommand(getArgs()).then(cmd => setCommand(cmd))
    }, [method, args, proxyUsername, proxyPassword, proxyServer, proxyProto, target, data])

    useEffect(() => {
        let storeArgs = localStorage.getItem("command_args")
        if (storeArgs !== null) {
            let a = JSON.parse(storeArgs)

            setMethod(a["method"])
            setArgs(a["args"])
            setProxyUsername(a["proxyUsername"])
            setProxyPassword(a["proxyPassword"])
            setProxyServer(a["proxyServer"])
            setProxyProto(a["proxyProto"])
            setTarget(a["target"])
            setData(a["data"])
        }
    }, [])

    const onArgChange = d => {
        if (d.indexOf("tunnel") !== -1) {
            setTarget("https://stdout.com.cn/ip?trace&json")
        }
        if (d.indexOf("download") !== -1) {
            setTarget("https://dl.google.com/chrome/mac/universal/stable/GGRO/googlechrome.dmg")
        }
        setArgs(d)
    }

    return <Container title="cURL GUI" subTitle="简单的 cURL 客户端">
        <Form labelCol={{span: 4}} wrapperCol={{span: 16}}>
            <Form.Item label="方法">
                <Radio.Group value={method} onChange={(val) => setMethod(val.target.value)}>
                    <Radio value="get">GET</Radio>
                    <Radio value="post">POST</Radio>
                    <Radio value="put">PUT</Radio>
                    <Radio value="delete">DELETE</Radio>
                    <Radio value="head">HEAD</Radio>
                    <Radio value="trace">TRACE</Radio>
                </Radio.Group>
            </Form.Item>
            <Form.Item label="参数">
                <Checkbox.Group value={args} onChange={onArgChange}>
                    <Row>
                        <Col>
                            <Checkbox value="verbose">
                                <Tooltip title="-v 参数">详细日志</Tooltip>
                            </Checkbox>
                            <Checkbox value="location">
                                <Tooltip title="-L 参数">跳转跟随</Tooltip>
                            </Checkbox>
                            <Checkbox value="simple">
                                <Tooltip title="-s 参数">简单模式</Tooltip>
                            </Checkbox>
                            <Checkbox value="trace">
                                <Tooltip title="--trace 参数，将会自动生成log文件">链路跟踪</Tooltip>
                            </Checkbox>
                            <Checkbox value="tls">
                                <Tooltip title="-k 参数">忽略TLS证书验证</Tooltip>
                            </Checkbox>
                        </Col>
                        <Col>
                            <Checkbox value="time">
                                <Tooltip title="time 前缀和 -w 时间统计">时间统计</Tooltip>
                            </Checkbox>
                            <Checkbox value="tunnel">
                                <Tooltip title="将会自动将目标地址设置为 https://stdout.com.cn/ip?trace&json">隧道代理</Tooltip>
                            </Checkbox>
                            <Checkbox value="download">
                                <Tooltip title="将会自动将目标地址设置为大文件下载地址">下载测速</Tooltip>
                            </Checkbox>
                            <Checkbox value="upload">
                                <Tooltip title="将会自动将目标地址设置为上传测速点，暂时无效">上传测速</Tooltip>
                            </Checkbox>
                        </Col>
                    </Row>
                </Checkbox.Group>
            </Form.Item>
            <Form.Item label="代理认证" style={{marginBottom: 0}}>
                <Form.Item style={{display: "inline-block", width: "calc(50% - 5px)"}}>
                    <Input placeholder="用户名" value={proxyUsername}
                           onChange={e => setProxyUsername(e.target.value)}
                    />
                </Form.Item>
                <Form.Item style={{display: "inline-block", width: "calc(50% - 5px)", marginLeft: 10}}>
                    <Input placeholder="密码" value={proxyPassword}
                           onChange={e => setProxyPassword(e.target.value)}
                    />
                </Form.Item>
            </Form.Item>
            <Form.Item label="代理服务器：">
                <Input.Group compact>
                    <Select value={proxyProto} style={{width: "20%"}} onChange={v => setProxyProto(v)}>
                        <Option value="socks5">socks5</Option>
                        <Option value="http">HTTP</Option>
                    </Select>
                    <Input placeholder="代理服务器地址" style={{width: "80%"}}
                           value={proxyServer} onChange={e => setProxyServer(e.target.value)}
                    />
                </Input.Group>
            </Form.Item>
            <Form.Item label="目标地址：">
                <TextArea rows={1} value={target} placeholder="要请求的目标地址"
                          onChange={e => setTarget(e.target.value)}
                />
            </Form.Item>
            <Form.Item label="携带数据：">
                <TextArea rows={1} value={data} placeholder="POST或PUT时需要传递的数据"
                          onChange={e => setData(e.target.value)}/>
            </Form.Item>
            <Form.Item label="命令示例：">
                <Editor value={command} autowrap height="100px"/>
            </Form.Item>
            <Form.Item wrapperCol={{offset: 4}}>
                <Button type="primary" onClick={runTest}>运行测试</Button>
            </Form.Item>
        </Form>
    </Container>
}
