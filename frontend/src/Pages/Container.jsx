import React from "react"

export default class extends React.Component {
    render() {
        return <>
            <div
                className="site-layout-background"
                style={{
                    padding: 16,
                    height: "100%",
                }}
            >
                {this.props.children}
            </div>
        </>
    }
}
