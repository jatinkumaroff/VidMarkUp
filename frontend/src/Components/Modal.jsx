import React from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
const Modal = () => {
  return (
    <div className="fixed inset-0 bg-amber-300/55 flex flex-col items-center justify-center">
      <div className="h-11/12 w-11/12 flex flex-col">
        {/*here we will wrap tldraw with a div having flex-1 , which will force it to take space remaining after buttons, otherwise ye apne hisab se poora space le leta and the buttons wouldve got the space beneath it*/}
        <div className="flex-1">
          <Tldraw />
        </div>

        <div className="flex flex-row gap-10 justify-end bg-white px-6 py-2 text-sm font-semibold">
          <div className="text-black px-4 py-1 bg-[#ffa600] rounded">Save</div>
          <div className="text-white px-2 py-1 bg-[#292929] rounded">
            Cancel
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
