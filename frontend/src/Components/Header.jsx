import React from "react";
import { Link } from "react-router-dom";
const Header = () => {
  return (
    <div className="bg-[#222222] w-full h-[7.5%] flex flex-row justify-between py-4 px-[5%] items-center text-[#a0a0a0] ">
      LOGO/TITLE
      <ul className=" flex flex-row gap-10 text-sm font-semibold">
        <Link to={"/"}>
          <li className="text-[#ffa600] p-2 hover:cursor-pointer">Home</li>
        </Link>
        <Link to={"/notes"}>
          <li className="hover:text-[#ffa600] p-2 hover:cursor-pointer">
            Notes
          </li>
        </Link>
        <Link to={'/developer'}>
          <li className="hover:text-[#ffa600] p-2 hover:cursor-pointer">
            Developer
          </li>
        </Link>
      </ul>
      <span className="hover:text-[#ffa600] p-2 hover:cursor-pointer">
        LOGIN
      </span>
    </div>
    
  );
};

export default Header;
