import React from "react"

export default function (props) {
    return <>
        <a href="#" onClick={() => window.runtime.BrowserOpenURL(props.href)}>
            {props.children}
        </a>
    </>
}
