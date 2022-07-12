import React, {useEffect, useState} from "react"
import Container from "./Container"
import "./Transfer.css"
import {Button, Input, message, Modal, Space, Table, Tooltip, Upload} from "antd"
import {useParams} from "react-router-dom"
import {
    CloudDownloadOutlined,
    CloudUploadOutlined,
    CodeOutlined,
    HomeOutlined,
    ReloadOutlined,
    RollbackOutlined,
} from "@ant-design/icons"

const {Dragger} = Upload

export default function (props) {
    const {id: args} = useParams()
    let {id, label, username, host} = JSON.parse(decodeURIComponent(atob(args)))
    id = String(id)

    let [list, setList] = useState([])
    let [wd, setWD] = useState("/")
    let [pn, setPN] = useState(1)
    let [tableLoading, setTableLoading] = useState(false)
    let [pageSize, setPageSize] = useState(30)
    let [fileList, setFileList] = useState([])
    let labelInputRef = React.createRef()

    function resolve(name) {
        const path = `${wd}${wd.substr(-1) !== "/" ? "/" : ""}${name}`
        return window.go.controller.Transfer.CleanPath(path)
    }

    async function listDir(dir) {
        setTableLoading(true)
        // 绝对路径不再拼接处理
        if (dir[0] !== "/") {
            dir = await resolve(dir)
        }

        window.runtime.EventsEmit("list_dir", id, dir)
        window.runtime.EventsOnce("list_dir_reply", data => {
            setTableLoading(false)
            if (data.status_code === 500) {
                return message.error(`列出${dir}目录失败: ${data.message}`)
            }

            let body = JSON.parse(data.body)
            setWD(wd => {
                // 文件夹排在最前面
                body.list.sort((a, b) => b.isdir ? 1 : -1)
                setList(body.list)
                setPN(1)
                setPageSize(30)

                return dir
            })
        })
    }

    async function downloadFile(file) {
        const path = await resolve(file.name)
        window.runtime.EventsEmit("download_files", id, path)
        window.runtime.EventsOnce("download_files_reply", data => {
            if (data.status_code === 500) {
                return message.error(`下载失败: ${data.message}`)
            }

            message.success(`已开始下载：${path}`)
        })
    }

    function uploadFile() {
        window.runtime.EventsEmit("upload_files", id, wd)
        window.runtime.EventsOnce("upload_files_reply", data => {
            if (data.status_code === 500) {
                return message.error(`上传到${wd}失败: ${data.message}`)
            }

            message.success(`正在将文件上传至： ${wd}`)
        })
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
                    <a onClick={() => message.info("暂未实现")}>删除</a>
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
        window.runtime.EventsEmit("open_ssh_session", [parseInt(id)], workdir)
        window.runtime.EventsOnce("open_ssh_session_reply", data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }
        })
    }

    return <Container title={label} subTitle={`${username}@${host}:${wd}`}>
        <Space>
            <Tooltip title="返回上一级目录">
                <Button shape="circle" icon={<RollbackOutlined/>} disabled={wd === "/" || tableLoading}
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
    </Container>
}
