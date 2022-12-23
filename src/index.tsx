import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import TRTC, { Client } from "trtc-js-sdk"
import { EXPIRETIME, SDKAPPID, SECRETKEY } from "./const";
import "./index.css"

//@ts-ignore
import * as RTCBeautyPlugin from "rtc-beauty-plugin"
const App = () => {


    // useEffect(() => {
    //     const testChecks = async () => {
    //         const checkResult = await TRTC.checkSystemRequirements()
    //         console.log(`Check System Requirements: ${JSON.stringify(checkResult)}`)
    //         console.log(`Screen Share Support: ${TRTC.isScreenShareSupported()}`)
    //         console.log(`Small Stream Support: ${TRTC.isSmallStreamSupported()}`)
    //         console.log(`Cameras: ${JSON.stringify(TRTC.getCameras())}`)
    //         console.log(`Microphones: ${JSON.stringify(TRTC.getMicrophones())}`)
    //         console.log(`Speakers: ${JSON.stringify(TRTC.getSpeakers())}`)
    //         console.log(`Devices: ${JSON.stringify(TRTC.getDevices())}`)
    //     }
    //     testChecks()
    // }, [])

    const clientRef = useRef<Client>()

    const join = async () => {
        const usernameInput = document.getElementById("username") as HTMLInputElement
        const username = usernameInput.value
        const roomIdInput = document.getElementById("room-id") as HTMLInputElement
        const roomId = Number(roomIdInput.value)

        const signer = new window.LibGenerateTestUserSig(SDKAPPID, SECRETKEY, EXPIRETIME)
        const sign = signer.genTestUserSig(username)

        clientRef.current = TRTC.createClient({
            sdkAppId: SDKAPPID,
            userId: username,
            userSig: sign,
            mode: 'rtc'
        });

        clientRef.current.on('stream-added', event => {
            if (!clientRef.current) {
                alert("client is not initialized.")
                return
            }
            const remoteStream = event.stream;
            const container = document.getElementById("remote-video-container") as HTMLDivElement
            const divForRemote = document.createElement("div")
            divForRemote.id = `remote-video-${remoteStream.getId()}`
            container.appendChild(divForRemote)
            clientRef.current.subscribe(remoteStream);
        });
        clientRef.current.on('stream-subscribed', event => {
            const remoteStream = event.stream;
            console.log('Subscribed to remote stream successfully:' + remoteStream.getId());
            remoteStream.play(`remote-video-${remoteStream.getId()}`);
        });

        await clientRef.current.join({ roomId: roomId });
        const localStream = TRTC.createStream({ userId: username, audio: true, video: true });

        await localStream.initialize()
        localStream.play('local-video-container');

        const beautyPlugin = new RTCBeautyPlugin();
        await beautyPlugin.loadResources();
        // const beautyStream = beautyPlugin.generateBeautyStream(localStream);
        // Publish the retouched stream

        const virtualStream = await beautyPlugin.generateVirtualStream({
            localStream: localStream,
            type: 'blur'
        });

        await clientRef.current.publish(virtualStream);

        // await clientRef.current.publish(localStream);
    }

    const leave = async () => {
        if (!clientRef.current) {
            alert("client is not initialized.")
            return
        }
        await clientRef.current.leave();
        clientRef.current.destroy();
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
            </div>
            <div className="body">
                <div id="remote-video-container"></div>
                <div id="local-video-container"></div>
            </div>
        </div>
    )
}

const container = document.getElementById("app")!;
const root = createRoot(container);
root.render(
    <App></App>
);

