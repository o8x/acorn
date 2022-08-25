import React from "react"
import CodeMirror from "@uiw/react-codemirror"
import {xcodeLight} from "@uiw/codemirror-theme-xcode"
import {StreamLanguage} from "@codemirror/language"
import {shell} from "@codemirror/legacy-modes/mode/shell"
import {basicSetup} from "codemirror"

export default function (props) {
    let height = "350px"
    if (props.height) {
        height = props.height
    }

    return <div className="editor">
        <CodeMirror
            value={props.value}
            height={height}
            maxHeight={height}
            width="100%"
            maxWidth="100%"
            extensions={[basicSetup, StreamLanguage.define(shell)]}
            theme={xcodeLight}
            onChange={(value, _) => {
                props.onChange(value)
            }}
        />
    </div>
}
