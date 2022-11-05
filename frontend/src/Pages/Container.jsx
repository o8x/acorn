import React, {useEffect, useState} from "react"
import {Badge, Button, Drawer, List, message, PageHeader, Space, Switch, Tooltip, Typography} from "antd"
import {OrderedListOutlined, ReloadOutlined, StopOutlined, ZoomInOutlined} from "@ant-design/icons"
import "./Container.css"
import {TaskService} from "../rpc"
import Editor from "../Components/Editor"

const {Title, Paragraph} = Typography

export default function (props) {
    let [containerHeight, setContainerHeight] = useState(window.innerHeight - 72)
    let [visible, setVisible] = useState(false)
    let [detailDrawer, setDetailDrawer] = useState(false)
    let [displayAll, setDisplayAll] = useState(false)
    let [taskDetail, setTaskDetail] = useState({})
    let [tasks, setTasks] = useState([])

    const reloadTasks = displayAll => {
        let list = TaskService.ListNormal
        if (displayAll) {
            list = TaskService.ListAll
        }

        list().then(res => {
            if (res.status_code === 200) {
                setTasks(res.body)
            }
        })
    }

    useEffect(() => {
        reloadTasks()

        window.onresize = () => setContainerHeight(window.innerHeight - 72)
        return () => window.onresize = null
    }, [])

    const onClose = function () {
        setVisible(false)
    }

    const onDetailDrawerClose = function () {
        setDetailDrawer(false)
    }

    const cancelTask = function (item) {
        TaskService.Cancel(item.id).then(() => {
            message.info("任务已取消")
            reloadTasks()
        })
    }

    return <>
        <div style={{"--wails-draggable": "drag"}}>
            <Button className="open-task-btn" type="dashed" shape="text"
                    onClick={() => setVisible(true)} icon={<OrderedListOutlined/>}/>
            {props.title === "" && props.subTitle === "" ? "" : <PageHeader
                title={props.title}
                subTitle={props.subTitle}
            />}
        </div>
        <div
            className="site-layout-background"
            style={{
                padding: 16, height: containerHeight, overflow: props.overflowHidden ? "hidden" : "auto",
            }}
        >
            {props.children}
        </div>

        <Drawer
            title="后台作业列表"
            placement="right"
            width={500}
            open={visible}
            visible={visible}
            onClose={onClose}
            closable={true}
            extra={<Space>
                <Tooltip title="显示历史作业">
                    <Switch onChange={checked => {
                        setDisplayAll(checked)
                        reloadTasks(checked)
                    }}/>
                </Tooltip>
                <Tooltip title="刷新作业列表">
                    <Button icon={<ReloadOutlined/>} shape="circle" onClick={() => reloadTasks(displayAll)}/>
                </Tooltip>
            </Space>}>

            <div
                id="scrollableDiv"
                style={{
                    height: "100%", overflow: "auto",
                }}
            >
                <List
                    dataSource={tasks}
                    renderItem={(item) => <>
                        <List.Item key={item}>
                            <List.Item.Meta
                                title={<>{item.title} <Badge status="processing" /></>}
                                description={item.description}
                            />
                            <Tooltip title="取消任务">
                                <Button danger icon={<StopOutlined/>} type="link"
                                        onClick={() => cancelTask(item)}/>
                            </Tooltip>
                            <Tooltip title="任务详情">
                                <Button icon={<ZoomInOutlined/>} type="link"
                                        onClick={() => {
                                            setDetailDrawer(true)
                                            setTaskDetail(item)
                                        }}/>
                            </Tooltip>
                        </List.Item>
                    </>}
                />
            </div>

            <Drawer
                title={taskDetail.title}
                width={500}
                closable={false}
                onClose={onDetailDrawerClose}
                open={detailDrawer}
                visible={detailDrawer}
            >
                <Paragraph>{taskDetail.description}</Paragraph>
                <Paragraph>创建时间：{taskDetail.create_time}</Paragraph>
                <Title level={5}>命令：</Title>
                <Paragraph>
                    <Editor value={taskDetail.command} autowrap height="150px"/>
                </Paragraph>
                <Title level={5}>运行结果：</Title>
                <Paragraph>
                    <Editor value={taskDetail.result} height="150px"/>
                </Paragraph>
            </Drawer>
        </Drawer>
    </>
}
