import centosLogo from "../assets/images/centos-logo.png"
import debianLogo from "../assets/images/debian-logo.jpg"
import linuxLogo from "../assets/images/linux-logo.png"
import openwrtLogo from "../assets/images/openwrt-logo.png"
import ubuntuLogo from "../assets/images/ubuntu-logo.png"
import windowsLogo from "../assets/images/windows-logo.png"

export function getLogoSrc(type) {
    switch (type.toLowerCase()) {
        case "centos":
            return centosLogo
        case "debian":
            return debianLogo
        case "openwrt":
            return openwrtLogo
        case "ubuntu":
            return ubuntuLogo
        case "windows":
            return windowsLogo
    }
    return linuxLogo
}
