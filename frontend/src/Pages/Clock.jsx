import {Col, Progress, Row, Statistic, Typography} from "antd"
import React, {useEffect, useState} from "react"
import Container from "./Container"
import "./Clock.css"
import {GiftOutlined} from "@ant-design/icons"
import moment from "moment"

const {Title} = Typography
const {Countdown} = Statistic

const holidays = [{
    name: "元旦", startDate: moment("2022/01/01 00:00:00"), endDate: moment("2022/01/03 23:59:59"), remarks: "共3天",
}, {
    name: "春节",
    startDate: moment("2022/01/31 00:00:00"),
    endDate: moment("2022/02/06 23:59:59"),
    remarks: "共7天，1月29日（星期六）、1月30日（星期日）上班。",
}, {
    name: "清明节",
    startDate: moment("2022/04/03 00:00:00"),
    endDate: moment("2022/04/05 23:59:59"),
    remarks: "共3天，4月2日（星期六）上班。",
}, {
    name: "劳动节",
    startDate: moment("2022/04/30 00:00:00"),
    endDate: moment("2022/05/04 23:59:59"),
    remarks: "共5天，4月24日（星期日）、5月7日（星期六）上班",
}, {
    name: "端午节", startDate: moment("2022/06/03 00:00:00"), endDate: moment("2022/06/05 23:59:59"), remarks: "共3天",
}, {
    name: "中秋节", startDate: moment("2022/09/09 18:00:00"), endDate: moment("2022/09/12 23:59:59"), remarks: "共3天",
}, {
    name: "国庆节",
    startDate: moment("2022/10/01 00:00:00"),
    endDate: moment("2022/10/07 18:00:00"),
    remarks: "共7天，10月8日（星期六）、10月9日（星期日）上班。",
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
                        <Statistic title="下一个法定节假日"
                                   value={holiday === null ? "-" : `${holiday.name}`}
                                   prefix={<GiftOutlined/>}
                                   suffix={<WeekOfNextHoliday/>}
                        />
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
