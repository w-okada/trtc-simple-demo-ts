import React from "react";
import { createRoot } from "react-dom/client";
import * as trtc from "trtc-js-sdk"
import { EXPIRETIME, SDKAPPID, SECRETKEY } from "./const";
import "./index.css"


const App = () => {
    const signer = new window.LibGenerateTestUserSig(SDKAPPID, SECRETKEY, EXPIRETIME)
    console.log(signer.genTestUserSig("aa"))
    return (
        <div className="root-div">
            <div className="header">
                <div className="header-button" >load</div>
                <div className="header-button" >load</div>
            </div>
            <div className="body">
                <canvas id="test-canvas1" className="left-canvas"></canvas>
                <canvas id="test-canvas2" className="right-canvas"></canvas>
            </div>
        </div>
    )
}

const container = document.getElementById("app")!;
const root = createRoot(container);
root.render(
    <App></App>
);

