import React, {useEffect} from "react"
import {Avatar, Button, Drawer, Form, Input, Radio, Select, Space} from "antd"
import {Option} from "antd/es/mentions"
import {SaveOutlined} from "@ant-design/icons"
import centosLogo from "../assets/images/centos-logo.png"
import debianLogo from "../assets/images/debian-logo.jpg"
import linuxLogo from "../assets/images/linux-logo.png"
import openwrtLogo from "../assets/images/openwrt-logo.png"
import ubuntuLogo from "../assets/images/ubuntu-logo.png"
import windowsLogo from "../assets/images/windows-logo.png"

export let OSList = [
    {value: "linux", text: "Linux"},
    {value: "centos", text: "CentOS"},
    {value: "ubuntu", text: "Ubuntu"},
    {value: "debian", text: "Debian"},
    {value: "openwrt", text: "OpenWRT"},
    {value: "windows", text: "Windows"},
]

export function getLogoSrc(type) {
    switch (type.toLowerCase()) {
        case "centos":
            return centosLogo
        case "debian":
            return debianLogo
        case "openwrt":
            return openwrtLogo
        case "ubuntu":
            return ubuntuLogo
        case "windows":
            return windowsLogo
    }
    return linuxLogo
}

export default function (props) {
    const ref = props.formRef ? props.formRef : React.createRef()

    const submit = () => {
        let values = ref.current.getFieldsValue(true)
        if (values.tags !== null) {
            values.tags = values.tags.filter(it => it !== null && it !== undefined)
        }

        values.port = parseInt(values.port)
        if (isNaN(values.port)) {
            values.port = 0
        }
        props.onSubmit(values)
    }

    // useLayoutEffect -> componentDidMount
    // useEffect -> 异步的 componentDidMount
    // useEffect 不加任何参数 -> componentDidUpdate 任何变化都会调用
    useEffect(() => {
        if (ref.current) {
            ref.current.resetFields()
        }
    })

    return <>
        <Drawer
            title={props.title}
            placement="right"
            width={500}
            open={props.open}
            visible={props.open}
            onClose={props.onClose}
            closable={true}
            extra={
                <Space>
                    {props.extra}
                    <Button icon={<SaveOutlined/>} type="primary" onClick={submit}>提交</Button>
                </Space>
            }
        >
            <Form
                ref={ref}
                labelCol={{span: 4}}
                layout="horizontal"
                size="default"
                initialValues={props.connect}
            >
                <Form.Item label="备注" name="label"><Input/></Form.Item>
                <Form.Item label="操作系统" name="type">
                    <Select placeholder="操作系统">
                        {OSList.map(it => <Option value={it.value} key={it.value}>
                            <Avatar size={22} src={getLogoSrc(it.value)}/> {it.text}
                        </Option>)}
                    </Select>
                </Form.Item>
                <Form.Item label="分组" name="tags">
                    <Select placeholder="分组" mode="tags">
                        {props.tags.map(it => <Option key={it.id} value={it.id}>{it.name}</Option>)}
                    </Select>
                </Form.Item>
                <Form.Item label="鉴权类型" name="auth_type">
                    <Radio.Group>
                        <Radio.Button value="password">密码</Radio.Button>
                        <Radio.Button value="private_key">私钥</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                <Form.Item label="私钥" name="private_key"><Input/></Form.Item>
                <Form.Item label="认证" style={{marginBottom: 0}}>
                    <Form.Item style={{display: "inline-block", width: "calc(50% - 5px)"}} name="username">
                        <Input placeholder="用户名"/>
                    </Form.Item>
                    <Form.Item style={{display: "inline-block", width: "calc(50% - 5px)", marginLeft: 10}}
                               name="password">
                        <Input.Password placeholder="密码"/>
                    </Form.Item>
                </Form.Item>
                <Form.Item label="连接" style={{marginBottom: 0}}>
                    <Form.Item style={{display: "inline-block", width: "calc(50% - 5px)"}} name="host">
                        <Input placeholder="地址"/>
                    </Form.Item>
                    <Form.Item style={{display: "inline-block", width: "calc(50% - 5px)", marginLeft: 10}}
                               name="port">
                        <Input placeholder="端口"/>
                    </Form.Item>
                </Form.Item>
                <Form.Item label="连接参数" name="params"><Input/></Form.Item>
            </Form>
        </Drawer>
    </>
}
