import {Col, Progress, Row, Statistic, Tooltip, Typography} from "antd"
import React, {useEffect, useState} from "react"
import Container from "./Container"
import "./Clock.css"
import {GiftOutlined} from "@ant-design/icons"
import moment from "moment"

const {Title} = Typography
const {Countdown} = Statistic

const holidays = [{
    name: "元旦",
    startDate: moment("2022/12/31 00:00:00").subtract(6, "hours"),
    endDate: moment("2023/01/02 23:59:59"),
    remarks: "2022年12月31日至2023年1月2日放假调休，共3天。2023年1月3日（星期二）上班。",
}, {
    name: "春节",
    startDate: moment("2023/01/21 00:00:00").subtract(6, "hours"),
    endDate: moment("2023/1/27 23:59:59"),
    remarks: "2023年1月21日至27日放假调休，共7天。1月28日（星期六）、1月29日（星期日）上班。",
}, {
    name: "清明节",
    startDate: moment("2023/04/05 00:00:00").subtract(6, "hours"),
    endDate: moment("2023/04/05 23:59:59"),
    remarks: "4月5日放假，共1天。4月6日（星期四）上班。",
}, {
    name: "劳动节",
    startDate: moment("2023/05/01 00:00:00").subtract(6, "hours"),
    endDate: moment("2023/05/05 23:59:59"),
    remarks: "5月1日至5月5日放假调休，共5天。4月29日（星期六）4月30日（星期日）上班。",
}, {
    name: "端午节",
    startDate: moment("2023/06/22 00:00:00").subtract(6, "hours"),
    endDate: moment("2023/06/24 23:59:59"),
    remarks: "6月22日至24日放假公休，共3天。6月25日（星期日）上班。",
}, {
    name: "中秋节",
    startDate: moment("2023/09/29 00:00:00").subtract(6, "hours"),
    endDate: moment("2023/10/06 23:59:59"),
    remarks: "9月29日至10月6日放假调休，共8天。10月7日（星期五）10月8日（星期六）上班。",
}, {
    name: "国庆节",
    startDate: moment("2023/09/29 00:00:00").subtract(6, "hours"),
    endDate: moment("2023/10/06 23:59:59"),
    remarks: "9月29日至10月6日放假调休，共8天。10月7日（星期五）10月8日（星期六）上班。",
}]

const getFuture = function () {
    const list = [
        "春风得意，令行如流✨",
    ]

    return list[Math.round(Math.random() * list.length - 1)]
}

export default () => {
    let [future, setFuture] = useState("")
    let [now, setNow] = useState(moment())
    let [startLine, setStartLine] = useState(moment())
    let [deadline, setDeadline] = useState(moment())
    let [holiday, setHoliday] = useState(null)
    let [holidayIndex, setHolidayIndex] = useState(0)
    let [workProcess, setWorkProcess] = useState(0)
    let timer

    useEffect(() => () => {
        clearInterval(timer)
    }, [])

    useEffect(() => {
        setNow(moment())
        setFuture(getFuture())
        timer = setInterval(() => setNow(moment()), 1000 * 60)

        for (const ind in holidays) {
            if (now.unix() > holidays[ind].endDate.unix()) {
                continue
            }

            if (now.unix() < holidays[ind].startDate.unix()) {
                setHoliday(holidays[ind])
                setHolidayIndex(ind)
                break
            }
        }

        // 必须使用 / 分割日期，否则将无法在 Safari 中工作
        setStartLine(moment(`${now.year()}/${now.month() + 1}/${now.date()} 08:00:00`))
        setDeadline(moment(`${now.year()}/${now.month() + 1}/${now.date()} 18:00:00`))
    }, [])

    useEffect(() => {
        let dl = deadline.unix()
        setWorkProcess(Math.round((dl - now.unix()) / (dl - startLine.unix()) * 100))
    }, [now])

    const WorkProcessText = (percent) => {
        return <span>
             {percent}%
            <p className="work-process-text">{Math.round((deadline.unix() - now.unix()) / 60)}mins</p>
        </span>
    }

    function WeekOfNextHoliday() {
        if (holiday === null) {
            return
        }

        return <span className="next-holiday-week">
            {holiday.startDate.week() % 2 === 0 ? "双数周" : "单数周"}
        </span>
    }

    return <Container title="时钟" subTitle="提供精准的时间服务">
        <div className="box">
            <section className="box-item">
                <Row>
                    <Col span={12}>
                        <Row>
                            <Col span={12}>
                                <Title level={2}>今日</Title>
                                <Countdown title="距离下班" value={deadline.unix() * 1000} format="HH:mm:ss:SSS"/>
                            </Col>
                            <Col span={12}>
                                <Progress type="circle" percent={workProcess} width={135} status="active"
                                          format={WorkProcessText}/>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={12}>
                        <Tooltip title={holiday === null ? "-" : `${holiday.remarks}`} placement="topLeft">
                            <Statistic title="下一个法定节假日"
                                       value={holiday === null ? "-" : `${holiday.name}`}
                                       prefix={<GiftOutlined/>}
                                       suffix={<WeekOfNextHoliday/>}
                            />
                        </Tooltip>
                        <p></p>
                        {holiday !== null && <Countdown
                            title="距离下一个法定假日" value={holiday.startDate.unix() * 1000}
                            format="DD[days] HH:mm:ss"/>}
                    </Col>
                </Row>
            </section>
        </div>
        <div className="box">
            <section className="box-item">
                <Row>
                    <Col span={12}>
                        <Statistic title="日" value={now.dayOfYear()} suffix="/ 365"/>
                    </Col>
                    <Col span={12}>
                        <Statistic title="周" value={now.week()}
                                   suffix={`/ 52 ${now.week() % 2 !== 0 ? "单数周" : "双数周"}`}/>
                    </Col>
                </Row>
                <Row>
                    <Col span={19}>
                        <Progress percent={Math.round(now.week() / 52 * 100)} size="small"/>
                    </Col>
                </Row>
            </section>
        </div>
        <div className="box">
            <section className="box-item">
                <Row>
                    <Col span={19}>
                        <Statistic title="法定节假日" value={holidayIndex} suffix={`/ ${holidays.length}`}/>
                        <Progress percent={Math.round(holidayIndex / holidays.length * 100)} size="small"/>
                    </Col>
                </Row>
            </section>
        </div>
        <div className="unborder-box">
            <section className="box-item">
                <Row gutter={16}>
                    <Col span={10}>
                        <Title level={4}>{future}</Title>
                    </Col>
                </Row>
            </section>
        </div>
    </Container>
}
