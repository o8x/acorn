import React from "react"
import {Layout, Menu, Typography} from "antd"
import {Link, Route, Routes} from "react-router-dom"

import {ApartmentOutlined, FileSyncOutlined, ToolOutlined} from "@ant-design/icons"
import "./App.css"
import Connect from "./Pages/Connect"
import Terminal from "./Pages/Terminal"
import Transfer from "./Pages/Transfer"
import TransRadix from "./Pages/TransRadix"
import JsonFormat from "./Pages/JsonFormat"
import RegTest from "./Pages/RegTest"
import TextCodec from "./Pages/TextCodec"

const {Title} = Typography
const {Content, Sider} = Layout

export default class extends React.Component {
    state = {
        collapsed: false, selected: "connect",
    }

    onCollapse = (collapsed) => {
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
            <Sider collapsible collapsed={collapsed} onCollapse={this.onCollapse}>
                <div className="logo" data-wails-drag>
                    Acorn
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
                    </Menu.SubMenu>
                </Menu>
            </Sider>
            <Layout className="site-layout">
                <Content>
                    <Routes>
                        <Route path="/" element={<Connect/>}/>
                        <Route path="/transfer/:id" element={<Transfer/>}/>
                        <Route path="/terminal/:id" element={<Terminal/>}/>
                        <Route path="/tools/radix" element={<TransRadix/>}/>
                        <Route path="/tools/json" element={<JsonFormat/>}/>
                        <Route path="/tools/regtest" element={<RegTest/>}/>
                        <Route path="/tools/textcodec" element={<TextCodec/>}/>
                        <Route path="*" element={<Connect/>}/>
                    </Routes>
                </Content>
            </Layout>
        </Layout>)
    }
}
