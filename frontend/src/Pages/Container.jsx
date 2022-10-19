import React, {useEffect, useState} from "react"
import {PageHeader} from "antd"

export default function (props) {
    let [containerHeight, setContainerHeight] = useState(window.innerHeight - 72)

    useEffect(() => {
        window.onresize = () => {
            setContainerHeight(window.innerHeight - 72)
        }

        return () => window.onresize = null
    }, [])

    return <>
        <div style={{"--wails-draggable": "drag"}}>
            {props.title === "" && props.subTitle === "" ? "" : <PageHeader
                title={props.title}
                subTitle={props.subTitle}
            />}
        </div>
        <div
            className="site-layout-background"
            style={{
                padding: 16,
                height: containerHeight,
                overflow: props.overflowHidden ? "hidden" : "auto",
            }}
        >
            {props.children}
        </div>
    </>
}
