import React from "react";
import { BsFillPauseFill, BsFillPlayFill, BsFullscreen, BsFullscreenExit, BsVolumeUpFill } from "react-icons/bs";
import { useAppDispatch, useAppSelector } from "../store/store";
import { togglePlay, setVolume, selectIsPlaying, selectVolume, selectCurrentTime, selectDuration } from "../store/playerSlice";
import { selectIsFullscreen } from "../store/uiSlice";

const fmt = (s) => {
  const m   = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const BelowButtons = ({ toggleFS, captureAndMark }) => {
  const dispatch     = useAppDispatch();
  const isPlaying    = useAppSelector(selectIsPlaying);
  const volume       = useAppSelector(selectVolume);
  const currentTime  = useAppSelector(selectCurrentTime);
  const duration     = useAppSelector(selectDuration);
  const isFullscreen = useAppSelector(selectIsFullscreen);

  return (
    <div className="pb-2 px-2 flex flex-row justify-between items-center">

      {/* Left: play + time */}
      <div className="flex flex-row gap-3 items-center">
        <button onClick={() => dispatch(togglePlay())} className="hover:bg-gray-200 rounded-full p-1">
          {isPlaying ? <BsFillPauseFill className="text-2xl" /> : <BsFillPlayFill className="text-2xl" />}
        </button>
        <span className="text-sm">{fmt(currentTime)} / {fmt(duration)}</span>
      </div>

      {/* Centre: Mark */}
      <button
        onClick={captureAndMark}
        className="px-3 py-1 text-xs font-semibold bg-[#ffa600] text-black rounded hover:brightness-110"
      >
        Mark
      </button>

      {/* Right: volume + fullscreen */}
      <div className="flex flex-row gap-4 items-center">
        <div className="flex flex-row items-center gap-1">
          <BsVolumeUpFill />
          <input
            type="range" min={0} max={1} step={0.02}
            value={volume}
            onChange={(e) => dispatch(setVolume(parseFloat(e.target.value)))}
            className="w-20"
          />
        </div>
        <button onClick={toggleFS} className="mr-2">
          {isFullscreen ? <BsFullscreenExit /> : <BsFullscreen />}
        </button>
      </div>

    </div>
  );
};

export default BelowButtons;