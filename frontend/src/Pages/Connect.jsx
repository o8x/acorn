import React from "react"
import {
    Avatar,
    Button,
    Col,
    Divider,
    Form,
    Input,
    message,
    Modal,
    Radio,
    Row,
    Select,
    Space,
    Table,
    Tooltip,
} from "antd"
import Container from "./Container"
import "./Connect.css"
import CustomModal from "../Components/Modal"
import {Option} from "antd/es/mentions"
import {Link} from "react-router-dom"

import centosLogo from "../assets/images/centos-logo.png"
import debianLogo from "../assets/images/debian-logo.jpg"
import linuxLogo from "../assets/images/linux-logo.png"
import openwrtLogo from "../assets/images/openwrt-logo.png"
import ubuntuLogo from "../assets/images/ubuntu-logo.png"
import windowsLogo from "../assets/images/windows-logo.png"
import {CodeOutlined, EditOutlined, FolderOpenOutlined, InfoCircleOutlined, ReloadOutlined} from "@ant-design/icons"

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

const OSList = [
    {value: "linux", text: "Linux"},
    {value: "centos", text: "CentOS"},
    {value: "ubuntu", text: "Ubuntu"},
    {value: "debian", text: "Debian"},
    {value: "openwrt", text: "OpenWRT"},
    {value: "windows", text: "Windows"},
]

export default class extends React.Component {
    state = {
        list: [], quickAddInput: "",
        quickAddInputLoading: false,
        reloadListLoading: false,
        pagesize: 6,
    }

    constructor(props) {
        super(props)
        this.labelInputRef = React.createRef()
        this.modalRef = React.createRef()
    }

    componentDidMount() {
        this.loadList()
    }

