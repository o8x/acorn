import React from "react"
import {useParams} from "react-router-dom"
import {Terminal} from "xterm"
import {FitAddon} from "xterm-addon-fit"
import "./Terminal.css"
import Base64 from "crypto-js/enc-base64"
import Utf8 from "crypto-js/enc-utf8"
import Container from "./Container"

const msgData = "1"
const msgResize = "2"
export default function () {
    const {id} = useParams()

    const terminal = new Terminal({
        scrollback: 150,
        cursorBlink: true,
        theme: {
            foreground: "#e6e1cf",
            background: "#0f1419",
            cursor: "#f29718",

            black: "#000000",
            brightBlack: "#323232",

            red: "#ff3333",
            brightRed: "#ff6565",

            green: "#b8cc52",
            brightGreen: "#eafe84",

            yellow: "#e7c547",
            brightYellow: "#fff779",

            blue: "#36a3d9",
            brightBlue: "#68d5ff",

            magenta: "#f07178",
            brightMagenta: "#ffa3aa",

            cyan: "#95e6cb",
            brightCyan: "#c7fffd",

            white: "#ffffff",
            brightWhite: "#ffffff",
        },
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    const webSocket = new WebSocket(`ws://127.0.0.1:30001/ws?id=${id}`)
    webSocket.onmessage = (event) => {
        terminal.write(event.data.toString(Utf8))
    }

    webSocket.onopen = () => {
        let terminalContainer = document.getElementById("xterm")
        terminal.open(terminalContainer)
        terminal.focus()

        setTimeout(() => {
            fitAddon.fit()
        }, 60)
    }

    webSocket.onerror = (event) => {
        console.error(event)
        webSocket.close()
    }

    terminal.onKey((event) => {
        webSocket.send(msgData + Base64.stringify(Utf8.parse(event.key)))
    })

    terminal.onResize(({cols, rows}) => {
        webSocket.send(msgResize + Base64.stringify(Utf8.parse(JSON.stringify({
            columns: cols,
            rows: rows,
        }))))
    })

    window.addEventListener("resize", () => {
        fitAddon.fit()
    }, false)

    return <Container>
        <div id="xterm"></div>
    </Container>
}
