import React from "react";
import { useRef } from "react";
import ControlPanel from "./ControlPanel"
// import ControlPanel from './ControlPanel'
const VideoPlayer = () => {
  const videoElem = useRef(null);
  const disableRightClick = (e) => e.preventDefault();
  return (
    <div id="Video-Container" className="h-90">
      <video
        muted
        controls
        ref={videoElem}
        src="/sample.mp4"
        onContextMenu={disableRightClick}
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default VideoPlayer;