    loadList(keyword) {
        this.setState({reloadListLoading: true})
        window.runtime.EventsEmit("get_connects", keyword)
        window.runtime.EventsOnce("set_connects", data => {
            this.setState({reloadListLoading: false})
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
                if (item.label === "") {
                    item.label = "no label"
                }

                window.runtime.EventsEmit("edit_connect", item)
                window.runtime.EventsOnce("edit_connect_reply", data => {
                    if (data.status_code === 500) {
                        return message.error(data.message)
                    }

                    message.success("备注修改完成")
                    this.loadList()
                })
            },
        })
    }

    editConnect = (item) => {
        let editRef = React.createRef()

        Modal.confirm({
            style: {top: 30}, title: "修改连接信息", okText: "确定", cancelText: "取消", width: 600, content: (<Form
                ref={editRef}
                labelCol={{span: 4}}
                layout="horizontal"
                size="default"
                initialValues={item}
            >
                <Divider/>
                <Form.Item label="操作系统" name="type">
                    <Select placeholder="操作系统">
                        {OSList.map(it => <Option value={it.value}>{it.text}</Option>)}
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
            </Form>), icon: null, onOk: () => {
                let values = editRef.current.getFieldsValue(true)
                values.port = parseInt(values.port)

                window.runtime.EventsEmit("edit_connect", values)
                window.runtime.EventsOnce("edit_connect_reply", data => {
                    if (data.status_code === 500) {
                        return message.error(data.message)
                    }

                    message.success("连接信息修改完成")
                    this.loadList()
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
        window.runtime.EventsEmit("open_ssh_session", [item.id], "")
        window.runtime.EventsOnce("open_ssh_session_reply", data => {
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

        function splitHostPort(host) {
            let link = host.split(":")
            args.host = link[0]
            args.port = parseInt(link[1])
            const isNT = args.port === 3389

            args.type = isNT ? "windows" : "linux"
            args.username = isNT ? "Administrator" : "root"
            args.params = isNT ? "" : args.params
            args.auth_type = isNT ? "password" : args.params
        }

        if (this.state.quickAddInput.trim() === "") {
            return message.warning("参数不能为空")
        }

        let params = this.state.quickAddInput.split(" ").filter(it => it !== "").map(it => it.trim())
        if (params.length === 1) {
            if (params[0].indexOf("@") !== -1) {
                splitHost(params[0])
            } else if (params[0].indexOf(":") !== -1) {
                splitHostPort(params[0])
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

    makeRDPCmdline = (item, short) => {
        if (item.type === "windows") {
            let username = item.username
            if (item.username.length > 13 && short) {
                username = `${item.username.substr(0, 10)}...`
            }

            if (short) {
                return `rdp:${username}@${item.host}:${item.port}`
            }

            return `open 'rdp:full address=s:${item.host}:${item.port}&username=s:${username}'`
        }

        let param = `${item.params} `
        if (item.params !== "" && short) {
            param = ""
        }

        let port = `-p ${item.port} `
        if (parseInt(item.port) === 22) {
            port = ""
        }

        let host = item.host
        if (item.host.length > 22) {
            host = `${item.host.substr(0, 22)}...`
        }

        return `ssh ${param}${port}${item.username}@${host}`
    }

    columns = [
        {
            title: "连接信息",
            render: (_, item) => {
                return <Row>
                    <Col>
                        <Avatar size={30} src={getLogoSrc(item.type)} style={{
                            marginRight: "10px",
                        }}/></Col>
                    <Col>
                        <span className="ssh-command" key={Math.random()}>
                            <a href="#" onDoubleClick={() => this.SSHConnect(item)}>
                                {item.label === "" ? "未命名" : item.label}
                            </a>
                            <a href="#" onClick={() => this.editConnectLabel(item)}> <EditOutlined/> </a>
                            <br/>
                            {this.makeRDPCmdline(item, true)}
                        </span>
                    </Col>
                </Row>
            },
            filters: OSList,
            filterSearch: true,
            sorter: (a, b) => a.id - b.id,
            onFilter: (value, record) => record.type === value,
        },
        {
            render: (_, item) => {
                const isNT = item.type === "windows"
                return (<Space size="middle">
                    <a key="list-conn" onClick={() => this.SSHConnect(item)}>连接</a>
                    {
                        item.params.indexOf("ProxyCommand") !== -1 || isNT ?
                            <a href="#" disabled>传输</a> :
                            <Link to={`/transfer/${btoa(encodeURIComponent(JSON.stringify(item)))}`}>传输</Link>
                    }
                    {
                        isNT ? <a disabled>COPY-ID</a>
                            : <a key="list-copy-id" onClick={() => this.SSHCopyID(item)}>COPY-ID</a>
                    }
                    <a key="list-ping" onClick={() => this.ping(item)}>PING</a>
                    <a key="list-edit" onClick={() => this.editConnect(item)}>编辑</a>
                    <a key="list-more" onClick={() => this.deleteSSHConnect(item)}>删除</a>
                </Space>)
            },
        }]

    onTableChange = (pagination, filters, sorter, extra) => {
        // 默认 filters 没有 1 属性
        // 切换为空时 filters 的 1 属性为 null
        if (Object.keys(filters).length === 2) {
            this.setState({
                pagesize: filters[1] !== null ? 999 : 6,
            })
        }
    }

    openLocalConsole = () => {
        window.runtime.EventsEmit("open_local_console")
        window.runtime.EventsOnce("open_local_console_reply", data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }
        })
    }

    importRDPFile = () => {
        window.runtime.EventsEmit("import_rdp_file")
        window.runtime.EventsOnce("import_rdp_file_replay", data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }

            this.loadList()
            message.success("导入完成")
        })
    }

    render() {
        return <Container title="远程连接" subTitle="快速连接SSH和进行双向文件传输">
            <Form onFinish={this.AddSSHConnect}>
                <Space>
                    <Tooltip title="刷新列表">
                        <Button shape="circle" icon={<ReloadOutlined/>} disabled={this.state.quickAddInputLoading}
                                onClick={() => this.loadList("")}
                        />
                    </Tooltip>
                    <Tooltip title="新建 iTerm 本地会话">
                        <Button shape="circle" icon={<CodeOutlined/>} onClick={() => this.openLocalConsole("")}/>
                    </Tooltip>
                    <Tooltip title="导入rdp文件">
                        <Button shape="circle" icon={<FolderOpenOutlined/>}
                                onClick={() => this.importRDPFile()}/>
                    </Tooltip>
                    <Input
                        addonBefore="ssh"
                        value={this.state.quickAddInput}
                        onChange={this.handleAddInputOnChange}
                        allowClear={true}
                        placeholder="[-p 2233] [-o xx] root@example.com"
                        style={{width: 350}}
                        suffix={<Tooltip title="将会自动解析 ssh 参数">
                            <InfoCircleOutlined/>
                        </Tooltip>}
                    />
                </Space>
            </Form>
            <Table
                style={{
                    marginTop: 10,
                }}
                loading={this.state.reloadListLoading}
                columns={this.columns}
                dataSource={this.state.list}
                showHeader={true}
                scroll={{x: 790, y: 400}}
                rowKey={it => it.id}
                onChange={this.onTableChange}
                size="middle"
                expandable={{
                    expandedRowRender: item => <p key={item.id * 100} style={{margin: 0}}>
                        {this.makeRDPCmdline(item, false)}
                    </p>,
                    rowExpandable: item => item.type === "windows" || item.params !== "" || item.username.length > 13 || item.host.length > 22,
                }}
                pagination={{
                    pageSize: this.state.pagesize,
                    hideOnSinglePage: true,
                    total: this.state.list.length,
                    showTotal: total => `共${total}条`,
                }}
            />
            <CustomModal ref={this.modalRef}/>
        </Container>
    }
}
