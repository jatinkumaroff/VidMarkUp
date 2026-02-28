import React from "react";

const Timeline = () => {
  return (
    <div className="py-2">
    <div className="h-2 bg-gray-500 rounded-lg relative ">
      <div className="bg-red-500 h-full rounded-full relative w-28">
        <button className="h-4 w-4 rounded-full bg-red-600 absolute -right-2.5 -bottom-0.75" />
      </div>
    </div>
    </div>
  );
};

export default Timeline;
