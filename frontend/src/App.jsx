import React from "react"
import {Layout, Menu, PageHeader, Typography} from "antd"
import {Link, Route, Routes} from "react-router-dom"

import {ApartmentOutlined, FileSyncOutlined, ToolOutlined} from "@ant-design/icons"
import "./App.css"
import Connect from "./Pages/Connect"
import Terminal from "./Pages/Terminal"

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
                        <Link to="/connect">连接</Link>
                    </Menu.Item>
                    <Menu.Item key="1" icon={<FileSyncOutlined/>}>
                        <Link to="/transfer">文件传输</Link>
                    </Menu.Item>
                    <Menu.SubMenu title="工具" key="2" icon={<ToolOutlined/>}>
                        <Menu.Item key="2_1">JSON美化</Menu.Item>,
                        <Menu.Item key="2_2">进制转换</Menu.Item>,
                        <Menu.Item key="2_3">正则表达式测试</Menu.Item>,
                        <Menu.Item key="2_4">文本编解码</Menu.Item>,
                        <Menu.Item key="2_5">短链接生成</Menu.Item>,
                        <Menu.Item key="2_6">二维码解析与生成</Menu.Item>,
                    </Menu.SubMenu>
                </Menu>
            </Sider>
            <Layout className="site-layout">
                <div data-wails-drag>
                    <PageHeader
                        className="site-page-header"
                        title="CONNECT"
                        subTitle="快速连接 SSH"
                    />
                </div>

                <Content>
                    <Routes>
                        <Route path="/connect" element={<Connect/>}/>
                        <Route path="/terminal/:id" element={<Terminal/>}/>
                        <Route path="*"element={<Connect/>}/>
                    </Routes>
                </Content>
            </Layout>
        </Layout>)
    }
}
