import {message} from "antd"

export const AppleScriptService = window.go.service.AppleScriptService
export const SessionService = window.go.service.SessionService
export const FileSystemService = window.go.service.FileSystemService
export const ToolService = window.go.service.ToolService
export const StatsService = window.go.service.StatsService
export const TaskService = window.go.service.TaskService

export function then(fn) {
    return data => {
        if (data.status_code === 500) {
            return message.error(`发生内部错误: ${data.message}`)
        }

        if (data.status_code === 400) {
            return message.error(`数据提供错误`)
        }

        if (fn) {
            fn(data)
        }
    }
}
