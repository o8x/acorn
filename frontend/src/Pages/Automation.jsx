import React, {useEffect, useState} from "react"
import Container from "./Container"
import {Avatar, Button, message, Modal, Select, Space, Table} from "antd"
import Column from "antd/es/table/Column"
import {AutomationService, SessionService, success, then} from "../rpc"
import Editor from "../Components/Editor"
import CustomModal from "../Components/Modal"
import {Option} from "antd/es/mentions"
import {getLogoSrc} from "../Helpers/logo"

export default function (props) {
    let mr = React.createRef()
    let [list, setList] = useState([])

    useEffect(() => {
        reload()
    }, [])

    const reload = () => {
        AutomationService.GetAutomations().then(then(data => {
            setList(data.body)
        }))
    }

    const edit = item => {
        mr.current.setTitle(`编辑自动化: ${item.name}`)
        mr.current.setWidth(800)
        mr.current.setStyle({top: 20})
        mr.current.setContent(<Editor value={item.playbook} lang="yaml" height="400px" onChange={t => {
            item.playbook = t
        }}/>)
        mr.current.show(() => {
            if (item.id === 0) {
                return
            }

            AutomationService.UpdateAutomation(Number(item.id), item).then(then(data => {
                message.success("编辑完成")
                reload()
            }))
        })
    }

    const add = () => {
        let item = {
            playbook: `name: 新自动化
desc: 在目标会话中输出 'Hello World'
tasks:
    - name: Hello World
      builtin.shell.remote:
          command: echo 'Hello World'
`,
        }

        mr.current.setTitle("新建自动化")
        mr.current.setWidth(800)
        mr.current.setStyle({top: 20})
        mr.current.setContent(<Editor value={item.playbook} lang="yaml" height="400px" onChange={t => {
            item.playbook = t
        }}/>)
        mr.current.show(() => {
            AutomationService.CreateAutomation(item).then(() => {
                message.success("新建完成")
                reload()
            })
        })
    }

    const run = item => {
        let args = {}
        let lastID = localStorage.getItem(`S${item.id}`)
        if (lastID !== null) {
            args.defaultValue = Number(lastID)
        }

        SessionService.GetSessions().then(then(data => {
            let id = 0
            Modal.confirm({
                title: <>在何处运行自动化 [{item.name}]</>,
                cancelText: "取消",
                width: 600,
                icon: null,
                content: <>
                    <br/>
                    <Space split={":"}>
                        选择目标会话
                        <Select {...args} showSearch placeholder="会话" style={{width: "430px"}}
                                allowClear
                                onChange={value => {
                                    id = value
                                }}>
                            {data.body.map(it => {
                                return <Option value={it.id} key={it.id}>
                                    <Avatar size={20} src={getLogoSrc(it.type)}/> {it.label} ({it.host})
                                </Option>
                            })}
                        </Select>
                    </Space>
                </>,
                onOk() {
                    localStorage.setItem(`S${item.id}`, id)
                    AutomationService.RunAutomation(item.id, id).then(success(`${item.name} 已开始执行`))
                },
            })
        }))
    }

    const del = item => {
        Modal.confirm({
            title: "删除自动化",
            cancelText: "取消",
            width: 600,
            icon: null,
            content: <>
                即将删除自动化: <b>[{item.name}]</b>
            </>,
            onOk() {
                AutomationService.DeleteAutomation(item.id).then(then(reload))
            },
        })
    }

    const showLog = item => {
        mr.current.setTitle(`[${item.name}] 运行日志`)
        mr.current.setWidth(800)
        mr.current.setStyle({top: 20})
        AutomationService.GetAutomationLogs(item.id).then(then(data => {
            if (data.body.length === 0) {
                return message.error("无日志")
            }

            mr.current.setContent(<Editor value={data.body[data.body.length - 1].contents} readonly height="400px"/>)
            mr.current.show()
        }))
    }

    return <Container title="自动化" subTitle="提供类 ansible 的自动化功能">
        <Button onClick={add} type="primary" style={{marginBottom: 16}}>新自动化</Button>
        <Table
            bordered
            dataSource={list}
            rowKey={it => it.id}
            size="small">

            <Column title="自动化"
                    key="list"
                    width={600}
                    sorter={(a, b) => a.id - b.id}
                    render={(_, item) => item.name}/>

            <Column title="操作"
                    key="list"
                    render={(_, item) => {
                        if (item.id === 0) {
                            return <Space size="middle">
                                <a key="list-edit" onClick={() => edit(item)}>查看示例</a>
                            </Space>
                        }

                        return <Space size="middle">
                            <a key="list-edit" onClick={() => edit(item)}>编辑</a>
                            <a key="list-run" onClick={() => run(item)}>运行</a>
                            <a key="list-log" onClick={() => showLog(item)}>日志</a>
                            <Button type="text" danger disabled={item.id === 0}
                                    onClick={() => del(item)}>删除</Button>
                        </Space>
                    }}/>
        </Table>
        <CustomModal ref={mr}/>
    </Container>
}
