// src/Components/Header.jsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/store";
import { selectVideoId } from "../store/playerSlice";

const Header = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const videoId = useAppSelector(selectVideoId);

  const active = (path) =>
    pathname.startsWith(path) ? "text-[#ffa600]" : "hover:text-[#ffa600]";

  // "Home" goes back to the current video if one is loaded, otherwise dashboard
  const handleHome = () => {
    if (videoId) navigate(`/player/${videoId}`);
    else navigate("/");
  };

  return (
    <div className="bg-[#222222] w-full h-[7.5%] flex flex-row justify-between py-4 px-[5%] items-center text-[#a0a0a0]">
      {/* ← Dashboard — always visible in header */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 text-sm text-[#a0a0a0] hover:text-[#ffa600] transition-colors"
      >
        <span>←</span>
        <span>Dashboard</span>
      </button>

      <ul className="flex flex-row gap-10 text-sm font-semibold">
        <li
          onClick={handleHome}
          className={`${videoId ? active(`/player/${videoId}`) : ""} p-2 cursor-pointer transition-colors`}
        >
          Home
        </li>
        <Link to="/notes">
          <li
            className={`${active("/notes")} p-2 cursor-pointer transition-colors`}
          >
            Notes
          </li>
        </Link>
        {/* <Link to="/developer">
          <li
            className={`${active("/developer")} p-2 cursor-pointer transition-colors`}
          >
            Developer
          </li>
        </Link> */}
      </ul>

      <span className="hover:text-[#ffa600] p-2 cursor-pointer transition-colors">
        LOGIN
      </span>
    </div>
  );
};

export default Header;
