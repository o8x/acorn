import React, {useEffect, useState} from "react"
import Container from "./Container"
import "./ScriptEditor.css"
import {Button, Form, Image, Input, message} from "antd"
import {then, ToolService} from "../rpc"

function blobToBase64(blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(blob)
    })
}

export default function (props) {
    let [imageUrl, setImageUrl] = useState("")
    let [loading, setLoading] = useState(false)
    let [image, setImage] = useState(null)
    const ref = React.createRef()

    const onPaste = e => {
        const cbd = e.clipboardData
        for (let i = 0; i < cbd.items.length; i++) {
            let item = cbd.items[i]
            if (item.kind === "file") {
                let blob = item.getAsFile()
                if (blob.size === 0) {
                    return
                }

                return setImage({
                    blob: blob, subfix: `.${blob.type.split("/")[1]}`, src: URL.createObjectURL(blob),
                })
            }
        }
    }

    useEffect(() => {
        let info = localStorage.getItem("cos-info")
        if (info !== null) {
            ref.current.setFieldsValue(JSON.parse(info))
        }

        document.addEventListener("paste", onPaste, false)
        return () => {
            window.onresize = () => null
            document.removeEventListener("paste", onPaste)
        }
    }, [])

    const upload = async () => {
        let values = ref.current.getFieldsValue(true)
        localStorage.setItem("cos-info", JSON.stringify(values))

        if (image === null) {
            return message.info("没有图片需要上传")
        }

        setImageUrl("")
        setLoading(true)

        let b64 = await blobToBase64(image.blob)
        ToolService.UploadBlobToCos({
            subfix: image.subfix,
            blob: b64,
            ...values,
        }).then(then(data => {
            setImageUrl(data.body.u)
            message.success("上传完成")
        })).finally(data => setLoading(false))
    }

    const deleteBlob = url => {
        setLoading(true)
        let values = ref.current.getFieldsValue(true)

        ToolService
            .DeleteBlobFromCos({
                src: url,
                ...values,
            })
            .then(then(() => {
                setImageUrl("")
                setImage(null)
                message.success("删除完成")
            }))
            .finally(() => setLoading(false))
    }

    return <Container title="腾讯对象存储客户端" subTitle="便捷上传图片到腾讯 COS">
        <Form labelCol={{span: 4}} wrapperCol={{span: 16}} ref={ref}>
            <Form.Item label="认证信息" style={{marginBottom: 0}}>
                <Form.Item style={{display: "inline-block", width: "calc(50% - 5px)"}} name="secret_id">
                    <Input placeholder="Secret ID"/>
                </Form.Item>
                <Form.Item style={{display: "inline-block", width: "calc(50% - 5px)", marginLeft: 10}}
                           name="secret_key">
                    <Input.Password placeholder="Secret Key"/>
                </Form.Item>
            </Form.Item>
            <Form.Item label="存储桶" style={{marginBottom: 0}}>
                <Form.Item style={{display: "inline-block", width: "calc(50% - 5px)"}} name="bucket">
                    <Input placeholder="Bucket"/>
                </Form.Item>
                <Form.Item style={{display: "inline-block", width: "calc(50% - 5px)", marginLeft: 10}} name="region">
                    <Input placeholder="Region"/>
                </Form.Item>
            </Form.Item>
            <Form.Item label="待上传图片" style={{marginBottom: 20}}>
                <Image.PreviewGroup>
                    <Image width={150} height={150} src={image === null ? "error" : image.src}/>
                </Image.PreviewGroup>
            </Form.Item>
            <Form.Item label="URL：">
                <Input.Group compact>
                    <Input value={imageUrl} placeholder="图片上传后生成的URL" readOnly disabled={imageUrl === ""}
                           style={{width: imageUrl !== "" ? "calc(100% - 128px)" : ""}}/>
                    {imageUrl !== "" ? <span>
                                <Button type="primary"
                                        onClick={() => window.runtime.BrowserOpenURL(imageUrl)}>预览</Button>
                                <Button danger onClick={() => deleteBlob(imageUrl)}>删除</Button>
                            </span> : ""}
                </Input.Group>
            </Form.Item>
            <Form.Item wrapperCol={{offset: 4}}>
                <Button type="primary" loading={loading} disabled={loading}
                        onClick={!loading && upload}>保存并上传</Button>
            </Form.Item>
        </Form>
    </Container>
}
