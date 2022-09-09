import React, {useEffect, useState} from "react"
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
    Tag,
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
import {
    ApiOutlined,
    CodeOutlined,
    CopyOutlined,
    DeleteOutlined,
    EditOutlined,
    FolderOpenOutlined,
    InfoCircleOutlined,
    MonitorOutlined,
    PoweroffOutlined,
    RedoOutlined,
    ReloadOutlined,
} from "@ant-design/icons"
import Column from "antd/es/table/Column"

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

export default function (props) {
    let [list, setList] = useState([])
    let [tags, setTags] = useState([])
    let [quickAddInput, setQuickAddInput] = useState("")
    let [quickAddInputLoading, setQuickAddInputLoading] = useState(false)
    let [reloadListLoading, setReloadListLoading] = useState(false)
    let [pagesize, setPageSize] = useState(6)
    let labelInputRef = React.createRef()
    let modalRef = React.createRef()
    let OSList = [
        {value: "linux", text: "Linux"},
        {value: "centos", text: "CentOS"},
        {value: "ubuntu", text: "Ubuntu"},
        {value: "debian", text: "Debian"},
        {value: "openwrt", text: "OpenWRT"},
        {value: "windows", text: "Windows"},
    ]

    useEffect(function () {
        refresh()
    }, [])

    const refresh = () => {
        loadList()
        loadTags()
    }

    const loadTags = () => {
        window.runtime.EventsEmit("get_tags")
        window.runtime.EventsOnce("get_tags_replay", data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }

            data.body.map(it => {
                it.value = it.id
                it.text = it.name
            })
            setTags(data.body)
        })
    }

    const loadList = (keyword) => {
        setReloadListLoading(true)
        window.runtime.EventsEmit("get_connects", keyword)
        window.runtime.EventsOnce("set_connects", data => {
            setReloadListLoading(false)
            if (data.status_code === 500) {
                return message.error(data.message)
            }
            setList(data.body ? data.body : [])
        })
    }

    const SSHCopyID = (item) => {
        modalRef.current.setTitle(item.label)
        modalRef.current.setContent(`即将执行命令: ssh-copy-id -p ${item.port} -o StrictHostKeyChecking=no ${item.username}@${item.host}`)
        modalRef.current.show(() => {
            window["go"]["backend"]["Connect"]["SSHCopyID"](item.id).then(data => {
                data.status_code === 204 ? message.success("执行完成") : message.error(`执行失败: ${data.message}`)
            })
        })
    }

    const deleteSSHConnect = (item) => {
        modalRef.current.setTitle("删除连接")
        modalRef.current.setContent(`即将删除连接: ${item.label}(${item.username}@${item.host})`)
        modalRef.current.show(() => {
            window.runtime.EventsEmit("delete_connect", [item.id])
            window.runtime.EventsOnce("delete_connect_reply", data => {
                if (data.status_code === 500) {
                    return message.error(data.message)
                }

                message.success("删除完成")
                refresh()
            })
        })
    }

    const editConnectLabel = (item) => {
        Modal.confirm({
            title: "修改备注", okText: "确定", cancelText: "取消", content: (<Input
                defaultValue={item.label === "未命名" ? "" : item.label}
                placeholder="备注"
                onChange={({target: {value}}) => {
                    labelInputRef.current = value
                }}
            />), icon: null, onOk: () => {
                item.label = labelInputRef.current
                if (item.label === "") {
                    item.label = "no label"
                }

                window.runtime.EventsEmit("edit_connect", item)
                window.runtime.EventsOnce("edit_connect_reply", data => {
                    if (data.status_code === 500) {
                        return message.error(data.message)
                    }

                    message.success("备注修改完成")
                    refresh()
                })
            },
        })
    }

    const editConnect = (item) => {
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
                        {OSList.map(it => <Option value={it.value} key={it.value}>{it.text}</Option>)}
                    </Select>
                </Form.Item>
                <Form.Item label="分组" name="tags">
                    <Select placeholder="分组" mode="tags">
                        {tags.map(it => <Option key={it.id} value={it.id}>{it.name}</Option>)}
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
                if (values.tags !== null) {
                    values.tags = values.tags.filter(it => it !== null && it !== undefined)
                }
                values.port = parseInt(values.port)
                window.runtime.EventsEmit("edit_connect", values)
                window.runtime.EventsOnce("edit_connect_reply", data => {
                    if (data.status_code === 500) {
                        return message.error(data.message)
                    }

                    message.success("连接信息修改完成")
                    refresh()
                })
            },
        })
    }

    const moreActions = (item) => {
        const isNT = item.type === "windows"

        const modal = Modal.confirm({
            style: {top: 30},
            title: "扩展功能",
            cancelText: "取消",
            width: 600,
            icon: null,
            content: <>
                <Divider/>
                <Space split={<Divider type="vertical"/>}>
                    {
                        isNT ? <a disabled>COPY-ID</a> :
                            <Button icon={<CopyOutlined/>} onClick={() => {
                                modal.destroy()
                                SSHCopyID(item)
                            }}>COPY-ID</Button>
                    }
                    <Button icon={<ApiOutlined/>} onClick={() => ping(item)}>PING</Button>
                </Space>
                <Divider/>
                <Space split={<Divider type="vertical"/>}>
                    {
                        isNT ?
                            <a href="#" disabled>监控</a> :
                            <Button icon={<MonitorOutlined/>} onClick={() => top(item)}>监控</Button>
                    }
                    {
                        isNT ?
                            <a href="#" disabled>关机</a> :
                            <Button icon={<PoweroffOutlined/>} onClick={() => message.info("未实现")}>关机</Button>
                    }
                    {
                        isNT ?
                            <a href="#" disabled>重启</a> :
                            <Button icon={<RedoOutlined/>} onClick={() => message.info("未实现")}>重启</Button>
                    }
                </Space>
                <Divider/>
                <Space split={<Divider type="vertical"/>}>
                    <Button icon={<DeleteOutlined/>} onClick={() => {
                        modal.destroy()
                        deleteSSHConnect(item)
                    }}>删除</Button>
                </Space>
            </>,
        })
    }

    const ping = (item) => {
        window.runtime.EventsEmit("ping_connect", [item.id])
        window.runtime.EventsOnce("ping_connect_reply", data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }

            message.success("启动完成")
        })
    }

    const top = (item) => {
        window.runtime.EventsEmit("top_connect", [item.id])
        window.runtime.EventsOnce("top_connect_reply", data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }
        })
    }

    const SSHConnect = (item) => {
        window.runtime.EventsEmit("open_ssh_session", [item.id], "")
        window.runtime.EventsOnce("open_ssh_session_reply", data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }
        })
    }

    const AddSSHConnect = () => {
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

        if (quickAddInput.trim() === "") {
            return message.warning("参数不能为空")
        }

        let params = quickAddInput.split(" ").filter(it => it !== "").map(it => it.trim())
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

        setQuickAddInputLoading(true)
        const hide = message.loading(`正在添加: ${args.host}`, 0)

        window.runtime.EventsEmit("add_connect", args)
        window.runtime.EventsOnce("add_connect_reply", data => {
            hide()
            setQuickAddInputLoading(false)
            data.status_code === 204 ? message.success("添加完成") : message.error(`添加失败: ${data.message}`)

            setQuickAddInput("")
            refresh()
        })
    }

    const handleAddInputOnChange = (e) => {
        loadList(e.target.value)
        setQuickAddInput(e.target.value)
    }

    const makeRDPCmdline = (item, short) => {
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

    const onTableChange = (pagination, filters, sorter, extra) => {
        setPageSize(filters.list !== null || filters.tags !== null ? 999 : 6)
    }

    const openLocalConsole = () => {
        window.runtime.EventsEmit("open_local_console")
        window.runtime.EventsOnce("open_local_console_reply", data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }
        })
    }

    const importRDPFile = () => {
        window.runtime.EventsEmit("import_rdp_file")
        window.runtime.EventsOnce("import_rdp_file_replay", data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }

            refresh()
            message.success("导入完成")
        })
    }

    return <Container title="远程连接" subTitle="快速连接SSH和进行双向文件传输">
        <Form onFinish={AddSSHConnect}>
            <Space>
                <Tooltip title="刷新列表">
                    <Button shape="circle" icon={<ReloadOutlined/>} disabled={quickAddInputLoading}
                            onClick={refresh}/>
                </Tooltip>
                <Tooltip title="新建 iTerm 本地会话">
                    <Button shape="circle" icon={<CodeOutlined/>} onClick={() => openLocalConsole("")}/>
                </Tooltip>
                <Tooltip title="导入rdp文件">
                    <Button shape="circle" icon={<FolderOpenOutlined/>}
                            onClick={() => importRDPFile()}/>
                </Tooltip>
                <Input
                    addonBefore="ssh"
                    value={quickAddInput}
                    onChange={handleAddInputOnChange}
                    allowClear={true}
                    placeholder="[-p 2233] [-o xx] root@example.com"
                    style={{width: 450}}
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
            loading={reloadListLoading}
            dataSource={list}
            showHeader={true}
            scroll={{y: 390}}
            rowKey={it => it.id}
            onChange={onTableChange}
            size="middle"
            expandable={{
                expandedRowRender: item => <p key={item.id * 100} style={{margin: 0}}>
                    {makeRDPCmdline(item, false)}
                </p>,
                rowExpandable: item => item.type === "windows" || item.params !== "" || item.username.length > 13 || item.host.length > 22,
            }}
            pagination={{
                pageSize: pagesize,
                hideOnSinglePage: true,
                total: list.length,
                showTotal: total => `共${total}条`,
            }}>

            <Column title="连接信息"
                    key="list"
                    filters={OSList}
                    filterSearch={true}
                    sorter={(a, b) => a.id - b.id}
                    onFilter={(value, record) => record.type === value}
                    render={(_, item) => <Row>
                        <Col>
                            <Avatar size={30} src={getLogoSrc(item.type)} style={{marginRight: "10px"}}/>
                        </Col>
                        <Col>
                                <span className="ssh-command" key={Math.random()}>
                                <a href="#" onDoubleClick={() => SSHConnect(item)}>
                                    {item.label === "" ? "未命名" : item.label}
                                </a>
                                <a href="#" onClick={() => editConnectLabel(item)}> <EditOutlined/> </a>
                                <br/>
                                    {makeRDPCmdline(item, true)}
                                </span>
                        </Col>
                    </Row>}/>

            <Column title="分组"
                    width={props.collapsed ? 180 : 120}
                    key="tags"
                    dataIndex="tags"
                    filters={tags}
                    filterSearch={true}
                    onFilter={(val, item) => {
                        if (item.tags !== null) {
                            for (let id of item.tags) {
                                if (id === val) {
                                    return true
                                }
                            }
                        }
                        return false
                    }}
                    render={(_, it) => {
                        if (it.tags !== null && it.tags.length > 0) {
                            it.tags.sort((a, b) => a - b)

                            let list = []
                            for (let id of it.tags) {
                                for (let tag of tags) {
                                    if (tag.id === id) {
                                        list.push(<Tag color="green" key={tag.id}>
                                            {tag.name}
                                        </Tag>)
                                    }
                                }
                            }

                            let resLength = list.length
                            if (props.collapsed) {
                                if (resLength <= 3) {
                                    return <Space>{list}</Space>
                                }
                                return <Tooltip title={list.slice(3)} placement="right" color="#fff">
                                    <Space>{list}</Space>
                                </Tooltip>
                            }

                            if (resLength > 1) {
                                return <Tooltip title={list.slice(1)} placement="right" color="#fff">
                                    <Space>{list[0]}</Space>
                                </Tooltip>
                            }
                            return <Space>{list[0]}</Space>
                        }

                        return <Tag>NULL</Tag>
                    }}
            />

            <Column
                width={250}
                render={(_, item) => {
                const isNT = item.type === "windows"
                return <Space size="middle">
                    <Space split={<Divider type="vertical"/>}>
                        <a key="list-conn" onClick={() => SSHConnect(item)}>连接</a>
                        {
                            item.params.indexOf("ProxyCommand") !== -1 || isNT ?
                                <a href="#" disabled>传输</a> :
                                <Link to={`/transfer/${btoa(encodeURIComponent(JSON.stringify(item)))}`}>传输</Link>
                        }
                        <a key="list-edit" onClick={() => editConnect(item)}>编辑</a>
                        <a key="list-more" onClick={() => moreActions(item)}>扩展</a>
                    </Space>
                </Space>
            }}/>
        </Table>
        <CustomModal ref={modalRef}/>
    </Container>
}
