import React from "react"
import {Modal} from "antd"

export default class CustomModal extends React.Component {
    state = {
        width: 600,
        title: "",
        content: "",
        show: false,
        style: {},
        renderHTML: null,
        handleOK: () => null,
        handleCancel: () => null,
    }

    setContent(content) {
        this.setState({content})
    }

    setTitle(title) {
        this.setState({title})
    }

    setStyle(style) {
        this.setState({style})
    }

    setWidth(width) {
        this.setState({width})
    }

    show = (ok, cancel) => {
        if (ok !== null) {
            this.setState({handleOK: ok})
        }

        if (cancel !== null) {
            this.setState({handleCancel: cancel})
        }

        this.setState({show: true})
    }

    close = () => {
        this.setState({show: false})
    }

    render() {
        return <Modal title={this.state.title}
                      visible={this.state.show}
                      style={this.state.style}
                      onOk={() => {
                          this.close()
                          this.state.handleOK()
                      }}
                      onCancel={() => {
                          this.close()
                          this.state.handleCancel ? this.state.handleCancel() : ""
                      }}
                      okText="确认"
                      cancelText="取消"
                      width={this.state.width}
        >
            <p>{this.state.content}</p>
        </Modal>
    }
}

export {
    CustomModal,
}
