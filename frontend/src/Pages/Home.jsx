import React, {useEffect, useState} from "react"
import Container from "./Container"
import "./Home.css"
import {
    Avatar,
    Button,
    Card,
    Col,
    Divider,
    Drawer,
    Form,
    Input,
    message,
    PageHeader,
    Radio,
    Row,
    Statistic,
    Tag,
    Typography,
} from "antd"
import BrowserLink from "../Components/BrowserLink"
import Meta from "antd/es/card/Meta"
import {getLogoSrc} from "../Helpers/logo"
import {SaveOutlined} from "@ant-design/icons"
import TextArea from "antd/es/input/TextArea"
import moment from "moment"
import He from "../Components/He"
import {SessionService, then} from "../rpc"

const {Paragraph} = Typography

const tabs = [{
    key: "connect", tab: "连接",
}, {
    key: "bookmark", tab: "书签",
}]

const gridStyle = {
    width: "25%", textAlign: "center",
}

const weekDays = {
    1: "一",
    2: "二",
    3: "三",
    4: "四",
    5: "五",
    6: "六",
    7: "日",
}

const timeSegment = () => {
    let h = moment().hour()
    if (h > 8 && h < 11) {
        return "上午好"
    }

    if (h === 12) {
        return "中午好"
    }

    if (h <= 17) {
        return "下午好"
    }

    if (h <= 21) {
        return "晚上好"
    }

    if (h <= 24) {
        return "夜深了"
    }
}

