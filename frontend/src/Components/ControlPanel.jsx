import React from "react";
import Timeline from "./Timeline";
import BelowButtons from "./BelowButtons";

const ControlPanel = ({ seekTo, toggleFS, captureAndMark, markers, onMarkerClick, onMarkerEdit }) => {
  return (
    <div className="w-full bg-white/95 py-[1.5%] px-[1.5%]">
      <Timeline
        seekTo={seekTo}
        markers={markers}
        onMarkerClick={onMarkerClick}
        onMarkerEdit={onMarkerEdit}
      />
      <BelowButtons toggleFS={toggleFS} captureAndMark={captureAndMark} />
    </div>
  );
};

export default ControlPanel;