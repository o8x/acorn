import React from "react"
import {Layout, Menu, Typography} from "antd"
import {Link, Route, Routes} from "react-router-dom"

import {ApartmentOutlined, ToolOutlined} from "@ant-design/icons"
import "./App.css"
import Connect from "./Pages/Connect"
import Transfer from "./Pages/Transfer"
import TransRadix from "./Pages/TransRadix"
import JsonFormat from "./Pages/JsonFormat"
import RegTest from "./Pages/RegTest"
import TextCodec from "./Pages/TextCodec"
import MakePassword from "./Pages/MakePassword"
import Timestamp from "./Pages/Timestamp"

const {Title} = Typography
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
            <Sider collapsible collapsed={collapsed} onCollapse={this.setCollapse}>
                <div className="logo" data-wails-drag>

                </div>
                <Menu theme="dark" defaultSelectedKeys={this.state.selected} mode="inline">
                    <Menu.Item key="0" icon={<ApartmentOutlined/>}>
                        <Link to="/">连接</Link>
                    </Menu.Item>
                    <Menu.SubMenu title="工具" key="2" icon={<ToolOutlined/>}>
                        <Menu.Item key="2_1">
                            <Link to="/tools/json">JSON美化</Link>
                        </Menu.Item>
                        <Menu.Item key="2_2">
                            <Link to="/tools/radix">进制转换</Link>
                        </Menu.Item>
                        <Menu.Item key="2_3">
                            <Link to="/tools/regtest">正则测试</Link>
                        </Menu.Item>
                        <Menu.Item key="2_4">
                            <Link to="/tools/textcodec">文本编解码</Link>
                        </Menu.Item>
                        <Menu.Item key="2_5">
                            <Link to="/tools/makepass">密码生成</Link>
                        </Menu.Item>
                        <Menu.Item key="2_6">
                            <Link to="/tools/timestamp">时间戳转换</Link>
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
