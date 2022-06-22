import React from "react"
import Container from "./Container"
import {Button, Form, Input, Radio, Space} from "antd"

export default class extends React.Component {
    constructor(prop) {
        super(prop)

        this.state = {
            currentTimestamp: 0,
            timestampIsSecond: false,
            stopTimer: false,
            result: "",
            inputTime: "",
            inputTimestamp: "",
        }
    }

    formatDate = date => {
        if (String(date).length === 10 && this.state.timestampIsSecond) {
            date = date * 1000
        }

        return new Date(date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "numeric",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "PRC",
        })
    }


    updateTS = () => {
        let ts = new Date().getTime()
        this.setState({
            currentTimestamp: Math.ceil(this.state.timestampIsSecond ? Math.ceil(ts / 1000) : ts),
        })
    }

    componentDidMount() {
        this.updateTS()
        this.timer = setInterval(() => !this.state.stopTimer && this.updateTS(), 1000)
    }

    componentWillUnmount() {
        clearInterval(this.timer)
    }

    transferTime = (t, ts) => {
        if (ts === "" && t === "") {
            return
        }

        if (t !== null) {
            ts = new Date(t).getTime()
            return this.setState({
                inputTime: t,
                inputTimestamp: t === "" ? "" : (this.state.timestampIsSecond ? Math.ceil(ts / 1000) : ts),
            })
        }

        this.setState({
            inputTimestamp: ts, inputTime: ts === "" ? "" : this.formatDate(Number(ts)),
        })
    }

    render() {
        return <Container title="时间戳转换" subTitle="支持秒和毫秒级的时间戳与本地时间互转">
            <Form
                labelCol={{span: 4}}
                wrapperCol={{span: 15}}
            >
                <Form.Item name="radio-group" label="时间戳类型">
                    <Radio.Group value={this.state.timestampIsSecond} defaultValue={false}
                                 onChange={e => this.setState({
                                     timestampIsSecond: e.target.value,
                                 })}>
                        <Radio value={true}>秒</Radio>
                        <Radio value={false}>毫秒</Radio>
                    </Radio.Group>
                </Form.Item>
                <Form.Item label="当前时间戳">
                    <Space>
                        <Input value={this.formatDate(this.state.currentTimestamp)}/>
                        <span>-</span>
                        <Input value={this.state.currentTimestamp}/>
                        <Button onClick={() => this.setState({stopTimer: !this.state.stopTimer})}
                        >{this.state.stopTimer ? "继续" : "暂停"}</Button>
                    </Space>
                </Form.Item>
                <Form.Item label="时间戳转换">
                    <Space>
                        <Input placeholder="格式化时间" value={this.state.inputTime}
                               onChange={e => this.transferTime(e.target.value, null)}/>
                        <span>-</span>
                        <Input placeholder="时间戳" value={this.state.inputTimestamp}
                               onChange={e => this.transferTime(null, e.target.value)}/>

                        <Button type="primary"
                                disabled={this.state.inputTime === "" && this.state.inputTimestamp === ""}
                                onClick={() => this.setState({inputTime: "", inputTimestamp: ""})}>清空</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Container>
    }
}
