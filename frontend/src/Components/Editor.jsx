import React from "react"
import CodeMirror from "@uiw/react-codemirror"
import {xcodeLight} from "@uiw/codemirror-theme-xcode"
import {StreamLanguage} from "@codemirror/language"
import {shell} from "@codemirror/legacy-modes/mode/shell"
import {yaml} from "@codemirror/legacy-modes/mode/yaml"
import {basicSetup} from "codemirror"
import {EditorView} from "@codemirror/view"
import {cmake} from "@codemirror/legacy-modes/mode/cmake"
import {dockerFile} from "@codemirror/legacy-modes/mode/dockerfile"
import {powerShell} from "@codemirror/legacy-modes/mode/powershell"
import {go} from "@codemirror/legacy-modes/mode/go"
import {http} from "@codemirror/legacy-modes/mode/http"
import {javascript} from "@codemirror/legacy-modes/mode/javascript"
import {lua} from "@codemirror/legacy-modes/mode/lua"
import {nginx} from "@codemirror/legacy-modes/mode/nginx"
import {python} from "@codemirror/legacy-modes/mode/python"
import {rust} from "@codemirror/legacy-modes/mode/rust"
import {sql} from "@codemirror/legacy-modes/mode/sql"
import {swift} from "@codemirror/legacy-modes/mode/swift"
import {toml} from "@codemirror/legacy-modes/mode/toml"
import {vb} from "@codemirror/legacy-modes/mode/vb"
import {xml} from "@codemirror/legacy-modes/mode/xml"

export default function (props) {
    let height = "350px"
    if (props.height) {
        height = props.height
    }

    let lang
    switch (props.lang) {
        case "cmake":
            lang = cmake
            break
        case "dockerfile":
            lang = dockerFile
            break
        case "go":
            lang = go
            break
        case "http":
            lang = http
            break
        case "javascript":
            lang = javascript
            break
        case "lua":
            lang = lua
            break
        case "nginx":
            lang = nginx
            break
        case "powershell":
            lang = powerShell
            break
        case "python":
            lang = python
            break
        case "rust":
            lang = rust
            break
        case "sql":
            lang = sql
            break
        case "swift":
            lang = swift
            break
        case "toml":
            lang = toml
            break
        case "vb":
            lang = vb
            break
        case "xml":
            lang = xml
            break
        case "yaml":
            lang = yaml
            break
        default:
            lang = shell
    }

    let extensions = [basicSetup, StreamLanguage.define(lang)]
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
            readOnly={!!props.readonly}
            onChange={(value, _) => {
                if (props.onChange) {
                    props.onChange(value)
                }
            }}
        />
    </div>
}
