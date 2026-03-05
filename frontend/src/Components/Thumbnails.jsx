import React from "react";

const Thumbnails = () => {
  return (
    /* wrapper scales on hover; transform doesn't cause reflow so siblings won't move */
    <div className="group h-55 mb-5 transform-gpu transition-transform duration-400 ease-out hover:scale-105 hover:z-10">
      <div className="w-full rounded-lg overflow-hidden">
        <img
          src="thumbnail.jpg"
          alt=""
          className="w-full h-55 object-cover"
        />
      </div>

      <p className="text-[#e6e6e6] p-2 text-sm text-center">
        Two Sum - Leetcode 1 - HashMap - C++
      </p>
    </div>
  );
};

export default Thumbnails;