import React from "react";
import { useRef } from "react";
import ControlPanel from "../Components/ControlPanel";
import VideoUpper from "../Components/VideoUpper";
import Modal from "../Components/Modal";
const VideoPlayer = () => {
  const videoElem = useRef(null);
  const containerElem = useRef(null);
  const disableRightClick = (e) => e.preventDefault();
  return (
    <div
      ref={containerElem}
      id="CONTAINER"
      className="w-270 mx-auto relative border"
    >
      <video
        muted
        ref={videoElem}
        src="/sample.mp4"
        onContextMenu={disableRightClick}
        crossOrigin="anonymous"
      />
      <VideoUpper />
      <ControlPanel />
      <Modal/>
    </div>
  );
};

export default VideoPlayer;
