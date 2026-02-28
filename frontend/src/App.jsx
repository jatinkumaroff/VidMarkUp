import React from "react";
import ReactDOM from "react-dom/client";
import "../index.css";
import {
  Outlet,
  RouterProvider,
  createBrowserRouter,
  Link,
} from "react-router-dom";
import VideoPlayer from "./pages/VideoPlayer";
import Notes from "./pages/Notes";
import Header from "./Components/Header";
import Developer from "./pages/Developer";

const Layout = () => {
  return (
    <div className="h-screen flex flex-col bg-[#222222]">
      <Header />
      <Outlet />
    </div>
  );
};

const appRouter = createBrowserRouter([
  //takes array of children objects
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true, //index true is for using default / path
        element: <VideoPlayer />,
      },
      {
        path: "notes",
        element: <Notes />,
      },
      {
        path: "developer",
        element: <Developer />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={appRouter} />,
);
