import React from "react"
import {PageHeader} from "antd"

export default class extends React.Component {
    render() {
        return <>
            <div style={{"--wails-draggable": "drag"}}>
                <PageHeader
                    title={this.props.title}
                    subTitle={this.props.subTitle}
                />
            </div>
            <div
                className="site-layout-background"
                style={{
                    padding: 16,
                    height: "calc(100% - 72px)",
                }}
            >
                {this.props.children}
            </div>
        </>
    }
}
