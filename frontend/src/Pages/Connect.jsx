import React, {useEffect, useState} from "react"
import {Avatar, Button, Col, Divider, Form, Input, message, Modal, Row, Space, Table, Tag, Tooltip} from "antd"
import Container from "./Container"
import "./Connect.css"
import CustomModal from "../Components/Modal"
import {Link} from "react-router-dom"

import {
    ApiOutlined,
    CodeOutlined,
    CopyOutlined,
    DeleteOutlined,
    EditOutlined,
    FolderOpenOutlined,
    InfoCircleOutlined,
    MonitorOutlined,
    PlusOutlined,
    PoweroffOutlined,
    RedoOutlined,
    ReloadOutlined,
} from "@ant-design/icons"
import Column from "antd/es/table/Column"
import EditConnect, {OSList} from "./EditConnect"
import {getLogoSrc} from "../Helpers/logo"
import {SessionService, then} from "../rpc"

export default function (props) {
    let [all, setAll] = useState([])
    let [list, setList] = useState([])
    let [tags, setTags] = useState([])
    let [quickAddInput, setQuickAddInput] = useState("")
    let [quickAddInputLoading, setQuickAddInputLoading] = useState(false)
    let [reloadListLoading, setReloadListLoading] = useState(false)
    let [pagesize, setPageSize] = useState(10)
    let [tableHeight, setTableHeight] = useState(410)
    let [pn, setPN] = useState(1)
    let labelInputRef = React.createRef()
    let modalRef = React.createRef()

    useEffect(function () {
        refresh()
    }, [])

    const refresh = () => {
        loadList()
        loadTags()
        setPN(1)
        setPageSize(10)
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
        SessionService.QuerySessions(keyword).then(then(data => {
            let list = data.body ? data.body : []
            list.map(it => it.tags = JSON.parse(it.tags))
            setList(list)

            setReloadListLoading(false)
        }))

        SessionService.GetSessions().then(then(data => setAll(data.body ? data.body : [])))
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
            SessionService.DeleteConnect(item.id).then(data => {
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
                SessionService.UpdateSessionLabel(item).then(then(() => {
                    message.success("备注修改完成")
                    refresh()
                }))
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
            </>,
        })
    }

    const ping = (item) => {
        SessionService.PingConnect(item.id).then(data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }

            message.success("启动完成")
        })
    }

    const top = (item) => {
        SessionService.TopConnect(item.id).then(data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }
        })
    }

    const SSHConnect = (item) => {
        SessionService.OpenSSHSession(item.id, "").then(data => {
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
            tags: [],
            auth_type: "password",
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
        addConnect(args)
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

        let ssh = `ssh ${param}${port}${item.username}@${host}`
        if (short) {
            return ssh
        }

        return <>
            <b>ssh: </b>{ssh} <br/>
            <b>scp: </b>export FILES=$(ls); scp -r {param}{port.toUpperCase()} $FILES {item.username}@{host}:/root
        </>
    }

    const onTableChange = (pagination, filters, sorter, extra) => {
        setPN(pagination.current)
        setPageSize(filters.list !== null || filters.tags !== null ? 999 : pagination.pageSize)
    }

    const openLocalConsole = () => {
        SessionService.OpenLocalConsole().then(data => {
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

    let [connectInfo, setConnectInfo] = useState(null)
    let [showEdit, setShowEdit] = useState(false)
    const editConnect = (values) => {
        SessionService.UpdateSession(values).then(then(() => {
            setShowEdit(false)
            loadList()
            message.success("连接信息修改完成")
        }))
    }

    let [showAdd, setShowAdd] = useState(false)
    const addConnect = (values) => {
        const hide = message.loading(`正在添加: ${values.host}`, 0)

        values.tags = JSON.stringify(values.tags)
        SessionService.CreateSession(values).then(then(data => {
            hide()
            message.success("添加完成")

            setShowAdd(false)
            setQuickAddInputLoading(false)
            setQuickAddInput("")
            refresh()
        }))
    }

    return <Container title="远程连接" subTitle="快速连接SSH和进行双向文件传输" overflowHidden>
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
                <Tooltip title="添加连接">
                    <Button shape="circle" icon={<PlusOutlined/>} onClick={() => {
                        setShowAdd(true)
                    }}/>
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
            bordered
            loading={reloadListLoading}
            dataSource={list}
            showHeader={true}
            scroll={{y: tableHeight}}
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
                size: "default",
                simple: true,
                showSizeChanger: true,
                current: pn,
                total: list.length,
                pageSize: pagesize,
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
                                <span onClick={() => SSHConnect(item)} className="connect-name">
                                    {item.label === "" ? "未命名" : item.label}
                                </span>
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
                                isNT ? <a href="#" disabled>传输</a> :
                                    <Link
                                        to={`/toy-remote/transfer/${btoa(encodeURIComponent(JSON.stringify(item)))}`}>传输</Link>
                            }
                            <a key="list-edit" onClick={() => {
                                setConnectInfo(item)
                                setShowEdit(true)
                            }}>编辑</a>
                            <a key="list-more" onClick={() => moreActions(item)}>扩展</a>
                        </Space>
                    </Space>
                }}/>
        </Table>
        <EditConnect
            title="编辑连接"
            tags={tags}
            open={showEdit}
            connect={connectInfo}
            onClose={() => setShowEdit(false)}
            onSubmit={editConnect}
            extra={
                <Button icon={<DeleteOutlined/>} onClick={() => {
                    deleteSSHConnect(connectInfo)
                    setShowEdit(false)
                }}>删除</Button>
            }
            proxyServers={all}
        />
        <EditConnect
            title="添加连接"
            tags={tags}
            open={showAdd}
            connect={{
                label: "",
                type: "",
                username: "",
                params: "",
                host: "",
                auth_type: "password",
                tags: [],
            }}
            onClose={() => setShowAdd(false)}
            onSubmit={addConnect}
            proxyServers={all}
        />
        <CustomModal ref={modalRef}/>
    </Container>
}
