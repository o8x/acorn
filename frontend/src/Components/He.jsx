import React, {useImperativeHandle} from "react"

export default function (props) {
    const render = () => {
        try {
            document.querySelector("script[data-hefeng]").remove()
            document.querySelector("style[class='AMap.style']").remove()
            for (let se of document.querySelectorAll("style")) {
                if (se.innerText.indexOf(".amap-logo{") !== -1) {
                    se.remove()
                }
            }
        } catch (e) {

        }

        let s = document.createElement("script")
        s.src = "https://widget.qweather.net/standard/static/js/he-standard.js?v=1.4.0"
        s.setAttribute("data-hefeng", "plugin")

        let sn = document.getElementsByTagName("script")[0]
        sn.parentNode.insertBefore(s, sn)
    }

    useImperativeHandle(props.heRef, () => {
        return {
            render,
        }
    })

    return <div id="he-plugin-standard"></div>
}
