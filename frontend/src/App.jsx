import React, {useEffect, useState} from "react"
import {Layout, Menu, notification} from "antd"
import {Route, Routes, useNavigate} from "react-router-dom"

import {
    ApartmentOutlined,
    BorderlessTableOutlined,
    BugOutlined,
    CheckOutlined,
    ClockCircleOutlined,
    CloudServerOutlined,
    ControlOutlined,
    CreditCardOutlined,
    EditOutlined,
    EyeOutlined,
    FieldStringOutlined,
    FieldTimeOutlined,
    FormatPainterOutlined,
    FunctionOutlined,
    HomeOutlined,
    RobotOutlined,
    ToolOutlined,
} from "@ant-design/icons"

import "./App.css"
import Connect from "./Pages/Connect"
import Transfer from "./Pages/Transfer"
import TransRadix from "./Pages/TransRadix"
import JsonFormat from "./Pages/JsonFormat"
import ScriptEditor from "./Pages/ScriptEditor"
import RegTest from "./Pages/RegTest"
import TencentCos from "./Pages/TencentCos"
import TextCodec from "./Pages/TextCodec"
import MakePassword from "./Pages/MakePassword"
import Timestamp from "./Pages/Timestamp"
import ASCIITable from "./Pages/ASCIITable"
import Clock from "./Pages/Clock"
import Home from "./Pages/Home"
import ProxyIPTester from "./Pages/ProxyIPTester"
import Automation from "./Pages/Automation"
import {SettingService, then} from "./rpc"

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
    getItem("Sessions", "/toy-remote", <ApartmentOutlined/>),
    getItem("Automation", "/toy-automation", <RobotOutlined/>),
    getItem("Codec", "/toy-textcodec", <FieldStringOutlined/>),
    getItem("Json beautifier", "/toy-json", <FormatPainterOutlined/>),
    getItem("Regular expression", "/toy-regtest", <CheckOutlined/>),
    getItem("Radix", "/toy-radix", <FunctionOutlined/>),
    getItem("Timestamp", "/toy-timestamp", <ClockCircleOutlined/>),
    getItem("cURL GUI", "/toy-proxyiptester", <BugOutlined/>),
    getItem("Toys", "/toy-toys", <ToolOutlined/>, [
        getItem("Clock", "/toy-clock", <FieldTimeOutlined/>),
        getItem("Tencent COS", "/toy-cos", <CloudServerOutlined/>),
        getItem("Script", "/toy-scripteditor", <EditOutlined/>),
        getItem("Password", "/toy-makepass", <CreditCardOutlined/>),
        getItem("Ascii", "/toy-ascii", <BorderlessTableOutlined/>, [
            getItem("Visible chars", "/toy-ascii/visible", <EyeOutlined/>),
            getItem("Control chars", "/toy-ascii/control", <ControlOutlined/>),
        ]),
    ]),
]

export default function (props) {
    const navigate = useNavigate()
    const [collapsed, setCollapsed] = useState(true)
    const [selected, setSelected] = useState("/")
    const [theme, setTheme] = useState("light")
    const [gray, setGray] = useState(false)

    useEffect(() => {
        setSelected(location.hash.replace("#", ""))
        resetTheme()

        window.runtime.EventsOn("update-theme", resetTheme)
        window.runtime.EventsOn("navigator", key => {
            onSelect({key})
        })

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

    const resetTheme = () => {
        SettingService.GetTheme().then(then(data => {
            if (data.body === "gray") {
                setTheme("dark")
                setGray(true)
            } else {
                setTheme(data.body)
                setGray(false)
            }
        }))
    }

    const onSelect = ({key}) => {
        navigate(key)
        setSelected(key)
    }

    return (<Layout
        className={gray ? "gray-theme" : ""}
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
                    <Route path="/toy-remote/transfer/:id"
                           element={<Transfer collapsed={collapsed} setCollapse={setCollapsed}/>}
                    />
                    <Route path="/toy-radix"
                           element={<TransRadix collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/toy-json"
                           element={<JsonFormat collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/toy-regtest"
                           element={<RegTest collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/toy-textcodec"
                           element={<TextCodec collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/toy-makepass"
                           element={<MakePassword collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/toy-timestamp"
                           element={<Timestamp collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/toy-ascii/:type"
                           element={<ASCIITable collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/toy-clock/"
                           element={<Clock collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/toy-scripteditor/"
                           element={<ScriptEditor collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/toy-proxyiptester/"
                           element={<ProxyIPTester collapsed={collapsed} setCollapse={setCollapsed}/>}/>}
                    />
                    <Route path="/toy-remote"
                           element={<Connect collapsed={collapsed} setCollapse={setCollapsed}/>}
                    />
                    <Route path="/toy-automation"
                           element={<Automation collapsed={collapsed} setCollapse={setCollapsed}/>}
                    />
                    <Route path="/toy-cos"
                           element={<TencentCos collapsed={collapsed} setCollapse={setCollapsed}/>}
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
