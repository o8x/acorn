import React, {useEffect, useState} from "react"
import Container from "./Container"
import "./Transfer.css"
import {Button, message, Space, Table, Tooltip} from "antd"
import {useParams} from "react-router-dom"
import {RedoOutlined, UploadOutlined} from "@ant-design/icons"

export default function () {
    const {id: args} = useParams()
    let {id, label, username, host} = JSON.parse(decodeURIComponent(atob(args)))
    id = String(id)

    let [list, setList] = useState([])
    let [wd, setWD] = useState("/")
    let [pn, setPN] = useState(1)
    let [tableLoading, setTableLoading] = useState(false)
    let [pageSize, setPageSize] = useState(20)

    function resolve(name) {
        const path = `${wd}${wd.substr(-1) !== "/" ? "/" : ""}${name}`
        return window.go.controller.Transfer.CleanPath(path)
    }

    async function listDir(dir) {
        setTableLoading(true)
        dir = await resolve(dir)

        window.runtime.EventsEmit("list_dir", id, dir)
        window.runtime.EventsOnce("list_dir_reply", data => {
            setTableLoading(false)
            if (data.status_code === 500) {
                return message.error(`列出${dir}目录失败: ${data.message}`)
            }

            let body = JSON.parse(data.body)
            setWD(wd => {
                setList(body.list)
                setPN(1)
                setPageSize(20)

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

    const columns = [{
        title: "文件名", dataIndex: "name", key: Math.random(), render: (_, record) => {
            if (record.isdir) {
                return <a onClick={() => listDir(record.name)}>{record.name}</a>
            }
            return record.name
        },
    }, {
        title: "体积", dataIndex: "size", key: "size",
    }, {
        title: "操作", key: "action", render: (_, record) => (<Space size="middle">
            <a onClick={() => downloadFile(record)}>下载</a>
        </Space>),
    }]

    useEffect(() => {
        listDir("")
    }, [])

    return <Container title={label} subTitle={`${username}@${host}:${wd}`}>
        <Space>
            <Tooltip title="刷新当前目录" style={{marginLeft: 10}}>
                <Button shape="circle" icon={<RedoOutlined/>}
                        onClick={() => listDir(wd)}
                />
            </Tooltip>
            <Button type="primary" onClick={uploadFile} icon={<UploadOutlined />}>上传文件到：{wd}</Button>
        </Space>
        <Table className="file-table" columns={columns} dataSource={list}
               scroll={{x: 1000, y: 405}}
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
