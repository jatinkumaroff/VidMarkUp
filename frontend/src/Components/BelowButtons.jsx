import React from "react";
import {
  BsFillPauseFill,
  BsFillPlayFill,
  BsFullscreen,
  BsFullscreenExit,
  BsVolumeMute,
  BsVolumeUpFill,
} from "react-icons/bs";

const BelowButtons = () => {
  return (
    <div className="pb-2 px-2  flex flex-row justify-between items-center">
      <div className="flex flex-row gap-3 items-center">
        <BsFillPlayFill className=" hover:bg-gray-200 rounded-full text-2xl" />
        <div className=" hover:bg-gray-200  rounded-full p-1">00:00/00:00</div>
      </div>
      <div className="flex flex-row gap-4">
        <div className="flex flex-row">
          <BsVolumeUpFill/>
        <input className="w-20" type="range" min={0} max={100} /> 
        </div>
        <BsFullscreen className="mr-2" />
      </div>
    </div>
  );
};

export default BelowButtons;
