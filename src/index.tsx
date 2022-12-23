import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import TRTC, { Client, LocalStream } from "trtc-js-sdk"
import { EXPIRETIME, SDKAPPID, SECRETKEY } from "./const";
import "./index.css"

const MediaType = {
    camera: "camera",
    movie: "movie",
} as const
type MediaType = typeof MediaType[keyof typeof MediaType]

const App = () => {
    const clientRef = useRef<Client | null>(null)
    const usernameRef = useRef<string>("")
    const localStreamRef = useRef<LocalStream | null>(null)

    const mediaTypeRef = useRef<MediaType>("camera")
    const [mediaType, _setMediaType] = useState<MediaType>(mediaTypeRef.current)
    const setMediaType = (val: MediaType) => {
        mediaTypeRef.current = val
        _setMediaType(mediaTypeRef.current)
    }
    useEffect(() => {
        publishLocalStream()
    }, [mediaType])


    const publishLocalStream = async () => {
        if (!clientRef.current) {
            return
        }
        if (localStreamRef.current) {
            await clientRef.current.unpublish(localStreamRef.current);
            localStreamRef.current.stop()
            localStreamRef.current.close()
            localStreamRef.current = null
        }

        if (mediaTypeRef.current == "camera") {
            localStreamRef.current = TRTC.createStream({ userId: usernameRef.current, audio: true, video: true });
            const div = document.getElementById("local-video-container") as HTMLDivElement
            div.style.transform = ""

        } else {
            const canvas = document.createElement("canvas")
            const video = document.getElementById("input-video") as HTMLVideoElement
            canvas.width = 640
            canvas.height = 480
            const logo = document.getElementById("logo") as HTMLImageElement
            video.play()
            video.loop = true

            const drawCanvas = () => {
                const ctx = canvas.getContext("2d")!
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                ctx.drawImage(logo, canvas.width - logo.width - 10, canvas.height - logo.height - 10, logo.width, logo.height)
                if (mediaTypeRef.current == "movie") {
                    requestAnimationFrame(drawCanvas)
                }
            }
            drawCanvas()
            const canvasStream = canvas.captureStream();
            localStreamRef.current = TRTC.createStream({ userId: usernameRef.current, videoSource: canvasStream.getVideoTracks()[0] });
            const div = document.getElementById("local-video-container") as HTMLDivElement
            div.style.transform = "scaleX(-1)"
        }
        await localStreamRef.current.initialize()
        localStreamRef.current.play('local-video-container');

        await clientRef.current.publish(localStreamRef.current);
    }

    const join = async () => {
        const usernameInput = document.getElementById("username") as HTMLInputElement
        usernameRef.current = usernameInput.value
        const roomIdInput = document.getElementById("room-id") as HTMLInputElement
        const roomId = Number(roomIdInput.value)

        const signer = new window.LibGenerateTestUserSig(SDKAPPID, SECRETKEY, EXPIRETIME)
        const sign = signer.genTestUserSig(usernameRef.current)

        clientRef.current = TRTC.createClient({
            sdkAppId: SDKAPPID,
            userId: usernameRef.current,
            userSig: sign,
            mode: 'rtc'
        });

        clientRef.current.on('stream-added', event => {
            if (!clientRef.current) {
                alert("client is not initialized.")
                return
            }
            const remoteStream = event.stream;
            clientRef.current.subscribe(remoteStream);
        });
        clientRef.current.on('stream-subscribed', event => {
            const remoteStream = event.stream;
            console.log('Subscribed to remote stream successfully:' + remoteStream.getId());
            remoteStream.play(`remote-video-container`);
        });

        await clientRef.current.join({ roomId: roomId });
        await publishLocalStream()
    }

    const leave = async () => {
        if (!clientRef.current) {
            alert("client is not initialized.")
            return
        }
        await clientRef.current.leave();
        clientRef.current.destroy();
        clientRef.current = null

        if (localStreamRef.current) {
            localStreamRef.current.stop()
            localStreamRef.current.close()
            localStreamRef.current = null
        }
    }

    return (
        <div className="root-div">
            <div className="header">
                <div className="header-item-container">
                    <div className="header-label">username</div>
                    <input type="text" id="username"></input>
                </div>
                <div className="header-item-container">
                    <div className="header-label">room id</div>
                    <input type="number" id="room-id"></input>
                </div>
                <div className="header-item-container">
                    <div className="header-button" onClick={join}>enter</div>
                </div>
                <div className="header-item-container">
                    <div className="header-button" onClick={leave}>leave</div>
                </div>

                <div className="header-item-container">
                    <div className="header-label">media type</div>
                    <select onChange={(e) => { setMediaType(e.target.value as MediaType) }}>
                        {Object.values(MediaType).map(x => {
                            return (<option value={x} key={x}>{x}</option>)
                        })}
                    </select>

                </div>
            </div>
            <div className="body">
                <div className="local-resources">
                    <div id="local-video-element-container">
                        <video src="Woman.mp4" controls id="input-video" className="local-video-element"></video>
                    </div>
                    <div id="local-video-container"></div>
                </div>
                <div id="remote-video-container" className="remote-video-container"></div>
            </div>
            <div className="hidden-resources">
                <img src="./pixabay_logo.png" id="logo" />
            </div>
        </div>
    )
}

const container = document.getElementById("app")!;
const root = createRoot(container);
root.render(
    <App></App>
);

