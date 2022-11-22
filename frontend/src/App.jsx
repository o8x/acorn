import React, {useEffect, useState} from "react"
import {Layout, Menu, notification} from "antd"
import {Route, Routes, useNavigate} from "react-router-dom"

import {
    ApartmentOutlined,
    BorderlessTableOutlined,
    BugOutlined,
    CheckOutlined,
    ClockCircleOutlined,
    ControlOutlined,
    CreditCardOutlined,
    EditOutlined,
    EyeOutlined,
    FieldStringOutlined,
    FieldTimeOutlined,
    FormatPainterOutlined,
    FunctionOutlined,
    HomeOutlined,
    ToolOutlined,
} from "@ant-design/icons"

import "./App.css"
import Connect from "./Pages/Connect"
import Transfer from "./Pages/Transfer"
import TransRadix from "./Pages/TransRadix"
import JsonFormat from "./Pages/JsonFormat"
import ScriptEditor from "./Pages/ScriptEditor"
import RegTest from "./Pages/RegTest"
import TextCodec from "./Pages/TextCodec"
import MakePassword from "./Pages/MakePassword"
import Timestamp from "./Pages/Timestamp"
import ASCIITable from "./Pages/ASCIITable"
import Clock from "./Pages/Clock"
import Home from "./Pages/Home"
import ProxyIPTester from "./Pages/ProxyIPTester"

const {Content, Sider} = Layout

function getItem(label, key, icon, children, type) {
    return {
        key,
        icon,
        children,
        label,
        type,
    }
}

const items = [
    getItem("Home", "/", <HomeOutlined/>),
    getItem("Sessions", "/connect", <ApartmentOutlined/>),
    getItem("Codec", "/tools/textcodec", <FieldStringOutlined/>),
    getItem("Json beautifier", "/tools/json", <FormatPainterOutlined/>),
    getItem("Regular expression", "/tools/regtest", <CheckOutlined/>),
    getItem("Radix", "/tools/radix", <FunctionOutlined/>),
    getItem("Timestamp", "/tools/timestamp", <ClockCircleOutlined/>),
    getItem("cURL GUI", "/tools/proxyiptester", <BugOutlined/>),
    getItem("Toys", "/tools/toys", <ToolOutlined/>, [
        getItem("Clock", "/tools/clock", <FieldTimeOutlined/>),
        getItem("Script", "/tools/scripteditor", <EditOutlined/>),
        getItem("Password", "/tools/makepass", <CreditCardOutlined/>),
        getItem("Ascii", "/tools/ascii", <BorderlessTableOutlined/>, [
            getItem("Visible chars", "/tools/ascii/visible", <EyeOutlined/>),
            getItem("Control chars", "/tools/ascii/control", <ControlOutlined/>),
        ]),
    ]),
]

export default function (props) {
    const navigate = useNavigate()
    const [collapsed, setCollapsed] = useState(true)
    const [selected, setSelected] = useState("/")
    const [theme, setTheme] = useState("light")

    useEffect(() => {
        setSelected(location.hash.replace("#", ""))

        window.runtime.EventsOn("message", data => {
            const config = {
                message: data.title,
                description: data.message,
                duration: 2,
            }

            switch (data.type) {
                case "success":
                    notification.success(config)
                    break
                case "error":
                    notification.error(config)
                    break
                case "warning":
                    notification.warning(config)
                    break
                case "info":
                    notification.info(config)
                    break
            }
        })
    }, [])

    const onSelect = ({key}) => {
        navigate(key)
        setSelected(key)
    }

    return (<Layout
        style={{
            minHeight: "100vh",
        }}
    >
        <Sider theme={theme} collapsible collapsed={collapsed} onCollapse={setCollapsed} style={{
            overflow: "auto",
            height: "calc(100vh - 48px)",
        }}>
            <div className="logo" onClick={() => setCollapsed(!collapsed)}></div>
            <Menu theme={theme} selectedKeys={selected} mode="inline" items={items} onSelect={onSelect}/>
        </Sider>
        <Layout className="site-layout">
            <Content>
                <Routes>
                    <Route path="/transfer/:id"
                           element={<Transfer collapsed={collapsed} setCollapse={setCollapsed}/>}
                    />
                    <Route path="/tools/radix"
                           element={<TransRadix collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/tools/json"
                           element={<JsonFormat collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/tools/regtest"
                           element={<RegTest collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/tools/textcodec"
                           element={<TextCodec collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/tools/makepass"
                           element={<MakePassword collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/tools/timestamp"
                           element={<Timestamp collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/tools/ascii/:type"
                           element={<ASCIITable collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/tools/clock/"
                           element={<Clock collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/tools/scripteditor/"
                           element={<ScriptEditor collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/tools/proxyiptester/"
                           element={<ProxyIPTester collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/connect"
                           element={<Connect collapsed={collapsed} setCollapse={setCollapsed}/>}
                    />
                    <Route path="/"
                           element={<Home collapsed={collapsed} setCollapse={setCollapsed}/>}
                    />
                    <Route path="*"
                           element={<Home collapsed={collapsed} setCollapse={setCollapsed}/>}
                    />
                </Routes>
            </Content>
        </Layout>
    </Layout>)
}
