import React from "react"
import CodeMirror from "@uiw/react-codemirror"
import {xcodeLight} from "@uiw/codemirror-theme-xcode"
import {StreamLanguage} from "@codemirror/language"
import {shell} from "@codemirror/legacy-modes/mode/shell"
import {basicSetup} from "codemirror"
import {EditorView} from "@codemirror/view"

export default function (props) {
    let height = "350px"
    if (props.height) {
        height = props.height
    }

    let extensions = [basicSetup, StreamLanguage.define(shell)]
    if (props.autowrap) {
        extensions.push(EditorView.lineWrapping)
    }

    return <div className="editor">
        <CodeMirror
            value={props.value}
            height={height}
            maxHeight={height}
            width="100%"
            maxWidth="100%"
            extensions={extensions}
            theme={xcodeLight}
            onChange={(value, _) => {
                if (props.onChange) {
                    props.onChange(value)
                }
            }}
        />
    </div>
}
