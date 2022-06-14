import React, {useEffect, useState} from "react"
import Container from "./Container"
import {Form, Input, Segmented, Select} from "antd"
import {Option} from "antd/es/mentions"

const moreRadix = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]

export default function () {
    const [options, setOptions] = useState([2, 4, 8, 10, 16, 20, 32])
    const [originRadix, setOriginRadix] = useState(10)
    const [transRadix, setTransRadix] = useState(10)
    const [originNumber, setOriginNumber] = useState("")
    const [transResult, setTransResult] = useState("")

    function TransRadix() {
        if (originNumber === "") {
            return
        }

        setTransResult(parseInt(originNumber, originRadix).toString(transRadix))
    }

    useEffect(() => {
        TransRadix()
    }, [originRadix, transRadix, originNumber])

    function MoreRadixSelect(props) {
        return <Select style={{width: 80, margin: "0 8px"}}
                       {...props} defaultValue={10}>
            <Option value="">更多</Option>
            {moreRadix.map(num => <Option value={num}>{num}</Option>)}
        </Select>
    }

    return <Container>
        <Form
            labelCol={{span: 4}}
            wrapperCol={{span: 15}}
        >
            <Form.Item label="原始进制：">
                <Segmented value={originRadix} onChange={setOriginRadix} options={options}/>
                <MoreRadixSelect onChange={setOriginRadix}/>
            </Form.Item>
            <Form.Item label="原始数字：">
                <Input onChange={e => setOriginNumber(e.target.value)} value={originNumber}/>
            </Form.Item>
            <Form.Item label="转换进制：">
                <Segmented value={transRadix} onChange={setTransRadix} options={options}/>
                <MoreRadixSelect onChange={setTransRadix}/>
            </Form.Item>
            <Form.Item label="转换结果：">
                <Input value={transResult}/>
            </Form.Item>
        </Form>
    </Container>
}
