import React from "react"
import {Layout, Menu} from "antd"
import {Link, Route, Routes} from "react-router-dom"

import {
    ApartmentOutlined,
    CheckOutlined,
    ClockCircleOutlined,
    CreditCardOutlined,
    EditOutlined,
    FieldStringOutlined,
    FormatPainterOutlined,
    FunctionOutlined,
    ToolOutlined,
} from "@ant-design/icons"

import "./App.css"
import Connect from "./Pages/Connect"
import Transfer from "./Pages/Transfer"
import TransRadix from "./Pages/TransRadix"
import JsonFormat from "./Pages/JsonFormat"
import RegTest from "./Pages/RegTest"
import TextCodec from "./Pages/TextCodec"
import MakePassword from "./Pages/MakePassword"
import Timestamp from "./Pages/Timestamp"

const {Content, Sider} = Layout

export default class extends React.Component {
    state = {
        collapsed: false,
        selected: "0",
    }

    setCollapse = (collapsed) => {
        this.setState({
            collapsed,
        })
    }

    render() {
        const {collapsed} = this.state
        return (<Layout
            style={{
                minHeight: "100vh",
            }}
        >
            <Sider collapsible collapsed={collapsed} onCollapse={this.setCollapse} style={{
                overflow: "auto",
                height: "100vh",
            }}>
                <div className="logo" data-wails-drag onClick={() => this.setCollapse(!collapsed)}></div>
                <Menu theme="dark" defaultSelectedKeys={this.state.selected} mode="inline">
                    <Menu.Item key="0" icon={<ApartmentOutlined/>}>
                        <Link to="/">连接</Link>
                    </Menu.Item>
                    <Menu.Item key="1" icon={<FieldStringOutlined/>}>
                        <Link to="/tools/textcodec">文本编解码</Link>
                    </Menu.Item>
                    <Menu.Item key="2" icon={<FunctionOutlined/>}>
                        <Link to="/tools/radix">进制转换</Link>
                    </Menu.Item>
                    <Menu.Item key="3" icon={<CheckOutlined/>}>
                        <Link to="/tools/regtest">正则测试</Link>
                    </Menu.Item>
                    <Menu.Item key="4" icon={<EditOutlined/>}>
                        <Link to="/tools/hexedit">16进制编辑器</Link>
                    </Menu.Item>
                    <Menu.SubMenu title="工具" key="99" icon={<ToolOutlined/>}>
                        <Menu.Item key="99.1" icon={<FormatPainterOutlined/>}>
                            <Link to="/tools/json">JSON美化</Link>
                        </Menu.Item>
                        <Menu.Item key="99.2" icon={<ClockCircleOutlined/>}>
                            <Link to="/tools/timestamp">时间戳转换</Link>
                        </Menu.Item>
                        <Menu.Item key="99.3" icon={<CreditCardOutlined/>}>
                            <Link to="/tools/makepass">密码生成</Link>
                        </Menu.Item>
                    </Menu.SubMenu>
                </Menu>
            </Sider>
            <Layout className="site-layout">
                <Content>
                    <Routes>
                        <Route path="/" element={<Connect/>}/>
                        <Route path="/transfer/:id" element={<Transfer setCollapse={this.setCollapse}/>}/>
                        <Route path="/tools/radix" element={<TransRadix setCollapse={this.setCollapse}/>}/>}/>
                        <Route path="/tools/json" element={<JsonFormat setCollapse={this.setCollapse}/>}/>}/>
                        <Route path="/tools/regtest" element={<RegTest setCollapse={this.setCollapse}/>}/>}/>
                        <Route path="/tools/textcodec" element={<TextCodec setCollapse={this.setCollapse}/>}/>}/>
                        <Route path="/tools/makepass" element={<MakePassword setCollapse={this.setCollapse}/>}/>}/>
                        <Route path="/tools/timestamp" element={<Timestamp setCollapse={this.setCollapse}/>}/>}/>
                        <Route path="*" element={<Connect/>}/>
                    </Routes>
                </Content>
            </Layout>
        </Layout>)
    }
}
