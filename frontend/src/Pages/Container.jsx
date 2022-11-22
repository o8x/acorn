import React, {useEffect, useState} from "react"
import {Button, Drawer, List, message, PageHeader, Space, Switch, Tag, Tooltip, Typography} from "antd"
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    MinusCircleOutlined,
    OrderedListOutlined,
    ReloadOutlined,
    StopOutlined,
    SyncOutlined,
    ZoomInOutlined,
} from "@ant-design/icons"
import "./Container.css"
import {TaskService} from "../rpc"
import Editor from "../Components/Editor"
import {useLocation} from "react-router-dom"

const {Title, Paragraph} = Typography

export default function (props) {
    const headerHeight = useLocation().pathname === "/" ? 0 : 72

    let [containerHeight, setContainerHeight] = useState(window.innerHeight - headerHeight)
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
        window.onresize = () => setContainerHeight(window.innerHeight - headerHeight)
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

    const statusIcon = {
        success: <CheckCircleOutlined/>,
        timeout: <ClockCircleOutlined/>,
        running: <SyncOutlined spin/>,
        error: <CloseCircleOutlined/>,
        stop: <MinusCircleOutlined/>,
    }

    const statusTag = {
        success: <Tag icon={statusIcon.success} color="success">已完成</Tag>,
        timeout: <Tag icon={statusIcon.timeout} color="default">已超时</Tag>,
        running: <Tag icon={statusIcon.running} color="processing">执行中</Tag>,
        error: <Tag icon={statusIcon.error} color="error">已失败</Tag>,
        stop: <Tag icon={statusIcon.stop} color="default">已取消</Tag>,
    }

    return <>
        <div style={{"--wails-draggable": "drag"}} onDoubleClick={window.runtime.WindowToggleMaximise}>
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
                                title={<>{item.title} {statusIcon[item.status]}</>}
                                description={item.description}
                            />
                            {item.status === "running" ? <Tooltip title="取消任务">
                                <Button danger icon={<StopOutlined/>} type="link"
                                        onClick={() => cancelTask(item)}/>
                            </Tooltip> : ""}
                            {item.status === "error" || item.status === "timeout" ? <Tooltip title="取消任务">
                                <Button danger icon={<StopOutlined/>} type="link"
                                        onClick={() => cancelTask(item)}/>
                            </Tooltip> : ""}
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
                <Paragraph>状态：{statusTag[taskDetail.status]}</Paragraph>
                <Paragraph>创建时间：{taskDetail.create_time}</Paragraph>
                <Title level={5}>命令：</Title>
                <Paragraph>
                    <Editor value={taskDetail.command} autowrap height="150px"/>
                </Paragraph>
                <Title level={5}>运行结果：<Switch size="small" defaultChecked/></Title>
                <Paragraph>
                    <Editor value={taskDetail.result} height="150px"/>
                </Paragraph>
            </Drawer>
        </Drawer>
    </>
}