export default function (props) {
    let ref = React.createRef()
    let [showAdd, setShowAdd] = useState(false)
    const [activeTabKey, setActiveTabKey] = useState("connect")
    const [connects, setConnects] = useState([])
    const [recent, setRecent] = useState([])
    const [connectSum, setConnectSum] = useState(0)
    const [now, setNow] = useState(moment())

    const Grid = function ({data}) {
        let label
        if (data.label !== "") {
            label = data.label
        } else {
            try {
                let u = new URL(data.url)
                label = u.origin
            } catch (e) {
                label = data.url.substring(0, 10)
            }
        }

        return <Card.Grid style={gridStyle}>
            <BrowserLink href={data.url}>{label}</BrowserLink>
        </Card.Grid>
    }

    const contentListNoTitle = {
        connect: <>
            {connects.map((it, i) => {
                if (i >= 8) {
                    return
                }

                return <Card.Grid style={{width: "25%", textAlign: "left"}} key={it.id}>
                    <a onClick={() => {
                        SessionService.OpenSSHSession(it.id, "").then(data => {
                            if (data.status_code === 500) {
                                return message.error(data.message)
                            }
                        })
                    }}>
                        <Meta
                            avatar={<Avatar src={getLogoSrc(it.type)}/>}
                            title={it.label === "" ? it.host : it.label}
                            description={`${it.username.substring(0, 5)}@${it.host}`}
                        />
                    </a>
                </Card.Grid>
            })}
        </>,
        recent: recent.filter(it => it.type === "recent").map(it => <Grid data={it} key={it.id}/>),
        bookmark: recent.filter(it => it.type === "bookmark").map(it => <Grid data={it} key={it.id}/>),
    }

    const onTab2Change = (key) => {
        setActiveTabKey(key)
    }

    const loadList = () => {
        SessionService.GetSessions().then(then(data => setConnects(data.body ? data.body : [])))

        window.runtime.EventsOnce("get_stats_reply", data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }

            setConnectSum(data.body.sum_count)
        })

        window.runtime.EventsOnce("get_recent_reply", data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }
            setRecent(data.body)
        })

        window.runtime.EventsEmit("get_connects", "")
        window.runtime.EventsEmit("get_recent", "")
        window.runtime.EventsEmit("get_stats", "")
    }

    const loadRecent = () => {
        window.runtime.EventsOnce("get_recent_reply", data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }
            setRecent(data.body)
        })

        window.runtime.EventsEmit("get_recent", "")
    }

    const IsSingle = () => {
        return now.week() % 2 !== 0
    }

    const IsWorkday = () => {
        if (IsSingle()) {
            return now.weekday() <= 6
        }

        return now.weekday() <= 5
    }

    const submitValues = () => {
        let values = ref.current.getFieldsValue(true)
        if (!values.type) {
            values.type = "recent"
        }

        if (!values.url || !values.label) {
            return message.error("URL和备注必填")
        }

        let data = {
            label: values.label,
            logo_url: values.logo_url,
            url: values.url,
            type: values.type,
        }

        try {
            let u = new URL(values.url)
            data.logo_url = `${u.origin}/favicon.ico`
        } catch (e) {
            return message.error("无法解析url：" + e.message)
        }

        window.runtime.EventsOnce("add_recent_reply", data => {
            if (data.status_code === 500) {
                return message.error(data.message)
            }

            loadRecent()
            setShowAdd(false)
            message.success("添加完成")
        })
        window.runtime.EventsEmit("add_recent", data)
    }

    let heRef = React.createRef()
    useEffect(function () {
        loadList()
        loadRecent()
        if (heRef.current) {
            heRef.current.render()
        }
    }, [])

    return <Container title="" subTitle="" overflowHidden>
        <PageHeader
            style={{"--wails-draggable": "drag"}}
            title={`${timeSegment()}，哲`}
            className="site-page-header"
            subTitle={`${now.format("YYYY-MM-DD")} 周${weekDays[now.weekday()]}/${now.week()}`}
            tags={<Tag color="blue">{IsWorkday() ? "工作日" : "休息日"}</Tag>}
            avatar={{src: "https://alextech-1252251443.cos.ap-guangzhou.myqcloud.com/IMG_0484.JPG"}}>
            <Row>
                <div style={{flex: 1}}>
                    <Paragraph>
                        &nbsp; &nbsp; &nbsp; &nbsp;青年们先可以将中国变成一个有声的中国。大胆地说话，勇敢地进行，忘掉了一切利害，推开了古人，将自己真心的话发表出来……只有真的声音，才能感动中国的人和世界的人；必须有了真的声音，才能和世界的人同在世界上生活。
                    </Paragraph>
                    <Divider/>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Statistic title="现有连接" value={connects.length}/>
                        </Col>
                        <Col span={6}>
                            <Statistic title="累计连接次数" value={connectSum}/>
                        </Col>
                    </Row>
                </div>
                <div className="image">
                    <He heRef={heRef}/>
                </div>
            </Row>
        </PageHeader>

        <Row gutter={16}>
            <Card
                title="最常访问"
                style={{
                    width: "100%",
                }}
                tabList={tabs}
                activeTabKey={activeTabKey}
                onTabChange={(key) => {
                    onTab2Change(key)
                }}
                extra={<a href="#" onClick={() => setShowAdd(true)}>添加</a>}
            >
                {contentListNoTitle[activeTabKey]}
            </Card>
        </Row>

        <Drawer
            title="添加"
            placement="right"
            width={500}
            open={showAdd}
            visible={showAdd}
            onClose={() => setShowAdd(false)}
            closable={true}
            extra={<Button icon={<SaveOutlined/>} type="primary" onClick={submitValues}>提交</Button>}
        >
            <Form
                ref={ref}
                labelCol={{span: 4}}
                layout="horizontal"
                size="default"
            >
                <Form.Item label="类型" name="type" rules={[{required: true}]}>
                    <Radio.Group allowClear defaultValue="recent">
                        {tabs.map(it => {
                            if (it.key === "connect") {
                                return
                            }
                            return <Radio.Button value={it.key} key={it.key}>{it.tab}</Radio.Button>
                        })}
                    </Radio.Group>
                </Form.Item>
                <Form.Item label="备注" name="label" rules={[{required: true}]}>
                    <Input placeholder="备注信息" allowClear/>
                </Form.Item>
                <Form.Item label="LOGO" name="logo_url">
                    <Input placeholder="网站LOGO链接，默认为 fav.icon" allowClear/>
                </Form.Item>
                <Form.Item label="链接" name="url" rules={[{required: true}]}>
                    <TextArea rows={10} placeholder="目标网站的URL" allowClear/>
                </Form.Item>
            </Form>
        </Drawer>
    </Container>
}
