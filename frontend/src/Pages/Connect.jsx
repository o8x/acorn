import React from "react"
import {Avatar, Button, Divider, Form, Input, List, message, Modal, Radio, Select} from "antd"
import Container from "./Container"
import "./Connect.css"
import CustomModal from "../Components/Modal"
import {EditOutlined} from "@ant-design/icons"
import {Option} from "antd/es/mentions"
import {Link} from "react-router-dom"

import centosLogo from "../assets/images/centos-logo.png"
import debianLogo from "../assets/images/debian-logo.jpg"
import linuxLogo from "../assets/images/linux-logo.png"
import openwrtLogo from "../assets/images/openwrt-logo.png"
import ubuntuLogo from "../assets/images/ubuntu-logo.png"
import windowsLogo from "../assets/images/windows-logo.png"

function getLogoSrc(type) {
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

export default class extends React.Component {
    state = {
        list: [], quickAddInput: "", quickAddInputLoading: false,
    }

    constructor(props) {
        super(props)
        this.labelInputRef = React.createRef()
        this.modalRef = React.createRef()
        this.loadList()
    }

    loadList(keyword) {
        window.runtime.EventsEmit("get_connects", keyword)
        window.runtime.EventsOnce("set_connects", data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }

            this.setState({
                list: data.body ? data.body : [],
            })
        })
    }

    SSHCopyID(item) {
        this.modalRef.current.setTitle(item.label)
        this.modalRef.current.setContent(`即将执行命令: ssh-copy-id -p ${item.port} -o StrictHostKeyChecking=no ${item.username}@${item.host}`)
        this.modalRef.current.show(() => {
            window["go"]["backend"]["Connect"]["SSHCopyID"](item.id).then(data => {
                data.status_code === 204 ? message.success("执行完成") : message.error(`执行失败: ${data.message}`)
            })
        })
    }

    deleteSSHConnect = (item) => {
        this.modalRef.current.setTitle("删除连接")
        this.modalRef.current.setContent(`即将删除连接: ${item.label}(${item.username}@${item.host})`)
        this.modalRef.current.show(() => {
            window.runtime.EventsEmit("delete_connect", [item.id])
            window.runtime.EventsOnce("delete_connect_reply", data => {
                if (data.status_code === 500) {
                    return message.error(data.message)
                }

                message.success("删除完成")
                this.loadList()
            })
        })
    }

    editConnectLabel = (item) => {
        Modal.confirm({
            title: "修改备注", okText: "确定", cancelText: "取消", content: (<Input
                defaultValue={item.label === "未命名" ? "" : item.label}
                placeholder="备注"
                onChange={({target: {value}}) => {
                    this.labelInputRef.current = value
                }}
            />), icon: null, onOk: () => {
                item.label = this.labelInputRef.current
                window.runtime.EventsEmit("edit_connect", item)
                window.runtime.EventsOnce("edit_connect_reply", data => {
                    if (data.status_code === 500) {
                        return message.error(data.message)
                    }

                    message.success("备注修改完成")
                    this.setState({
                        list: this.state.list.map(it => it.id === item.id ? item : it),
                    })
                })
            },
        })
    }

    editConnect = (item) => {
        let editRef = React.createRef()

        Modal.confirm({
            style: {top: 30}, title: "修改连接信息", okText: "确定", cancelText: "取消", width: 600, content: (
                <Form
                    ref={editRef}
                    labelCol={{span: 4}}
                    layout="horizontal"
                    size="default"
                    initialValues={item}
                >
                    <Divider/>
                    <Form.Item label="操作系统" name="type">
                        <Select placeholder="操作系统">
                            <Option value="linux">Linux</Option>
                            <Option value="centos">CentOS</Option>
                            <Option value="ubuntu">Ubuntu</Option>
                            <Option value="debian">Debian</Option>
                            <Option value="openwrt">OpenWRT</Option>
                            <Option value="windows">Windows</Option>
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
            ), icon: null, onOk: () => {
                let values = editRef.current.getFieldsValue(true)
                values.port = parseInt(values.port)

                window.runtime.EventsEmit("edit_connect", values)
                window.runtime.EventsOnce("edit_connect_reply", data => {
                    if (data.status_code === 500) {
                        return message.error(data.message)
                    }

                    message.success("连接信息修改完成")
                    this.setState({
                        list: this.state.list.map(it => it.id === values.id ? values : it),
                    })
                })
            },
        })
    }

    ping = (item) => {
        window.runtime.EventsEmit("ping_connect", [item.id])
        window.runtime.EventsOnce("ping_connect_reply", data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }

            message.success("启动完成")
        })
    }

    SSHConnect(item) {
        window["go"]["backend"]["Connect"]["SSHConnect"](item.id).then(data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }
        })
    }

    AddSSHConnect = () => {
        let args = {
            label: "",
            type: "linux",
            username: "root",
            port: 22,
            params: "-o StrictHostKeyChecking=no",
            host: "",
            auth_type: "private_key",
        }

        function splitHost(host) {
            let link = host.split("@")
            args.username = link[0]
            args.host = link[1]
            args.type = "linux"
        }

        if (this.state.quickAddInput.trim() === "") {
            return message.warning("参数不能为空")
        }

        let params = this.state.quickAddInput.split(" ").filter(it => it !== "").map(it => it.trim())
        if (params.length === 1) {
            if (params[0].indexOf("@") !== -1) {
                splitHost(params[0])
            } else {
                args.username = "root"
                args.host = params[0]
            }
        } else if (params.length > 1) {
            for (let ind in params) {
                if (params[ind].search(/^(scp|ssh|ssh\-copy\-id|ssh\-genkey)/)) {
                    args.type = "linux"
                }

                if (params[ind].indexOf("@") !== -1) {
                    splitHost(params[ind])
                }

                if (params[ind] === "-p") {
                    args.port = parseInt(params[ind * 1 + 1])
                }

                if (params[ind] === "-o") {
                    args.params = params[ind * 1 + 1]
                }
            }
        }

        if (args.username === "" || args.host === "") {
            return message.warning("参数解析失败")
        }

        this.setState({quickAddInputLoading: true})
        const hide = message.loading(`正在添加: ${args.host}`, 0)

        window.runtime.EventsEmit("add_connect", args)
        window.runtime.EventsOnce("add_connect_reply", data => {
            hide()
            this.setState({quickAddInputLoading: false})
            data.status_code === 204 ? message.success("添加完成") : message.error(`添加失败: ${data.message}`)

            this.setState({quickAddInput: ""})
            this.loadList()
        })
    }

    handleAddInputOnChange = (e) => {
        this.loadList(e.target.value)
        this.setState({
            quickAddInput: e.target.value,
        })
    }

    render() {
        return <Container>
            <Form onFinish={this.AddSSHConnect}>
                <Input.Group compact>
                    <Input value={this.state.quickAddInput}
                           onChange={this.handleAddInputOnChange}
                           allowClear={true}
                           placeholder="root@example.com"
                           style={{width: "calc(100% - 300px)"}}/>
                    <Button type="primary" htmlType="submit">快速添加</Button>
                </Input.Group>
            </Form>
            <Divider/>
            <List
                itemLayout="horizontal"
                dataSource={this.state.list}
                renderItem={item => (<List.Item
                    actions={[<a key="list-edit" onClick={() => message.info("尚未实现")}>监控</a>,
                        <a key="list-conn" onClick={() => this.SSHConnect(item)}>连接</a>,
                        <a key="list-xterm">
                            <Link to={`/terminal/${item.id}`}>xTerm</Link>
                        </a>,
                        <a key="list-xterm">
                            <Link to={`/transfer/${item.id}`}>传输</Link>
                        </a>,
                        <a key="list-copy-id" onClick={() => this.SSHCopyID(item)}>COPY-ID</a>,
                        <a key="list-edit" onClick={() => this.ping(item)}>PING</a>,
                        <a key="list-edit" onClick={() => this.editConnect(item)}>编辑</a>,
                        <a key="list-more" onClick={() => this.deleteSSHConnect(item)}>删除</a>]}>
                    <List.Item.Meta
                        avatar={<Avatar src={getLogoSrc(item.type)}/>}
                        title={<span className="title" onDoubleClick={() => this.SSHConnect(item)}>
                                {item.label === "" ? "未命名" : item.label} ({item.username}@{item.host})
                                <a href="#" onClick={() => this.editConnectLabel(item)}><EditOutlined/></a>
                            </span>}
                        description={`ssh ${item.params} ${item.port === "22" ? "" : `-p ${item.port}`} ${item.username}@${item.host}`}
                    />
                </List.Item>)}
            />
            <CustomModal ref={this.modalRef}/>
        </Container>
    }
}
