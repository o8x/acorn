import React, {useEffect, useState} from "react"
import Container from "./Container"
import {Button, Card, Col, Form, Input, InputNumber, Row, Select, Table} from "antd"
import Decimal from "decimal.js"

const columns = [{
    title: "单位", dataIndex: "unit", width: 100,
}, {
    title: "值", dataIndex: "value", width: 150,
}, {
    title: "备注", dataIndex: "remarks",
}]

export default function () {
    const [goods, setGoods] = useState([])
    const [result, setResult] = useState([])
    const [energy, setEnergy] = useState(0)
    const [protein, setProtein] = useState(0)
    const [total, setTotal] = useState(100)
    const [label, setLabel] = useState("")
    const [historyValue, setHistoryValue] = useState(undefined)
    const [fat, setFat] = useState(0)
    const [carbohydrate, setCarbohydrate] = useState(0)
    const [sodium, setSodium] = useState(0)

    useEffect(() => {
        // http://www.paobushijie.com/nutrition-and-weight-loss/4297-cal
        // https://members.wto.org/crnattachments/2020/TBT/CHN/20_5665_00_x.pdf
        // http://wjw.shanxi.gov.cn/zfxxgk/fdzdgknr/jkzx/202205/t20220517_6002749.shtml
        // 1千焦 = 0.2389kcal
        // 1g碳水 = 4kcal
        // 1g蛋白质 = 4kcal
        // 1g脂肪 = 9kcal
        // 1mg钠 = 2.5mg盐
        // 1公里 = 步行15分钟
        // 1公里 = 消耗70kcal
        // 1公里 = 慢跑7分钟

        // 毛德倩公式

        // 根据《中国居民膳食营养素参考摄入量（2013 版）》，我国成年人（18～49 岁）低身体活动水平者能量需要量男性为 9.41MJ（2250kcal），女性为 7.53MJ（1800kcal）
        const salt = Decimal.mul(sodium, 2.5)
        let kcal = Decimal.mul(energy, 0.2389).add(protein * 4).add(carbohydrate * 4).add(fat * 9)
        if (total !== 0) {
            kcal = Decimal.div(kcal, 100).mul(total)
        }

        let kj = Decimal.mul(kcal, 4.184)
        // 步行公里
        let stepsKm = Decimal.div(kcal, 70)
        let steps = Decimal.mul(stepsKm, 1000).mul(100).div(70)
        // 慢跑公里
        let runKm = Decimal.div(kcal, 90)

        setResult([
            {
                unit: "盐",
                value: `${salt.toFixed(0)}mg (${(salt / 1000).toFixed(2)}g)`,
                remarks: "1mg 钠 ≈ 2.5mg 盐",
            }, {
                unit: "千卡",
                value: `${Decimal.div(kcal, total).mul(100).toFixed(0)} / ${kcal.toFixed(0)}kcal`,
                remarks: `每天推荐摄入 2250kcal${kcal > 2250 ? `，已超出：${Decimal.sub(kcal, 2250).toFixed(0)}kcal` : ""}`,
            }, {
                unit: "千焦",
                value: `${Decimal.div(kj, total).mul(100).toFixed(0)} / ${kj.toFixed(0)}kJ`,
                remarks: `每天推荐摄入 9410kJ${kj > 9410 ? `，已超出：${Decimal.sub(kj, 9410).toFixed(0)}kJ` : ""}`,
            }, {
                unit: "慢跑消耗",
                value: `约 ${runKm.toFixed(2)} 公里`,
                remarks: `${Decimal.mul(runKm, 7).toFixed(0)} 分钟`,
            }, {
                unit: "步行消耗",
                value: `约 ${stepsKm.toFixed(2)} 公里`,
                remarks: `${Decimal.mul(stepsKm, 15).toFixed(1)} 分钟(${steps.toFixed(0)}步)`,
            },
        ])

        setGoods(loadGoods())
    }, [energy, protein, fat, carbohydrate, sodium, total])

    const loadGoods = () => {
        try {
            let parse = JSON.parse(localStorage.getItem("goods-info"))
            if (parse !== null) {
                return parse
            }
        } catch {
        }

        return []
    }

    const loadGoodsItem = (val) => {
        for (const it of loadGoods()) {
            if (it.value === val) {
                setLabel(it.label)
                setHistoryValue(it.value)
                setEnergy(it.energy)
                setProtein(it.protein)
                setFat(it.fat)
                setCarbohydrate(it.carbohydrate)
                setSodium(it.sodium)
                setTotal(it.total)
                return
            }
        }
    }

    const saveGoods = () => {
        if (label === "") {
            return
        }

        let item = {label, value: label, energy, protein, fat, carbohydrate, sodium, total}
        let curr = loadGoods()

        let finded = false
        for (const i in curr) {
            if (curr[i].label === label) {
                curr[i] = item
                finded = true
                break
            }
        }

        if (!finded) {
            curr.push(item)
        }

        setGoods(curr)
        setHistoryValue(item.value)
        localStorage.setItem("goods-info", JSON.stringify(curr))
    }

    return <Container title="营养成分表计算器" subTitle="将营养成分表换算为锻炼(km/mins)和能量(kcal/kJ)单位">
        <Row>
            <Col span={12}>
                <Form labelCol={{span: 5}} wrapperCol={{span: 16}}>
                    <Form.Item label="能量：">
                        <InputNumber placeholder="每100g的能量含量" addonAfter="kJ" min={0} value={energy}
                                     style={{width: "100%"}} onChange={v => v && setEnergy(v)}/>
                    </Form.Item>
                    <Form.Item label="蛋白质：">
                        <InputNumber placeholder="每100g的蛋白质含量" addonAfter="g" min={0} value={protein}
                                     style={{width: "100%"}} onChange={v => v && setProtein(v)}/>
                    </Form.Item>
                    <Form.Item label="脂肪：">
                        <InputNumber placeholder="每100g的脂肪含量" addonAfter="g" min={0} value={fat}
                                     style={{width: "100%"}}
                                     onChange={v => v && setFat(v)}/>
                    </Form.Item>
                    <Form.Item label="碳水">
                        <InputNumber placeholder="每100g的碳水化含量" min={0} addonAfter="g" value={carbohydrate}
                                     style={{width: "100%"}} onChange={v => v && setCarbohydrate(v)}/>
                    </Form.Item>
                    <Form.Item label="钠：">
                        <InputNumber placeholder="每100g的钠含量" addonAfter="mg" min={0} style={{width: "100%"}}
                                     value={sodium}
                                     defaultValue={0}
                                     onChange={v => v && setSodium(v)}/>
                    </Form.Item>
                    <Form.Item label="商品总重：">
                        <InputNumber placeholder="商品总重" addonAfter="g/ml" min={0} style={{width: "100%"}}
                                     value={total}
                                     onChange={v => v && setTotal(v)}/>
                    </Form.Item>
                    <Form.Item label="商品名：">
                        <Input placeholder="商品的名称" onChange={e => setLabel(e.target.value)} value={label}/>
                    </Form.Item>
                    <Form.Item wrapperCol={{offset: 4}}>
                        <Button type="primary" onClick={saveGoods}>保存</Button>
                    </Form.Item>
                </Form>
            </Col>
            <Col span={12}>
                <Form labelCol={{span: 0}}>
                    <Form.Item label="历史记录：">
                        <Select
                            placeholder="查看历史记录"
                            onChange={loadGoodsItem}
                            options={goods}
                            value={historyValue}
                        />
                    </Form.Item>
                </Form>
                <Table
                    size="small"
                    rowKey={() => Math.random()}
                    dataSource={result} pagination={false} columns={columns}
                    scroll={{y: 500}}
                />
                <Card
                    title="基础代谢算法"
                    style={{marginTop: 16}}>
                    <p>毛德倩公式：基础代谢率为（48.5 * 体重kg + 2954.7）/ 4.184，静态生活的活动因数为 1.5。</p>
                    <p>可以得出每日的静息消耗大约为 2362-2623kcal / 564-626kJ (计算用例为 75-90kg 男性)</p>
                </Card>
            </Col>
        </Row>
    </Container>
}
