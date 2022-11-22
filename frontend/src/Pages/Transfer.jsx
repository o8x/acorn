import React, {useEffect, useState} from "react"
import Container from "./Container"
import "./Transfer.css"
import {Button, Input, message, Modal, Space, Table, Tooltip, Upload} from "antd"
import {useParams} from "react-router-dom"
import CustomModal from "../Components/Modal"
import Editor from "../Components/Editor"
import {
    ArrowLeftOutlined,
    CloudDownloadOutlined,
    CloudUploadOutlined,
    CodeOutlined,
    ExclamationCircleOutlined,
    HomeFilled,
    HomeOutlined,
    ReloadOutlined,
    ToolOutlined,
} from "@ant-design/icons"

import {FileSystemService, SessionService, then} from "../rpc"

const {Dragger} = Upload

export default function (props) {
    const {id: args} = useParams()
    let {id, label, username, host} = JSON.parse(decodeURIComponent(atob(args)))
    id = String(id)

    const home = username === "root" ? "/root" : "/home"
    const etc = "/etc"
    let [list, setList] = useState([])
    let [wd, setWD] = useState("/")
    let [pn, setPN] = useState(1)
    let [tableLoading, setTableLoading] = useState(false)
    let [pageSize, setPageSize] = useState(100)
    let [fileList, setFileList] = useState([])
    let labelInputRef = React.createRef()

    async function resolve(name) {
        const path = `${wd}${wd.substr(-1) !== "/" ? "/" : ""}${name}`
        return await FileSystemService.CleanPath(path)
    }

    async function listDir(dir) {
        setTableLoading(true)
        // 绝对路径不再拼接处理
        if (dir[0] !== "/") {
            dir = await resolve(dir)
        }

        window.go.service.FileSystemService.ListDir(Number(id), dir).then(data => {
            console.log(data)
            if (data.status_code === 500) {
                return message.error(`列出${dir}目录失败: ${data.message}`)
            }

            let body = JSON.parse(data.body)
            setWD(wd => {
                // 文件夹排在最前面
                body.list.sort((a, b) => b.isdir ? 1 : -1)
                setList(body.list)
                setPN(1)
                setPageSize(100)

                return dir
            })
        }).finally(() => setTableLoading(false))
    }

    async function removeFile(file) {
        const path = await resolve(file.name)
        window.runtime.EventsOnce("remove_files_reply", data => {
            if (data.status_code === 500) {
                return message.error(`下载失败: ${data.message}`)
            }

            message.success(`${path} 已被移动到 /tmp 目录，重启后自动删除。`)
        })

        Modal.confirm({
            title: "确认删除",
            icon: <ExclamationCircleOutlined/>,
            content: `确认删除文件：${path}？`,
            okText: "确认",
            cancelText: "取消",
            onOk() {
                window.runtime.EventsEmit("remove_files", id, path)
            },
        })
    }

    let mr = React.createRef()

    async function editFile(file) {
        message.info(`正在读取文件内容，请不要进行重复操作。`)
        const path = await resolve(file.name)
        window.runtime.EventsEmit("edit_file", id, path)
        window.runtime.EventsOnce("edit_file_reply", data => {
            if (data.status_code === 500) {
                return message.error(`编辑失败: ${data.message}`)
            }

            let text = data.body
            mr.current.setTitle(`编辑文件: ${path}`)
            mr.current.setWidth(800)
            mr.current.setStyle({top: 20})
            mr.current.setContent(<Editor value={data.body} height="400px" onChange={t => {
                text = t
            }}/>)
            mr.current.show(() => {
                message.info(`正在保存文件，将自动生成 ${path}.backup 备份文件`)
                window.runtime.EventsEmit("save_file", id, path, text)
            })
        })

        window.runtime.EventsOnce("save_file_reply", data => {
            if (data.status_code === 500) {
                return message.error(`文件保存失败: ${data.message}`)
            }
            message.info("保存成功")
        })
    }

    function uploadFile() {
        FileSystemService.UploadFiles(Number(id), wd).then(then(() => message.success(`后台上传已开始`)))
    }

    async function downloadFile(file) {
        const path = await resolve(file.name)

        FileSystemService.DownloadFiles(Number(id), path).then(then(() => message.success(`后台下载已开始`)))
    }

    function cloudDownloadFile() {
        Modal.confirm({
            title: "云下载", okText: "确定", cancelText: "取消", content: (<Input
                placeholder="下载连接"
                onChange={({target: {value}}) => {
                    labelInputRef.current = value
                }}
            />), icon: null, onOk: () => {
                window.runtime.EventsEmit("cloud_download", id, wd, labelInputRef.current)
                window.runtime.EventsOnce("cloud_download_reply", data => {
                    if (data.status_code === 500) {
                        return message.error("下载失败 " + data.message)
                    }

                    message.success("已开始下载")
                })
            },
        })
    }

    const columns = [
        {
            title: "文件名", dataIndex: "name", key: Math.random(), width: 300,
            render: (_, record) => {
                if (record.isdir) {
                    return <a onClick={() => listDir(record.name)}>{record.name}</a>
                }
                return record.name
            },
        },
        {title: "权限", dataIndex: "mode", key: "mode", width: 100},
        {
            title: "体积", dataIndex: "size", key: "size", width: 100,
            sorter: (a, b) => a.size - b.size,
            render: (_, record) => {
                if (record.name === "../") {
                    return
                }

                const size = record.size
                if (parseInt(size) === 0) {
                    return "-"
                }

                if (size < 1000) {
                    return size
                }

                if (size >= 1000 && size < 1000000) {
                    return `${(size / 1000).toFixed(2)}KB`
                }

                if (size >= 1000000 && size < 1000000000) {
                    return `${(size / 1000000).toFixed(2)}MB`
                }

                return `${(size / 1000000000).toFixed(2)}GB`
            },
        },
        {title: "用户", dataIndex: "user", key: "user", width: 100},
        {title: "修改时间", dataIndex: "mtime", key: "mtime"},
        {
            title: "操作", key: "action", render: (_, record) => {
                if (record.name === "../") {
                    return
                }
                return <Space size="middle">
                    <a onClick={() => downloadFile(record)}>下载</a>
                    <a onClick={() => removeFile(record)}>删除</a>
                    {record.isdir || record.size > 10000000 ? "" : <a onClick={() => editFile(record)}>编辑</a>}
                </Space>
            },
        }]

    useEffect(() => {
        listDir("")
        props.setCollapse(true)
    }, [])

    const dragProps = {
        multiple: false,
        showUploadList: false,
        fileList,
        beforeUpload: () => false,
        onChange: info => info.fileList.map(it => {
            // 多文件上传时，将会出现重复遍历的问题
            setFileList(() => {
                const r = new FileReader()
                r.readAsDataURL(it.originFileObj)
                r.onload = () => {
                    window.runtime.EventsEmit("drag_upload_files", id, wd, it.name, r.result)
                    window.runtime.EventsOnce("drag_upload_files_reply", data => {
                        if (data.status_code === 500) {
                            return message.error(`上传文件流${wd}失败: ${data.message}`)
                        }

                        message.success(`正在将文件流上传至： ${wd}`)
                    })
                }

                r.onerror = message.error
                return []
            })
        }),
        onDrop(e) {
            console.log("Dropped files", e.dataTransfer.files)
        },
    }

    function SSHConnect(id, workdir) {
        SessionService.OpenSSHSession(parseInt(id), workdir).then(data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }
        })
    }

    return <Container title={label} subTitle={`${username}@${host}:${wd}`}>
        <Space>
            <Tooltip title="返回上一级目录">
                <Button shape="circle" icon={<ArrowLeftOutlined/>} disabled={wd === "/" || tableLoading}
                        onClick={() => listDir("../")}/>
            </Tooltip>
            <Tooltip title="刷新当前目录">
                <Button shape="circle" icon={<ReloadOutlined/>} disabled={tableLoading}
                        onClick={() => listDir(wd)}
                />
            </Tooltip>
            <Tooltip title="返回根目录">
                <Button shape="circle" icon={<HomeOutlined/>} disabled={wd === "/"}
                        onClick={() => listDir("/")}/>
            </Tooltip>
            <Tooltip title={"进入用户家目录: " + home}>
                <Button shape="circle" icon={<HomeFilled/>} disabled={tableLoading || wd === home}
                        onClick={() => listDir(home)}/>
            </Tooltip>
            <Tooltip title={"进入etc目录: " + etc}>
                <Button shape="circle" icon={<ToolOutlined/>} disabled={tableLoading || wd === etc}
                        onClick={() => listDir(etc)}/>
            </Tooltip>
            <Tooltip title={`启动 SSH 会话并将工作目录设置为：${wd}`}>
                <Button shape="circle" icon={<CodeOutlined/>} disabled={tableLoading}
                        onClick={() => SSHConnect(id, wd)}/>
            </Tooltip>
            <Tooltip title={`下载远程文件到: ${wd}`}>
                <Button icon={<CloudDownloadOutlined/>} onClick={cloudDownloadFile}
                        disabled={tableLoading}>云下载</Button>
            </Tooltip>
            <Dragger {...dragProps}>
                <Tooltip title={`将本地文件上传到: ${wd}，同时支持将文件拖拽到本按钮上以文件流形式上传`}>
                    <Button type="primary" onClick={uploadFile} icon={<CloudUploadOutlined/>}
                            disabled={tableLoading}>云上传</Button>
                </Tooltip>
            </Dragger>
        </Space>
        <Table className="file-table" columns={columns} dataSource={list}
               scroll={{x: 790, y: 405}}
               size="small"
               expandable
               loading={tableLoading}
               rowKey={() => Math.random()} pagination={
            {
                current: pn,
                hideOnSinglePage: true,
                total: list.length,
                pageSize: pageSize,
                onChange: (p, s) => {
                    setPN(p)
                    setPageSize(s)
                },
                showTotal: total => `共${total}条`,
            }
        }/>
        <CustomModal ref={mr}/>
    </Container>
}
